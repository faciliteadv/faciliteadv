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
    if (!user) throw new Error("Unauthorized")

    // Basic validation
    if (!data.clientId || !data.number) {
        throw new Error("Missing required fields")
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
                status: 'ACTIVE'
            }
        })
        revalidatePath("/processes")
        revalidatePath("/dashboard")
        revalidatePath(`/clients/${data.clientId}`)
    } catch (error) {
        console.error("Error creating process:", error)
        throw new Error("Failed to create process")
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
