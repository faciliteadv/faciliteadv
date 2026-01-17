"use server"

import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Simple fetch for select
export async function getClientsForSelect() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const clients = await db.client.findMany({
        where: { userId: user.id, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })
    return clients
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
        await db.process.create({
            data: {
                userId: user.id,
                clientId: data.clientId,
                number: data.number,
                area: data.area,
                subject: data.subject,
                folderName: data.folderName,
                status: data.status || 'ACTIVE',
                // New Fields
                opponent: data.opponent,
                position: data.position,
                district: data.district,
                court: data.court,
                link: data.link
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
        await db.process.update({
            where: { id: processId, userId: user.id },
            data: {
                number: data.number,
                area: data.area,
                subject: data.subject,
                folderName: data.folderName,
                status: data.status,
                opponent: data.opponent,
                position: data.position,
                district: data.district,
                court: data.court,
                link: data.link
                // clientId is generally not editable, but could be if needed.
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
