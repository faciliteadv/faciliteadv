import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import crypto from "crypto"
import { ClientCreateSchema } from "@/lib/validations/client"
import { sanitizeFormData, prepareForPrisma } from "@/lib/utils/data-sanitizer"

// --- Encryption Helper ---
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default_secret_key').digest();
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

async function getMemberIds(workspaceId: string): Promise<string[]> {
    const rows = await db.workspaceMember.findMany({
        where: { workspaceId },
        select: { userId: true },
    })
    return rows.map(r => r.userId)
}

export const ClientService = {
    getClients: async (workspaceId: string, search?: string) => {
        const memberIds = await getMemberIds(workspaceId)

        return await db.client.findMany({
            where: {
                deletedAt: null,
                AND: [
                    { OR: [{ workspaceId }, { userId: { in: memberIds } }] },
                    ...(search ? [{
                        OR: [
                            { name: { contains: search, mode: 'insensitive' as const } },
                            { cpfCnpj: { contains: search, mode: 'insensitive' as const } },
                        ]
                    }] : []),
                ],
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
            }
        })
    },

    getById: async (workspaceId: string, clientId: string) => {
        const memberIds = await getMemberIds(workspaceId)

        const client = await db.client.findFirst({
            where: {
                id: clientId,
                deletedAt: null,
                OR: [{ workspaceId }, { userId: { in: memberIds } }],
            },
            include: {
                processes: { where: { deletedAt: null } },
                tasks: { where: { phase: { not: 'PROTOCOLLED' } } }
            }
        })

        if (client && client.govAccessPassword) {
            client.govAccessPassword = decrypt(client.govAccessPassword)
        }

        return client
    },

    createClient: async (userId: string, data: z.infer<typeof ClientCreateSchema>) => {
        const sanitized = sanitizeFormData(data)
        const validated = ClientCreateSchema.parse(sanitized)

        if (validated.govAccessPassword) {
            validated.govAccessPassword = encrypt(validated.govAccessPassword)
        }

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

        return await db.client.create({ data: clientData })
    },

    updateClient: async (workspaceId: string, clientId: string, data: Partial<z.infer<typeof ClientCreateSchema>>) => {
        const memberIds = await getMemberIds(workspaceId)

        // Verify the client belongs to this workspace
        const existing = await db.client.findFirst({
            where: {
                id: clientId,
                OR: [{ workspaceId }, { userId: { in: memberIds } }],
            },
            select: { id: true }
        })
        if (!existing) throw new Error("Cliente não encontrado")

        const sanitized = sanitizeFormData(data)
        if (sanitized.govAccessPassword) {
            sanitized.govAccessPassword = encrypt(sanitized.govAccessPassword)
        }

        const updateData: any = { ...sanitized }
        const { address, phone, ...restData } = updateData

        const finalData = prepareForPrisma({
            ...restData,
            address: address && Object.keys(address).length > 0 ? address : undefined,
            contacts: phone ? { phone } : undefined
        })

        return await db.client.update({ where: { id: clientId }, data: finalData })
    },

    softDelete: async (workspaceId: string, clientId: string) => {
        const memberIds = await getMemberIds(workspaceId)

        const existing = await db.client.findFirst({
            where: {
                id: clientId,
                OR: [{ workspaceId }, { userId: { in: memberIds } }],
            },
            select: { id: true }
        })
        if (!existing) throw new Error("Cliente não encontrado")

        return await db.client.update({
            where: { id: clientId },
            data: { deletedAt: new Date() }
        })
    }
}
