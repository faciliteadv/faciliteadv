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
        // Resolve columnId based on phase name
        const phaseName = data.phase || 'A Fazer'
        const column = await db.kanbanColumn.findFirst({
            where: { name: phaseName, userId: user.id }
        })

        // Create the task
        const task = await db.taskCard.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                phase: phaseName,
                columnId: column?.id, // Link by ID
                practiceArea: data.practiceArea as any,
                fatalDate: data.fatalDate,
                endDate: data.endDate,
                publicationDate: data.publicationDate,
                protocolDate: data.protocolDate,
                daysCount: data.daysCount,
                daysType: data.daysType as any,
                processId: data.processId,
                responsibleLawyerId: data.responsibleLawyerId,
                points: data.points,
                userId: user.id,
                checklist: data.checklist && data.checklist.length > 0 ? {
                    create: data.checklist.map(title => ({ title }))
                } : undefined
            } as any,
            include: {
                client: { select: { id: true, name: true } },
                process: { select: { id: true, number: true, folderName: true } },
                responsibleLawyer: { select: { id: true, name: true } },
                tags: true,
                checklist: { orderBy: { createdAt: 'asc' } }
            }
        })

        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true, task }
    } catch (error) {
        console.error('Erro ao criar tarefa:', error)
        throw new Error('Erro ao criar tarefa. Verifique os dados e tente novamente.')
    }
}

// Quick create task - for inline creation with just title and phase
export async function quickCreateTaskAction(title: string, phase: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado. Faça login novamente.')
    }

    try {
        // Resolve columnId
        const column = await db.kanbanColumn.findFirst({
            where: { name: phase, userId: user.id }
        })

        const task = await db.taskCard.create({
            data: {
                title,
                type: 'INTERNAL',
                phase,
                columnId: column?.id,
                userId: user.id
            } as any,
            include: {
                client: { select: { id: true, name: true } },
                process: { select: { id: true, number: true, folderName: true } },
                responsibleLawyer: { select: { id: true, name: true } },
                tags: true,
                checklist: { orderBy: { createdAt: 'asc' } }
            }
        })

        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true, task }
    } catch (error) {
        console.error('Erro ao criar tarefa rápida:', error)
        throw new Error('Erro ao criar tarefa.')
    }
}

export async function moveCardAction(cardId: string, columnId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado. Faça login novamente.')
    }

    try {
        await KanbanService.moveCard(user.id, cardId, columnId)
        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Erro ao mover tarefa:', error)
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

export async function toggleChecklistItemAction(checklistItemId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    try {
        // Get current state
        const item = await db.checklistItem.findUnique({
            where: { id: checklistItemId }
        })

        if (!item) {
            throw new Error('Item não encontrado')
        }

        // Toggle the completion status
        const updated = await db.checklistItem.update({
            where: { id: checklistItemId },
            data: { isCompleted: !item.isCompleted }
        })

        revalidatePath('/kanban')
        return { success: true, isCompleted: updated.isCompleted }
    } catch (error) {
        console.error('Erro ao atualizar checklist:', error)
        throw new Error('Erro ao atualizar checklist.')
    }
}

export async function updateTaskAction(taskId: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    // Sanitize dates (convert ISO strings from client to Date objects for Prisma)
    const sanitizedData = {
        ...data,
        fatalDate: data.fatalDate ? new Date(data.fatalDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        publicationDate: data.publicationDate ? new Date(data.publicationDate) : null,
        protocolDate: data.protocolDate ? new Date(data.protocolDate) : null,
    }

    try {
        await KanbanService.updateTask(user.id, taskId, sanitizedData)
        revalidatePath('/kanban')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Erro detalhado ao atualizar tarefa:', error)
        throw new Error(`Erro ao atualizar tarefa: ${(error as Error).message}`)
    }
}
