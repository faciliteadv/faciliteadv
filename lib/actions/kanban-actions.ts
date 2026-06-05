'use server'

import { createClient } from "@/utils/supabase/server"
import { KanbanService } from "@/lib/services/kanban-service"
import { TaskType } from "@prisma/client"
import { db } from "@/lib/db"
import { UpdateTaskSchema } from "@/lib/validations/schemas"
import { withAuth } from "@/lib/auth/with-auth"
import { hasPermission } from "@/lib/permissions"
import { parseDateInputToDate, parseKanbanCommentPayload } from "@/lib/utils/kanban"

/**
 * Fetch board tasks for a specific pipeline.
 * NO revalidatePath — React Query manages client state.
 */
export async function fetchBoardAction(pipelineId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    return await KanbanService.getTasksByPipeline(pipelineId, user.id)
}

/**
 * Create a task in a specific column with proper position.
 * NO revalidatePath — React Query manages client state.
 */
export async function createTaskAction(data: {
    title: string
    description?: string
    type: TaskType
    columnId: string
    practiceArea?: string
    fatalDate?: Date
    endDate?: Date
    publicationDate?: Date
    protocolDate?: Date
    daysCount?: number
    daysType?: 'BUSINESS' | 'CALENDAR'
    processId?: string
    clientId?: string
    responsibleLawyerId?: string
    points?: number
    checklist?: string[]
}) {
    return withAuth(async ({ userId, permissions }) => {
    if (!hasPermission(permissions, 'kanban:write') && !hasPermission(permissions, 'kanban:own')) {
        throw new Error('Sem permissão para criar cards no kanban')
    }

    try {
        const task = await KanbanService.createTask(userId, data)

        // Return with serialized dates and includes
        const fullTask = await db.taskCard.findUnique({
            where: { id: task.id },
            include: {
                client: { select: { id: true, name: true } },
                process: { select: { id: true, number: true, folderName: true, type: true } },
                responsibleLawyer: { select: { id: true, name: true } },
                tags: true,
                checklist: { orderBy: { createdAt: 'asc' } }
            }
        })

        if (!fullTask) throw new Error('Task created but not found')

        return {
            success: true,
            task: {
                ...fullTask,
                createdAt: fullTask.createdAt.toISOString(),
                updatedAt: fullTask.updatedAt.toISOString(),
                completedAt: fullTask.completedAt ? fullTask.completedAt.toISOString() : null,
                fatalDate: fullTask.fatalDate ? fullTask.fatalDate.toISOString() : null,
                endDate: fullTask.endDate ? fullTask.endDate.toISOString() : null,
                publicationDate: fullTask.publicationDate ? fullTask.publicationDate.toISOString() : null,
                protocolDate: fullTask.protocolDate ? fullTask.protocolDate.toISOString() : null,
            }
        }
    } catch (error) {
        console.error('Erro ao criar tarefa:', error)
        throw new Error('Erro ao criar tarefa. Verifique os dados e tente novamente.')
    }
    })
}

/**
 * Quick create task — inline creation with just title and columnId.
 */
export async function quickCreateTaskAction(title: string, columnId: string) {
    return withAuth(async ({ userId, permissions }) => {
    if (!hasPermission(permissions, 'kanban:write') && !hasPermission(permissions, 'kanban:own')) {
        throw new Error('Sem permissão para criar cards no kanban')
    }

    try {
        const task = await KanbanService.createTask(userId, {
            title,
            type: 'INTERNAL',
            columnId,
        })
    }

    try {
        const task = await KanbanService.createTask(userId, {
            title,
            type: 'INTERNAL',
            columnId,
        })

        const fullTask = await db.taskCard.findUnique({
            where: { id: task.id },
            include: {
                client: { select: { id: true, name: true } },
                process: { select: { id: true, number: true, folderName: true, type: true } },
                responsibleLawyer: { select: { id: true, name: true } },
                tags: true,
                checklist: { orderBy: { createdAt: 'asc' } }
            }
        })

        if (!fullTask) throw new Error('Task created but not found')

        return {
            success: true,
            task: {
                ...fullTask,
                createdAt: fullTask.createdAt.toISOString(),
                updatedAt: fullTask.updatedAt.toISOString(),
                completedAt: fullTask.completedAt ? fullTask.completedAt.toISOString() : null,
                fatalDate: fullTask.fatalDate ? fullTask.fatalDate.toISOString() : null,
                endDate: fullTask.endDate ? fullTask.endDate.toISOString() : null,
                publicationDate: fullTask.publicationDate ? fullTask.publicationDate.toISOString() : null,
                protocolDate: fullTask.protocolDate ? fullTask.protocolDate.toISOString() : null,
            }
        }
    } catch (error) {
        console.error('Erro ao criar tarefa rápida:', error)
        throw new Error('Erro ao criar tarefa.')
    }
    })
}

/**
 * TRANSACTIONAL move card.
 * Handles both cross-column moves and same-column reordering.
 * NO revalidatePath — React Query manages client state via optimistic updates.
 */
export async function moveCardAction(cardId: string, targetColumnId: string, targetPosition: number) {
    return withAuth(async () => {
        try {
            await KanbanService.moveCard(cardId, targetColumnId, targetPosition)
            return { success: true }
        } catch (error) {
            console.error('Erro ao mover tarefa:', error)
            throw new Error('Erro ao mover tarefa.')
        }
    })
}

export async function deleteTaskAction(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    try {
        await db.checklistItem.deleteMany({
            where: { taskId }
        })

        await db.taskCard.delete({
            where: { id: taskId, userId: user.id }
        })

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
        const item = await db.checklistItem.findUnique({
            where: { id: checklistItemId }
        })

        if (!item) {
            throw new Error('Item não encontrado')
        }

        const updated = await db.checklistItem.update({
            where: { id: checklistItemId },
            data: { isCompleted: !item.isCompleted }
        })

        return { success: true, isCompleted: updated.isCompleted, taskId: updated.taskId }
    } catch (error) {
        console.error('Erro ao atualizar checklist:', error)
        throw new Error('Erro ao atualizar checklist.')
    }
}

export async function updateTaskAction(taskId: string, rawData: unknown) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Não autorizado')
    }

    const data = UpdateTaskSchema.parse(rawData)
    const sanitizedData = {
        ...data,
        fatalDate: data.fatalDate ? parseDateInputToDate(data.fatalDate) : null,
        endDate: data.endDate ? parseDateInputToDate(data.endDate) : null,
        publicationDate: data.publicationDate ? parseDateInputToDate(data.publicationDate) : null,
        protocolDate: data.protocolDate ? parseDateInputToDate(data.protocolDate) : null,
        completedAt: data.completedAt ? parseDateInputToDate(data.completedAt) : null,
    }

    try {
        await KanbanService.updateTask(user.id, taskId, sanitizedData)
        return { success: true }
    } catch (error) {
        console.error('Erro detalhado ao atualizar tarefa:', error)
        throw new Error(`Erro ao atualizar tarefa: ${(error as Error).message}`)
    }
}

export async function toggleTaskCompletedAction(taskId: string, completed: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Nao autorizado")
    }

    try {
        await db.taskCard.update({
            where: { id: taskId, userId: user.id },
            data: {
                completedAt: completed ? new Date() : null,
                completedById: completed ? user.id : null,
                protocolDate: completed ? new Date() : undefined,
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao marcar tarefa como concluida:", error)
        throw new Error("Erro ao atualizar status da tarefa.")
    }
}

export async function getTaskCommentsAction(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Nao autorizado")
    }

    const comments = await db.auditLog.findMany({
        where: {
            entityType: "TASK_CARD",
            action: "COMMENT",
            entityId: taskId,
        },
        orderBy: { createdAt: "asc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    })

    return comments.map((comment) => {
        const payload = parseKanbanCommentPayload(comment.newData)

        return {
            id: comment.id,
            taskId: comment.entityId,
            createdAt: comment.createdAt.toISOString(),
            message: payload.message,
            toUserId: payload.toUserId,
            toUserName: payload.toUserName,
            readAt: payload.readAt,
            author: {
                id: comment.user.id,
                name: comment.user.name,
                email: comment.user.email,
            },
            isUnreadForCurrentUser: payload.toUserId === user.id && !payload.readAt,
        }
    })
}

export async function addTaskCommentAction(taskId: string, message: string, toUserId?: string | null, toUserName?: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Nao autorizado")
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
        throw new Error("Comentario vazio")
    }

    await db.auditLog.create({
        data: {
            entityId: taskId,
            entityType: "TASK_CARD",
            action: "COMMENT",
            userId: user.id,
            newData: {
                message: trimmedMessage,
                toUserId: toUserId || null,
                toUserName: toUserName || null,
                readAt: null,
            },
        }
    })

    return { success: true }
}

export async function markTaskCommentsReadAction(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Nao autorizado")
    }

    const comments = await db.auditLog.findMany({
        where: {
            entityType: "TASK_CARD",
            action: "COMMENT",
            entityId: taskId,
        },
        select: {
            id: true,
            newData: true,
        }
    })

    await Promise.all(
        comments
            .filter((comment) => {
                const payload = parseKanbanCommentPayload(comment.newData)
                return payload.toUserId === user.id && !payload.readAt
            })
            .map((comment) => {
                const payload = parseKanbanCommentPayload(comment.newData)

                return db.auditLog.update({
                    where: { id: comment.id },
                    data: {
                        newData: {
                            ...payload,
                            readAt: new Date().toISOString(),
                        }
                    }
                })
            })
    )

    return { success: true }
}

export async function getWorkspaceTagsAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Não autorizado")
    }

    return await db.tag.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    })
}

export async function createTagAction(name: string, color: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Não autorizado")
    }

    return await db.tag.create({
        data: {
            name,
            color,
            userId: user.id
        }
    })
}
