import { z } from "zod"

// ═══════════════════════════════════════════════════════════
// Sub-schemas reutilizáveis
// ═══════════════════════════════════════════════════════════

const ProcessAuthorInput = z.object({
    clientId: z.string().uuid("ID do autor deve ser um UUID válido"),
    position: z.string().optional().default("AUTOR"),
})

const ProcessOpponentInput = z.object({
    clientId: z.string().uuid().nullish().transform(v => v ?? undefined),
    name: z.string().nullish().transform(v => v ?? undefined),
    cpfCnpj: z.string().nullish().transform(v => v ?? undefined),
    position: z.string().optional().default("REU"),
})

// ═══════════════════════════════════════════════════════════
// 1. createProcess
// ═══════════════════════════════════════════════════════════

export const CreateProcessSchema = z.object({
    // Obrigatórios
    number: z.string().min(1, "Número do processo é obrigatório"),
    clientId: z.string().uuid("ID do cliente deve ser um UUID válido"),
    area: z.string().min(1, "Área de atuação é obrigatória"),

    // Opcionais
    actionType: z.string().nullable().optional(),
    folderName: z.string().nullable().optional(),
    status: z.string().optional().default("ACTIVE"),
    opponent: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    court: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
    claimValue: z.union([z.number(), z.string(), z.null()]).optional(),
    responsibleLawyerId: z.string().uuid().nullable().optional(),

    // Relações
    authors: z.array(ProcessAuthorInput).optional().default([]),
    opponents: z.array(ProcessOpponentInput).optional().default([]),
})

export type CreateProcessInput = z.infer<typeof CreateProcessSchema>

// ═══════════════════════════════════════════════════════════
// 2. updateProcess
// ═══════════════════════════════════════════════════════════

export const UpdateProcessSchema = z.object({
    number: z.string().min(1, "Número do processo é obrigatório").optional(),
    area: z.string().nullable().optional(),
    actionType: z.string().nullable().optional(),
    folderName: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    opponent: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    court: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
    claimValue: z.union([z.number(), z.string(), z.null()]).optional(),
    responsibleLawyerId: z.string().uuid().nullable().optional(),

    authors: z.array(ProcessAuthorInput).optional().default([]),
    opponents: z.array(ProcessOpponentInput).optional().default([]),
})

export type UpdateProcessInput = z.infer<typeof UpdateProcessSchema>

// ═══════════════════════════════════════════════════════════
// 3. updateTask (Kanban)
// ═══════════════════════════════════════════════════════════

export const UpdateTaskSchema = z.object({
    title: z.string().min(1, "Título é obrigatório").optional(),
    description: z.string().nullish().transform(v => v ?? undefined),
    type: z.enum(["DEADLINE", "INTERNAL"]).optional(),
    fatalDate: z.union([z.string(), z.null()]).optional(),
    endDate: z.union([z.string(), z.null()]).optional(),
    publicationDate: z.union([z.string(), z.null()]).optional(),
    protocolDate: z.union([z.string(), z.null()]).optional(),
    daysCount: z.number().int().nonnegative().nullish().transform(v => v ?? undefined),
    daysType: z.enum(["BUSINESS", "CALENDAR"]).nullish().transform(v => v ?? undefined),
    practiceArea: z.enum([
        "LABOR", "CIVIL", "FAMILY", "CRIMINAL",
        "HEALTH", "CONSUMER", "TAX", "SOCIAL_SECURITY", "OTHER"
    ]).nullish().transform(v => v ?? undefined),
    processId: z.string().uuid().nullish().transform(v => v ?? undefined),
    clientId: z.string().uuid().nullish().transform(v => v ?? undefined),
    responsibleLawyerId: z.string().uuid().nullish().transform(v => v ?? undefined),
    points: z.number().int().nonnegative().nullish().transform(v => v ?? undefined),
    tags: z.array(z.string().uuid()).optional(),
})

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

// ═══════════════════════════════════════════════════════════
// 4. createFinancialRecord
// ═══════════════════════════════════════════════════════════

export const CreateFinancialRecordSchema = z.object({
    type: z.string().optional().default("INCOME"),
    amount: z.union([z.number(), z.string()]).refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        { message: "Valor deve ser um número positivo" }
    ),
    dueDate: z.union([z.string(), z.null()]).optional(),
    paidAt: z.union([z.string(), z.null()]).optional(),
    description: z.string().nullable().optional(),
    paymentMethod: z.string().nullable().optional(),
    installment: z.string().nullable().optional(),
    clientId: z.string().uuid("ID do cliente é obrigatório"),
    processId: z.string().uuid().nullable().optional(),
})

export type CreateFinancialRecordInput = z.infer<typeof CreateFinancialRecordSchema>
