import { z } from "zod"

export const ClientCreateSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    type: z.enum(["PF", "PJ"]),
    cpfCnpj: z.string().min(11, "Documento inválido"),

    // Optional fields that accept null or empty string
    email: z.string().email("Email inválido").nullable().or(z.literal("")).optional(),
    phone: z.string().nullable().optional(),
    whatsapp: z.string().nullable().optional(),
    rg: z.string().nullable().optional(),
    ctps: z.string().nullable().optional(),
    pis: z.string().nullable().optional(),
    fatherName: z.string().nullable().optional(),
    motherName: z.string().nullable().optional(),
    messageContactName: z.string().nullable().optional(),
    messageContactRelation: z.string().nullable().optional(),
    acquisitionChannel: z.string().nullable().optional(),
    profession: z.string().nullable().optional(),
    civilStatus: z.string().nullable().optional(),

    // Sensitive
    govAccessPassword: z.string().nullable().optional(),

    // Address - all fields nullable
    address: z.object({
        street: z.string().nullable().optional(),
        number: z.string().nullable().optional(),
        complement: z.string().nullable().optional(),
        neighborhood: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zip: z.string().nullable().optional(),
    }).nullable().optional(),

    // Bank Details
    bankDetails: z.object({
        bank: z.string().nullable().optional(),
        agency: z.string().nullable().optional(),
        account: z.string().nullable().optional(),
        pixKey: z.string().nullable().optional(),
        pixType: z.string().nullable().optional()
    }).nullable().optional(),
})
