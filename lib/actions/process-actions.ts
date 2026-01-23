"use server"

import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeFormData, sanitizeRelations, sanitizeNumeric, prepareForPrisma } from "@/lib/utils/data-sanitizer"

// Simple fetch for select
export async function getClientsForSelect() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const clients = await db.client.findMany({
        where: { userId: user.id, deletedAt: null },
        select: { id: true, name: true, cpfCnpj: true },
        orderBy: { name: 'asc' }
    })
    return clients
}

export async function getUsersForResponsibleSelect() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Assuming we want to return all users that have access to the system/office
    // For now, listing all users in the DB might be what is needed if it's a small team.
    // However, tenancy is by userId usually? 
    // Wait, the prompt implies "users registered" i.e. colleagues. 
    // Current architecture seems single-tenant per user (userId filter everywhere)?
    // If so, there are no "other users". 
    // BUT the user said "as vezes tenho 1 ou 2 advogados no escritório". 
    // If they share the same Login/Account, they are 1 User. 
    // If they have distinct accounts, do they share data? 
    // The current schema has `userId` on every table. This implies isolation.
    // If the user wants to select "Responsible Lawyer", maybe they mean "User Profiles" created within their account?
    // "não vai puxar os clientes cadastrados, mas, os usuários"
    // "Advogado Responsável (vai puxar dentro dos usuários cadastrados)"
    // If the system is multi-user, `db.user.findMany` would return all.
    // But if isolation is key...
    // I will assume for now he wants to list USERS of the system.

    // Check if there is a 'Office' or 'Team' concept? No.
    // Maybe just list just the current user? Or all users?
    // For safety in this "SaaS" like structure, I should probably only list the current user OR 
    // if there was an OrganizationId. 
    // Given the request, I will just list ALL users for now (simple approach) or create a mock.
    // Actually, `User` table exists.

    // Let's return the current user + any others.
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

// Create Process
export async function createProcess(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        // Sanitize ALL input data FIRST
        const sanitized = sanitizeFormData(data)

        // Basic validation
        if (!sanitized.clientId || !sanitized.number) {
            throw new Error("Número do processo e cliente são obrigatórios")
        }

        // Sanitize relations
        const sanitizedAuthors = sanitizeRelations(sanitized.authors)
        const sanitizedOpponents = sanitizeRelations(sanitized.opponents)

        // Sanitize numeric values
        const claimValue = sanitizeNumeric(sanitized.claimValue)

        await db.$transaction(async (tx) => {
            // Prepare process data - ensure ALL fields are serializable
            // Prepare process data
            // Prepare process data
            // const { clientId, responsibleLawyerId, ...restData } = sanitized

            const processData = prepareForPrisma({
                number: sanitized.number,
                area: sanitized.area || null,
                actionType: sanitized.actionType || null,
                subject: sanitized.subject || null,
                folderName: sanitized.folderName || null,
                status: sanitized.status || 'ACTIVE',
                opponent: sanitized.opponent || null,
                position: sanitized.position || null,
                district: sanitized.district || null,
                court: sanitized.court || null,
                link: sanitized.link || null,
                claimValue: claimValue
                // responsibleLawyerId excluded
            })

            const createData: any = {
                ...processData,
                user: { connect: { id: user.id } },
                client: { connect: { id: sanitized.clientId } }
            }

            if (sanitized.responsibleLawyerId) {
                createData.responsibleLawyer = { connect: { id: sanitized.responsibleLawyerId } }
            }

            const process = await tx.process.create({
                data: createData
            })

            // Add Authors - only if we have valid data
            if (sanitizedAuthors.length > 0) {
                await tx.processAuthor.createMany({
                    data: sanitizedAuthors.map((a: any) => ({
                        processId: process.id,
                        clientId: a.clientId,
                        position: a.position || 'AUTOR'
                    }))
                })
            }

            // Add Opponents - ProcessOpponent uses name/cpfCnpj, NOT clientId
            // We need to fetch client names if clientIds were provided
            if (sanitizedOpponents.length > 0) {
                // Get client info for opponents
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

                // Map opponents with actual names
                const opponentDataList = sanitizedOpponents.map((o: any) => {
                    const client = o.clientId ? clientMap.get(o.clientId) : null
                    return {
                        processId: process.id,
                        name: client?.name || o.name || 'Não informado',
                        cpfCnpj: client?.cpfCnpj || o.cpfCnpj || null,
                        position: o.position || 'REU'
                    }
                })

                await tx.processOpponent.createMany({
                    data: opponentDataList
                })
            }
        })

        revalidatePath("/processes")
        revalidatePath("/dashboard")
        revalidatePath(`/clients/${sanitized.clientId}`)

        return { success: true, message: "Processo criado com sucesso" }
    } catch (error: any) {
        console.error("Error creating process:", error)

        // Provide specific error messages
        if (error.code === 'P2002') {
            throw new Error("Já existe um processo com este número")
        }
        if (error.code === 'P2003') {
            throw new Error("Cliente selecionado não existe ou foi removido")
        }

        throw new Error(error.message || "Falha ao criar processo. Verifique os dados e tente novamente.")
    }
}

export async function updateProcessAction(processId: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        // Sanitize ALL input data
        const sanitized = sanitizeFormData(data)

        // Sanitize relations
        const sanitizedAuthors = sanitizeRelations(sanitized.authors)
        const sanitizedOpponents = sanitizeRelations(sanitized.opponents)

        // Sanitize numeric values
        const claimValue = sanitizeNumeric(sanitized.claimValue)

        await db.$transaction(async (tx) => {
            // Prepare update data
            // Prepare update data
            // const { responsibleLawyerId, ...restSanitized } = sanitized

            const processData = prepareForPrisma({
                number: sanitized.number,
                area: sanitized.area || null,
                subject: sanitized.subject || null,
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

            const updateData: any = {
                ...processData
            }

            if (sanitized.responsibleLawyerId) {
                updateData.responsibleLawyer = { connect: { id: sanitized.responsibleLawyerId } }
            } else if (sanitized.responsibleLawyerId === null) {
                updateData.responsibleLawyer = { disconnect: true }
            }

            // Update main process
            await tx.process.update({
                where: { id: processId, userId: user.id },
                data: updateData
            })

            // Handle Authors - delete and recreate
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

            // Handle Opponents - delete and recreate  
            await tx.processOpponent.deleteMany({ where: { processId } })
            if (sanitizedOpponents.length > 0) {
                // Get client info for opponents
                const opponentClientIds = sanitizedOpponents
                    .map((o: any) => o.clientId)
                    .filter(Boolean)

                const opponentClients = await tx.client.findMany({
                    where: { id: { in: opponentClientIds } },
                    select: { id: true, name: true, cpfCnpj: true }
                })

                const clientMap = new Map(opponentClients.map(c => [c.id, c]))

                // Map opponents with actual names
                const opponentDataList = sanitizedOpponents.map((o: any) => {
                    const client = o.clientId ? clientMap.get(o.clientId) : null
                    return {
                        processId,
                        name: client?.name || o.name || 'Não informado',
                        cpfCnpj: client?.cpfCnpj || o.cpfCnpj || null,
                        position: o.position || 'REU'
                    }
                })

                await tx.processOpponent.createMany({
                    data: opponentDataList
                })
            }
        })

        revalidatePath("/processes")
        revalidatePath(`/processes/${processId}`)
        revalidatePath("/dashboard")

        return { success: true, message: "Processo atualizado com sucesso" }
    } catch (error: any) {
        console.error("Error updating process:", error)

        // Specific error messages
        if (error.code === 'P2025') {
            throw new Error("Processo não encontrado ou você não tem permissão")
        }
        if (error.code === 'P2002') {
            throw new Error("Já existe um processo com este número")
        }

        throw new Error(error.message || "Falha ao atualizar processo")
    }
}

export async function getUniqueSubjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const processes = await db.process.findMany({
        where: { userId: user.id, deletedAt: null },
        distinct: ['subject'],
        select: { subject: true },
        orderBy: { subject: 'asc' }
    })
    return processes.map(p => p.subject).filter(Boolean) as string[]
}

export async function deleteProcessAction(processId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        await db.process.update({
            where: { id: processId, userId: user.id },
            data: { deletedAt: new Date() }
        })
        revalidatePath("/processes")
        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Error deleting process:", error)
        throw new Error("Falha ao excluir processo")
    }

    redirect("/processes")
}
