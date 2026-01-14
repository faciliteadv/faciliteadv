import { z } from "zod"

export const ClientSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    cpfOrCnpj: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    notes: z.string().optional(),
    userId: z.string().optional(),
})

export type Client = z.infer<typeof ClientSchema>

export const ProcessSchema = z.object({
    id: z.string().optional(),
    number: z.string().min(1, "Número do processo é obrigatório"),
    type: z.string().min(1, "Tipo de ação é obrigatória"),
    status: z.enum(["active", "archived", "suspended"]),
    clientId: z.string().min(1, "Cliente obrigatório"),
    userId: z.string().optional(),
    notes: z.string().optional(),
})

export type Process = z.infer<typeof ProcessSchema>
