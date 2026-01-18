"use server"

import { db } from "@/lib/db"
import { createClient as createSupabaseClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { ClientService } from "@/lib/services/client-service"
import { z } from "zod"

// Helper to capitalize words
const toTitleCase = (str: string) => {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

export async function fetchCPFData(cpf: string) {
    try {
        const cleanCPF = cpf.replace(/\D/g, "")
        if (cleanCPF.length !== 11) {
            return { success: false, error: "CPF inválido" }
        }

        // Try BrasilAPI first (more reliable)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cleanCPF}`)
            if (response.ok) {
                const data = await response.json()
                return {
                    success: true,
                    data: {
                        name: data.nome ? toTitleCase(data.nome) : null,
                        birthDate: data.data_nascimento || null,
                        situation: data.situacao || null
                    }
                }
            }
        } catch (e) {
            console.log("BrasilAPI CPF failed, trying alternative...")
        }

        // Fallback: just validate format
        return {
            success: true,
            data: {
                name: null,
                message: "CPF válido, mas dados não disponíveis publicamente"
            }
        }
    } catch (error: any) {
        console.error("CPF lookup error:", error)
        return { success: false, error: error.message || "Erro ao consultar CPF" }
    }
}

export async function createClient(data: any) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        const client = await ClientService.createClient(user.id, data)
        revalidatePath("/clients")
        revalidatePath("/dashboard")
        return client
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
export async function deleteClientAction(clientId: string) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        await ClientService.softDelete(user.id, clientId)
        revalidatePath("/clients")
    } catch (error: any) {
        console.error("Error deleting client:", error)
        throw error
    }
}
