'use server'

import { createClient } from "@/utils/supabase/server"
import { CRMService } from "@/lib/services/crm-service"
import { revalidatePath } from "next/cache"

// ============ CASE ACTIONS ============
export async function createCaseAction(data: {
    clientName: string
    defendantName?: string
    practiceArea: string
    deadline?: Date
    description?: string
    checklist?: string[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    await CRMService.createCase(user.id, data)
    revalidatePath('/kanban')
}

export async function moveCaseAction(caseId: string, newPhase: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    await CRMService.moveCase(user.id, caseId, newPhase)
    revalidatePath('/kanban')
}

// ============ INSS CASE ACTIONS ============
export async function createINSSCaseAction(data: {
    clientName: string
    clientCpf?: string
    govPassword?: string
    actionType: string
    deadline?: Date
    description?: string
    checklist?: string[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    await CRMService.createINSSCase(user.id, data)
    revalidatePath('/kanban')
}

export async function moveINSSCaseAction(caseId: string, newPhase: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    await CRMService.moveINSSCase(user.id, caseId, newPhase)
    revalidatePath('/kanban')
}
