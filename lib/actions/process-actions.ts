"use server"

import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeFormData, sanitizeRelations, sanitizeNumeric, prepareForPrisma } from "@/lib/utils/data-sanitizer"
import { recordAuditLog } from "@/lib/utils/audit"
import { CreateProcessSchema, UpdateProcessSchema, CreateFinancialRecordSchema } from "@/lib/validations/schemas"
import { withAuth } from "@/lib/auth/with-auth"

// Simple fetch for select
// Simple fetch for select
export async function getClientsForSelect() {
    return withAuth(async ({ userId, workspaceId }) => {

        const clients = await db.client.findMany({
            where: {
                deletedAt: null,
                OR: [
                    ...(workspaceId ? [{ workspaceId }] : []),
                    { userId, workspaceId: null }
                ]
            },
            select: { id: true, name: true, cpfCnpj: true },
            orderBy: { name: 'asc' }
        })
        return clients
    })
}

export async function getUsersForResponsibleSelect() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const users = await db.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })
    return users
}

export async function getActionTypes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const types = await db.actionType.findMany({
        where: { userId: user.id },
        select: { name: true },
        orderBy: { name: 'asc' }
    })
    return types.map(t => t.name)
}

export async function createActionType(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    await db.actionType.create({
        data: {
            name,
            userId: user.id
        }
    })
    return name
}

const DEFAULT_VARAS = [
    "1ª Vara", "2ª Vara", "3ª Vara", "4ª Vara", "5ª Vara",
    "6ª Vara", "7ª Vara", "8ª Vara", "9ª Vara", "10ª Vara",
    "Juizado Especial"
]

const DEFAULT_COMARCAS = [
    "Santos/SP", "São Vicente/SP", "Praia Grande/SP", "Guarujá/SP",
    "Cubatão/SP", "Bertioga/SP", "Mongaguá/SP", "Itanhaém/SP",
    "Peruíbe/SP", "São Paulo/SP"
]

export async function getCourts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const courts = await db.court.findMany({
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' }
    })

    // Merge defaults with DB results, remove duplicates, and sort
    const dbCourts = courts.map(c => c.name)
    const allCourts = Array.from(new Set([...DEFAULT_VARAS, ...dbCourts])).sort()

    return allCourts
}

export async function createCourt(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    // We still save per user to respect the schema unique constraint
    await db.court.upsert({
        where: { name_userId: { name, userId: user.id } },
        update: {},
        create: { name, userId: user.id }
    })
    return name
}

export async function getDistricts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const districts = await db.district.findMany({
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' }
    })

    // Merge defaults with DB results, remove duplicates, and sort
    const dbDistricts = districts.map(d => d.name)
    const allDistricts = Array.from(new Set([...DEFAULT_COMARCAS, ...dbDistricts])).sort()

    return allDistricts
}

export async function createDistrict(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    await db.district.upsert({
        where: { name_userId: { name, userId: user.id } },
        update: {},
        create: { name, userId: user.id }
    })
    return name
}

// Create Process
// Create Process
export async function createProcess(rawData: unknown) {
    return withAuth(async ({ userId, workspaceId }) => {

        try {
            const parsed = CreateProcessSchema.parse(rawData)
            const sanitized = sanitizeFormData(parsed)

            const sanitizedAuthors = sanitizeRelations(parsed.authors)
            const sanitizedOpponents = sanitizeRelations(parsed.opponents)
            const claimValue = sanitizeNumeric(sanitized.claimValue)

            const result = await db.$transaction(async (tx) => {
                const processData = prepareForPrisma({
                    number: sanitized.number,
                    area: sanitized.area || null,
                    actionType: sanitized.actionType || null,
                    folderName: sanitized.folderName || null,
                    status: sanitized.status || 'ACTIVE',
                    opponent: sanitized.opponent || null,
                    position: sanitized.position || null,
                    district: sanitized.district || null,
                    court: sanitized.court || null,
                    link: sanitized.link || null,
                    claimValue: claimValue
                })

                const createData: any = {
                    ...processData,
                    user: { connect: { id: userId } },
                    client: { connect: { id: sanitized.clientId } },
                    ...(workspaceId ? { workspace: { connect: { id: workspaceId } } } : {})
                }

                if (sanitized.responsibleLawyerId) {
                    createData.responsibleLawyer = { connect: { id: sanitized.responsibleLawyerId } }
                }

                const process = await tx.process.create({
                    data: createData
                })

                if (sanitizedAuthors.length > 0) {
                    await tx.processAuthor.createMany({
                        data: sanitizedAuthors.map((a: any) => ({
                            processId: process.id,
                            clientId: a.clientId,
                            position: a.position || 'AUTOR'
                        }))
                    })
                }

                if (sanitizedOpponents.length > 0) {
                    const opponentClientIds = sanitizedOpponents
                        .map((o: any) => o.clientId)
                        .filter(Boolean)

                    const opponentClients = opponentClientIds.length > 0
                        ? await tx.client.findMany({
                            where: { id: { in: opponentClientIds } },
                            select: { id: true, name: true, cpfCnpj: true }
                        })
                        : []

                    const clientMap = new Map(opponentClients.map(c => [c.id, c]))

                    const opponentDataList = sanitizedOpponents.map((o: any) => {
                        const client = o.clientId ? clientMap.get(o.clientId) : null
                        return {
                            processId: process.id,
                            clientId: o.clientId || null,
                            name: client?.name || o.name || 'Não informado',
                            cpfCnpj: client?.cpfCnpj || o.cpfCnpj || null,
                            position: o.position || 'REU'
                        }
                    })

                    await tx.processOpponent.createMany({
                        data: opponentDataList
                    })
                }

                // Record Audit Log
                await recordAuditLog({
                    userId,
                    entityId: process.id,
                    entityType: 'PROCESS',
                    action: 'CREATE',
                    newData: { ...process, authorsCount: sanitizedAuthors.length, opponentsCount: sanitizedOpponents.length }
                })

                return process
            })

            revalidatePath("/processes")
            revalidatePath("/dashboard")
            revalidatePath(`/clients/${sanitized.clientId}`)

            return { success: true, message: "Processo criado com sucesso", id: result.id }
        } catch (error: any) {
            console.error("Error creating process:", error)
            throw new Error(error.message || "Falha ao criar processo.")
        }
    })
}

export async function updateProcessAction(processId: string, rawData: unknown) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        const parsed = UpdateProcessSchema.parse(rawData)
        const sanitized = sanitizeFormData(parsed)
        const sanitizedAuthors = sanitizeRelations(parsed.authors)
        const sanitizedOpponents = sanitizeRelations(parsed.opponents)
        const claimValue = sanitizeNumeric(sanitized.claimValue)

        await db.$transaction(async (tx) => {
            const oldProcess = await tx.process.findUnique({
                where: { id: processId },
                include: { authors: true, opponents: true }
            })

            const processData = prepareForPrisma({
                number: sanitized.number,
                area: sanitized.area || null,
                actionType: sanitized.actionType || null,
                folderName: sanitized.folderName || null,
                status: sanitized.status || null,
                opponent: sanitized.opponent || null,
                position: sanitized.position || null,
                district: sanitized.district || null,
                court: sanitized.court || null,
                link: sanitized.link || null,
                claimValue: claimValue
            })

            const updateData: any = { ...processData }

            if (sanitized.responsibleLawyerId) {
                updateData.responsibleLawyer = { connect: { id: sanitized.responsibleLawyerId } }
            } else if (sanitized.responsibleLawyerId === null) {
                updateData.responsibleLawyer = { disconnect: true }
            }

            const updatedProcess = await tx.process.update({
                where: { id: processId, userId: user.id },
                data: updateData
            })

            // Handle Authors
            await tx.processAuthor.deleteMany({ where: { processId } })
            if (sanitizedAuthors.length > 0) {
                await tx.processAuthor.createMany({
                    data: sanitizedAuthors.map((a: any) => ({
                        processId,
                        clientId: a.clientId,
                        position: a.position || 'AUTOR'
                    }))
                })
            }

            // Handle Opponents
            await tx.processOpponent.deleteMany({ where: { processId } })
            if (sanitizedOpponents.length > 0) {
                const opponentClientIds = sanitizedOpponents
                    .map((o: any) => o.clientId)
                    .filter(Boolean)

                const opponentClients = await tx.client.findMany({
                    where: { id: { in: opponentClientIds } },
                    select: { id: true, name: true, cpfCnpj: true }
                })

                const clientMap = new Map(opponentClients.map(c => [c.id, c]))

                const opponentDataList = sanitizedOpponents.map((o: any) => {
                    const client = o.clientId ? clientMap.get(o.clientId) : null
                    return {
                        processId,
                        clientId: o.clientId || null,
                        name: client?.name || o.name || 'Não informado',
                        cpfCnpj: client?.cpfCnpj || o.cpfCnpj || null,
                        position: o.position || 'REU'
                    }
                })

                await tx.processOpponent.createMany({
                    data: opponentDataList
                })
            }

            // Record Audit Log
            await recordAuditLog({
                userId: user.id,
                entityId: processId,
                entityType: 'PROCESS',
                action: 'UPDATE',
                oldData: oldProcess,
                newData: { ...updatedProcess, authorsCount: sanitizedAuthors.length, opponentsCount: sanitizedOpponents.length }
            })
        })

        revalidatePath("/processes")
        revalidatePath(`/processes/${processId}`)
        revalidatePath("/dashboard")

        return { success: true, message: "Processo atualizado com sucesso" }
    } catch (error: any) {
        console.error("Error updating process:", error)
        throw new Error(error.message || "Falha ao atualizar processo")
    }
}

export async function deleteProcessAction(processId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        const oldProcess = await db.process.findUnique({ where: { id: processId } })

        await db.process.update({
            where: { id: processId, userId: user.id },
            data: { deletedAt: new Date() }
        })

        // Record Audit Log
        await recordAuditLog({
            userId: user.id,
            entityId: processId,
            entityType: 'PROCESS',
            action: 'DELETE',
            oldData: oldProcess
        })

        revalidatePath("/processes")
        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Error deleting process:", error)
        throw new Error("Falha ao excluir processo")
    }

    redirect("/processes")
}

export async function getFinancialRecordsByProcessId(processId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const records = await db.financialRecord.findMany({
        where: { processId, userId: user.id },
        orderBy: { dueDate: 'desc' }
    })

    // Convert Decimal to number for Client Components compatibility
    return records.map(record => ({
        ...record,
        amount: Number(record.amount)
    }))
}

export async function createFinancialRecordAction(rawData: unknown) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        const parsed = CreateFinancialRecordSchema.parse(rawData)
        const sanitized = sanitizeFormData(parsed)
        const amount = sanitizeNumeric(sanitized.amount)

        const record = await db.financialRecord.create({
            data: {
                type: sanitized.type || 'INCOME',
                amount: amount || 0,
                dueDate: sanitized.dueDate ? new Date(sanitized.dueDate) : new Date(),
                paidAt: sanitized.paidAt ? new Date(sanitized.paidAt) : null,
                description: sanitized.description || null,
                paymentMethod: sanitized.paymentMethod || null,
                installment: sanitized.installment || null,
                clientId: sanitized.clientId,
                processId: sanitized.processId || null,
                userId: user.id
            }
        })

        revalidatePath(`/processes/${sanitized.processId}`)
        return {
            success: true,
            record: {
                ...record,
                amount: Number(record.amount)
            }
        }
    } catch (error: any) {
        console.error("Error creating financial record:", error)
        throw new Error(error.message || "Falha ao criar registro financeiro")
    }
}
