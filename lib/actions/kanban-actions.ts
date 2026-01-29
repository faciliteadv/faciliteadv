'use server'

import { createClient } from "@/utils/supabase/server"
import { KanbanService } from "@/lib/services/kanban-service"
import { TaskType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function createTaskAction(data: {
    title: string
    description?: string
    type: TaskType
    phase?: string
    practiceArea?: string
    fatalDate?: Date
    endDate?: Date
    publicationDate?: Date
    protocolDate?: Date
    daysCount?: number
    daysType?: 'BUSINESS' | 'CALENDAR'
    processId?: string
    responsibleLawyerId?: string
    points?: number
    checklist?: string[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado. Faça login novamente.')
    }

    try {
        await KanbanService.createTask(user.id, data)
        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Erro ao criar tarefa:', error)
        throw new Error('Erro ao criar tarefa. Verifique os dados e tente novamente.')
    }
}

export async function moveCardAction(cardId: string, newPhase: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    try {
        await KanbanService.moveCard(user.id, cardId, newPhase)
        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Erro ao mover card:', error)
        throw new Error('Erro ao mover tarefa.')
    }
}

export async function deleteTaskAction(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    try {
        // First delete checklist items (cascade should handle, but being explicit)
        await db.checklistItem.deleteMany({
            where: { taskId }
        })

        // Then delete the task
        await db.taskCard.delete({
            where: { id: taskId, userId: user.id }
        })

        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error)
        throw new Error('Erro ao excluir tarefa.')
    }
}

export async function archiveTaskAction(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    try {
        await db.taskCard.update({
            where: { id: taskId, userId: user.id },
            data: { isArchived: true }
        })

        revalidatePath('/kanban')
        return { success: true }
    } catch (error) {
        console.error('Erro ao arquivar tarefa:', error)
        throw new Error('Erro ao arquivar tarefa.')
    }
}
