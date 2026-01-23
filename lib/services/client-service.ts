import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import crypto from "crypto"
import { ClientCreateSchema } from "@/lib/validations/client"
import { sanitizeFormData, prepareForPrisma } from "@/lib/utils/data-sanitizer"

// --- Encryption Helper ---
const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default_secret_key').digest(); // 32 bytes Buffer
const IV_LENGTH = 16;

function encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
    if (!text) return text;
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// --- Validation Schemas moved to @/lib/validations/client.ts ---


export const ClientService = {
    // LIST: Always filters by userId, optionally by search term
    getClients: async (userId: string, search?: string) => {
        return await db.client.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { cpfCnpj: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                cpfCnpj: true,
                email: true,
                whatsapp: true,
                status: true,
                // NEVER return govAccessPassword in lists
            }
        })
    },

    getById: async (userId: string, clientId: string) => {
        const client = await db.client.findFirst({
            where: { id: clientId, userId, deletedAt: null },
            include: {
                processes: { where: { deletedAt: null } },
                tasks: { where: { phase: { not: 'PROTOCOLLED' } } } // Example filter
            }
        })

        if (client && client.govAccessPassword) {
            // Decrypt for authorized viewer (Admin/User who owns it)
            // Since RLS logic ensures userId matches, we decrypt.
            client.govAccessPassword = decrypt(client.govAccessPassword)
        }

        return client
    },

    createClient: async (userId: string, data: z.infer<typeof ClientCreateSchema>) => {
        // Sanitize ALL input data to prevent serialization errors
        const sanitized = sanitizeFormData(data)
        const validated = ClientCreateSchema.parse(sanitized) // Throws if invalid

        // Encrypt sensitive
        if (validated.govAccessPassword) {
            validated.govAccessPassword = encrypt(validated.govAccessPassword)
        }

        // Prepare data for Prisma, ensuring all values are serializable
        const clientData = prepareForPrisma({
            userId,
            name: validated.name,
            type: validated.type,
            cpfCnpj: validated.cpfCnpj,
            email: validated.email || null,
            whatsapp: validated.whatsapp || null,
            rg: validated.rg || null,
            ctps: validated.ctps || null,
            pis: validated.pis || null,
            fatherName: validated.fatherName || null,
            motherName: validated.motherName || null,
            messageContactName: validated.messageContactName || null,
            messageContactRelation: validated.messageContactRelation || null,
            acquisitionChannel: validated.acquisitionChannel || null,
            govAccessPassword: validated.govAccessPassword || null,
            bankDetails: validated.bankDetails || null,
            address: validated.address && Object.keys(validated.address).length > 0
                ? validated.address
                : null,
            contacts: validated.phone ? { phone: validated.phone } : null,
            status: 'NEW_LEAD'
        })

        return await db.client.create({
            data: clientData
        })
    },

    updateClient: async (userId: string, clientId: string, data: Partial<z.infer<typeof ClientCreateSchema>>) => {
        // Sanitize input data
        const sanitized = sanitizeFormData(data)

        // Encrypt password if present
        if (sanitized.govAccessPassword) {
            sanitized.govAccessPassword = encrypt(sanitized.govAccessPassword)
        }

        // Prepare update data
        const updateData: any = { ...sanitized };
        const { address, phone, ...restData } = updateData;

        const finalData = prepareForPrisma({
            ...restData,
            address: address && Object.keys(address).length > 0 ? address : undefined,
            contacts: phone ? { phone } : undefined
        })

        return await db.client.update({
            where: { id: clientId, userId }, // Enforce ownership
            data: finalData
        })
    },

    softDelete: async (userId: string, clientId: string) => {
        return await db.client.update({
            where: { id: clientId, userId },
            data: { deletedAt: new Date() }
        })
    }
}
