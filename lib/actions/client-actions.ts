"use server"

import { db } from "@/lib/db"
import { createClient as createSupabaseClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { ClientService } from "@/lib/services/client-service"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { recordAuditLog } from "@/lib/utils/audit"
import { ClientCreateSchema } from "@/lib/validations/client"

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

export async function createClient(rawData: unknown) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    try {
        const data = ClientCreateSchema.parse(rawData)
        const client = await ClientService.createClient(user.id, data)

        // Record Audit Log
        await recordAuditLog({
            userId: user.id,
            entityId: client.id,
            entityType: 'CLIENT',
            action: 'CREATE',
            newData: client
        })

        revalidatePath("/clients")
        revalidatePath("/dashboard")
        return client
    } catch (error: any) {
        console.error("Error creating client:", error)
        throw error
    }
}

export async function updateClientAction(clientId: string, rawData: unknown) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) throw new Error("Unauthorized")

    try {
        const data = ClientCreateSchema.partial().parse(rawData)
        const oldClient = await db.client.findUnique({ where: { id: clientId } })
        const updatedClient = await ClientService.updateClient(wsData.workspace.id, clientId, data)

        // Record Audit Log
        await recordAuditLog({
            userId: user.id,
            entityId: clientId,
            entityType: 'CLIENT',
            action: 'UPDATE',
            oldData: oldClient,
            newData: updatedClient
        })

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

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) throw new Error("Unauthorized")

    try {
        const oldClient = await db.client.findUnique({ where: { id: clientId } })
        await ClientService.softDelete(wsData.workspace.id, clientId)

        // Record Audit Log
        await recordAuditLog({
            userId: user.id,
            entityId: clientId,
            entityType: 'CLIENT',
            action: 'DELETE',
            oldData: oldClient
        })

        revalidatePath("/clients")
    } catch (error: any) {
        console.error("Error deleting client:", error)
        throw error
    }
}
