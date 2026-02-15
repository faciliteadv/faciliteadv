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
    // Tipo: CASE (caso) ou PROCESS (processo judicial)
    type: z.enum(["CASE", "PROCESS"]).default("PROCESS"),

    // Obrigatórios
    number: z.string().nullable().optional(),
    clientId: z.string().min(1, "Cliente é obrigatório").uuid("Cliente inválido"),
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
    responsibleLawyerId: z.string().uuid("Selecione um advogado responsável válido").nullable().optional(),

    // Relações
    authors: z.array(ProcessAuthorInput).optional().default([]),
    opponents: z.array(ProcessOpponentInput).optional().default([]),
}).superRefine((data, ctx) => {
    if (data.type === "PROCESS" && (!data.number || data.number.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Por favor, informe o número do processo.",
            path: ["number"],
        })
    }
})

export type CreateProcessInput = z.infer<typeof CreateProcessSchema>

// ═══════════════════════════════════════════════════════════
// 2. updateProcess
// ═══════════════════════════════════════════════════════════

export const UpdateProcessSchema = z.object({
    type: z.enum(["CASE", "PROCESS"]).optional(),
    number: z.string().nullable().optional(),
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
}).superRefine((data, ctx) => {
    if (data.type === "PROCESS" && data.number !== undefined && (!data.number || data.number.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Número do processo é obrigatório para processos judiciais",
            path: ["number"],
        })
    }
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

// ═══════════════════════════════════════════════════════════
// 5. promoteProcess
// ═══════════════════════════════════════════════════════════

export const PromoteProcessSchema = z.object({
    number: z.string().min(1, "Número do processo é obrigatório"),
    court: z.string().min(1, "Vara/Tribunal é obrigatório"),
    link: z.string().nullable().optional(),
    district: z.string().optional(), // Comarca is optional as per requirements, but good to have if user wants
})

export type PromoteProcessInput = z.infer<typeof PromoteProcessSchema>
