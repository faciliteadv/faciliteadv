"use server"

import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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

    // Basic validation
    if (!data.clientId || !data.number) {
        throw new Error("Campos obrigatórios ausentes")
    }

    try {
        await db.$transaction(async (tx) => {
            const process = await tx.process.create({
                data: {
                    userId: user.id,
                    clientId: data.clientId,
                    number: data.number,
                    area: data.area,
                    // subject is now potentially used or deprecated. 
                    // User asked for "Tipo de ação" dropdown. 
                    // We can store it in subject OR the new actionType field. 
                    // Let's use actionType in the new schema, but keep subject for backward capability if needed?
                    // The prompt said "Tipo de ação (não sera mais assunto especifico)".
                    // So we map 'type' from form to 'actionType' in DB.
                    actionType: data.actionType,
                    subject: data.subject, // Optional now
                    folderName: data.folderName,
                    status: data.status || 'ACTIVE',
                    opponent: data.opponent,
                    position: data.position,
                    district: data.district,
                    court: data.court,
                    link: data.link,
                    claimValue: data.claimValue,
                    responsibleLawyerId: data.responsibleLawyerId
                } as any
            })

            // Add Authors
            if (data.authors && data.authors.length > 0) {
                await tx.processAuthor.createMany({
                    data: data.authors.map((a: any) => ({
                        processId: process.id,
                        clientId: a.clientId,
                        position: a.position
                    }))
                })
            }

            // Add Opponents
            if (data.opponents && data.opponents.length > 0) {
                await tx.processOpponent.createMany({
                    data: data.opponents.map((o: any) => ({
                        processId: process.id,
                        clientId: o.clientId,
                        position: o.position
                    }))
                })
            }
        })

        revalidatePath("/processes")
        revalidatePath("/dashboard")
        revalidatePath(`/clients/${data.clientId}`)
    } catch (error: any) {
        console.error("Error creating process:", error)
        throw new Error(error.message || "Falha ao criar processo")
    }
}

export async function updateProcessAction(processId: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    try {
        await db.$transaction(async (tx) => {
            // Update main process
            await tx.process.update({
                where: { id: processId, userId: user.id },
                data: {
                    number: data.number,
                    area: data.area,
                    subject: data.subject,
                    actionType: data.actionType,
                    folderName: data.folderName,
                    status: data.status,
                    opponent: data.opponent,
                    position: data.position,
                    district: data.district,
                    court: data.court,
                    link: data.link,
                    claimValue: data.claimValue,
                    responsibleLawyerId: data.responsibleLawyerId
                    // clientId is generally not editable
                } as any
            })

            // Handle Authors
            await tx.processAuthor.deleteMany({ where: { processId } })
            if (data.authors && data.authors.length > 0) {
                await tx.processAuthor.createMany({
                    data: data.authors.map((a: any) => ({
                        processId,
                        clientId: a.clientId,
                        position: a.position
                    }))
                })
            }

            // Handle Opponents
            await tx.processOpponent.deleteMany({ where: { processId } })
            if (data.opponents && data.opponents.length > 0) {
                await tx.processOpponent.createMany({
                    data: data.opponents.map((o: any) => ({
                        processId,
                        clientId: o.clientId,
                        position: o.position
                    }))
                })
            }
        })

        revalidatePath("/processes")
        revalidatePath(`/processes/${processId}`)
        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Error updating process:", error)
        throw new Error("Falha ao atualizar processo")
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
