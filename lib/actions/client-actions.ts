"use server"

import { ClientService, ClientCreateSchema } from "@/lib/services/client-service"
import { createClient as createSupabaseClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function createClient(data: any) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        await ClientService.createClient(user.id, data)
        revalidatePath("/clients")
        revalidatePath("/dashboard")
    } catch (error: any) {
        console.error("Error creating client:", JSON.stringify(error, null, 2))
        if (error instanceof z.ZodError) {
            console.error("Zod Validation Errors:", error.issues)
        }
        throw error
    }
}

export async function updateClientAction(clientId: string, data: any) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        await ClientService.updateClient(user.id, clientId, data)
        revalidatePath("/clients")
        revalidatePath(`/clients/${clientId}`)
    } catch (error: any) {
        console.error("Error updating client:", error)
        throw error
    }
}
