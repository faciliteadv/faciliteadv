import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import crypto from "crypto"

// --- Encryption Helper ---
const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes. Using sha256 to hash the passphrase is a reliable way to get 32 bytes.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default_secret_key').digest(); // 32 bytes Buffer
const IV_LENGTH = 16;

function encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv); // Use the Buffer directly
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

// --- Validation Schemas ---
export const ClientCreateSchema = z.object({
    name: z.string().min(2),
    type: z.enum(["PF", "PJ"]),
    cpfCnpj: z.string().min(11, "Documento inválido"), // Add sophisticated validation logic if needed
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(), // Main phone
    whatsapp: z.string().optional(),
    rg: z.string().optional(),
    ctps: z.string().optional(),
    pis: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    messageContactName: z.string().optional(),
    messageContactRelation: z.string().optional(),
    acquisitionChannel: z.string().optional(),

    // Sensitive
    govAccessPassword: z.string().optional(),

    // Address (Simple for now)
    address: z.object({
        street: z.string().optional(),
        number: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        complement: z.string().optional()
    }).optional(),
})

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
        const validated = ClientCreateSchema.parse(data) // Throws if invalid

        // Encrypt sensitive
        if (validated.govAccessPassword) {
            validated.govAccessPassword = encrypt(validated.govAccessPassword)
        }

        return await db.client.create({
            data: {
                userId,
                name: validated.name,
                type: validated.type,
                cpfCnpj: validated.cpfCnpj,
                email: validated.email,
                whatsapp: validated.whatsapp,
                rg: validated.rg,
                ctps: validated.ctps,
                pis: validated.pis,
                fatherName: validated.fatherName,
                motherName: validated.motherName,
                messageContactName: validated.messageContactName,
                messageContactRelation: validated.messageContactRelation,
                acquisitionChannel: validated.acquisitionChannel,
                govAccessPassword: validated.govAccessPassword,
                address: validated.address ?? Prisma.DbNull,
                contacts: validated.phone ? { phone: validated.phone } : Prisma.DbNull, // Store phone in contacts
                status: 'NEW_LEAD'
            }
        })
    },

    updateClient: async (userId: string, clientId: string, data: Partial<z.infer<typeof ClientCreateSchema>>) => {
        // Logic would be similar: encrypt password if present, etc.
        if (data.govAccessPassword) {
            data.govAccessPassword = encrypt(data.govAccessPassword)
        }

        const updateData: any = { ...data };
        delete updateData.address; // Handle separately or explicitly
        delete updateData.phone; // Handle separately

        return await db.client.update({
            where: { id: clientId, userId }, // Enforce ownership
            data: {
                ...updateData,
                address: data.address ? data.address : undefined,
                contacts: data.phone ? { phone: data.phone } : undefined // Update contacts if phone provided
            }
        })
    },

    softDelete: async (userId: string, clientId: string) => {
        return await db.client.update({
            where: { id: clientId, userId },
            data: { deletedAt: new Date() }
        })
    }
}
