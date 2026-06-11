import { db } from "@/lib/db"
import { DaysType, PracticeArea, TaskType } from "@prisma/client"
import { parseKanbanCommentPayload } from "@/lib/utils/kanban"

export const KanbanService = {
    /**
     * Get all tasks for a specific pipeline, ordered by position within each column.
     * This is the ONLY way to fetch board tasks — always scoped to a pipeline.
     */
    getTasksByPipeline: async (pipelineId: string, currentUserId?: string, ownOnly?: boolean) => {
        // Get column IDs for this pipeline
        const columns = await db.kanbanColumn.findMany({
            where: { pipelineId },
            select: { id: true }
        })
        const columnIds = columns.map(c => c.id)

        if (columnIds.length === 0) return []

        // kanban:own → only tasks created by or assigned to this user
        const ownershipFilter = ownOnly && currentUserId
            ? { OR: [{ userId: currentUserId }, { responsibleLawyerId: currentUserId }] }
            : {}

        const tasks = await db.taskCard.findMany({
            where: {
                columnId: { in: columnIds },
                isArchived: false,
                ...ownershipFilter,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                process: {
                    select: {
                        id: true,
                        number: true,
                        folderName: true,
                        type: true
                    }
                },
                responsibleLawyer: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tags: true,
                checklist: {
                    orderBy: { createdAt: 'asc' }
                },
                column: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            },
            orderBy: [
                { columnId: 'asc' },
                { position: 'asc' }
            ]
        })

        const taskIds = tasks.map((task) => task.id)
        const commentLogs = taskIds.length > 0
            ? await db.auditLog.findMany({
                where: {
                    entityType: "TASK_CARD",
                    action: "COMMENT",
                    entityId: { in: taskIds },
                },
                select: {
                    id: true,
                    entityId: true,
                    newData: true,
                }
            })
            : []

        const commentsByTaskId = commentLogs.reduce<Record<string, { count: number; hasUnread: boolean }>>((accumulator, log) => {
            const payload = parseKanbanCommentPayload(log.newData)
            const current = accumulator[log.entityId] || { count: 0, hasUnread: false }

            accumulator[log.entityId] = {
                count: current.count + 1,
                hasUnread: current.hasUnread || Boolean(
                    currentUserId &&
                    payload.toUserId === currentUserId &&
                    !payload.readAt
                ),
            }

            return accumulator
        }, {})

        return tasks.map(task => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            completedAt: task.completedAt ? task.completedAt.toISOString() : null,
            fatalDate: task.fatalDate ? task.fatalDate.toISOString() : null,
            endDate: task.endDate ? task.endDate.toISOString() : null,
            publicationDate: task.publicationDate ? task.publicationDate.toISOString() : null,
            protocolDate: task.protocolDate ? task.protocolDate.toISOString() : null,
            commentsCount: commentsByTaskId[task.id]?.count ?? 0,
            hasUnreadComments: commentsByTaskId[task.id]?.hasUnread ?? false,
        }))
    },

    /**
     * TRANSACTIONAL move card between columns (or reorder within column).
     * Handles position recalculation for both source and target columns.
     */
    moveCard: async (cardId: string, targetColumnId: string, targetPosition: number) => {
        return await db.$transaction(async (tx) => {
            // 1. Get the card's current state
            const card = await tx.taskCard.findUnique({
                where: { id: cardId },
                select: { id: true, columnId: true, position: true }
            })

            if (!card) throw new Error('Card não encontrado')

            const sourceColumnId = card.columnId
            const isColumnChange = sourceColumnId !== targetColumnId

            // 2. Get target column name for legacy phase field
            const targetColumn = await tx.kanbanColumn.findUnique({
                where: { id: targetColumnId },
                select: { name: true }
            })

            if (!targetColumn) throw new Error('Coluna destino não encontrada')

            if (isColumnChange) {
                // --- CROSS-COLUMN MOVE ---

                // A. Close the gap in the source column
                await tx.taskCard.updateMany({
                    where: {
                        columnId: sourceColumnId,
                        position: { gt: card.position }
                    },
                    data: { position: { decrement: 1 } }
                })

                // B. Make space in the target column
                await tx.taskCard.updateMany({
                    where: {
                        columnId: targetColumnId,
                        position: { gte: targetPosition }
                    },
                    data: { position: { increment: 1 } }
                })

                // C. Move the card
                await tx.taskCard.update({
                    where: { id: cardId },
                    data: {
                        columnId: targetColumnId,
                        position: targetPosition,
                        phase: targetColumn.name
                    }
                })
            } else {
                // --- SAME-COLUMN REORDER ---
                const oldPos = card.position
                const newPos = targetPosition

                if (oldPos === newPos) return card

                if (oldPos < newPos) {
                    // Moving down: shift items between old+1 and new UP by 1
                    await tx.taskCard.updateMany({
                        where: {
                            columnId: sourceColumnId,
                            position: { gt: oldPos, lte: newPos }
                        },
                        data: { position: { decrement: 1 } }
                    })
                } else {
                    // Moving up: shift items between new and old-1 DOWN by 1
                    await tx.taskCard.updateMany({
                        where: {
                            columnId: sourceColumnId,
                            position: { gte: newPos, lt: oldPos }
                        },
                        data: { position: { increment: 1 } }
                    })
                }

                await tx.taskCard.update({
                    where: { id: cardId },
                    data: { position: newPos }
                })
            }

            return { success: true }
        })
    },

    createTask: async (userId: string, data: {
        title: string
        description?: string
        type: TaskType
        columnId: string
        fatalDate?: Date
        endDate?: Date
        publicationDate?: Date
        protocolDate?: Date
        daysCount?: number
        daysType?: 'BUSINESS' | 'CALENDAR'
        practiceArea?: string
        processId?: string
        clientId?: string
        responsibleLawyerId?: string
        points?: number
        tags?: string[]
        checklist?: string[]
    }) => {
        const { checklist, tags, practiceArea, daysType, columnId, ...taskData } = data

        // Get column name for legacy phase field + calculate next position
        const column = await db.kanbanColumn.findUnique({
            where: { id: columnId },
            select: { name: true }
        })

        const maxPosition = await db.taskCard.aggregate({
            where: { columnId },
            _max: { position: true }
        })

        return await db.taskCard.create({
            data: {
                ...taskData,
                userId,
                columnId,
                position: (maxPosition._max.position ?? -1) + 1,
                phase: column?.name || 'A Fazer',
                practiceArea: practiceArea as PracticeArea | undefined,
                daysType: daysType as DaysType | undefined,
                tags: tags && tags.length > 0 ? {
                    connect: tags.map(id => ({ id }))
                } : undefined,
                checklist: checklist && checklist.length > 0 ? {
                    create: checklist.map(title => ({ title }))
                } : undefined
            }
        })
    },

    updateTask: async (userId: string, taskId: string, data: Partial<{
        title: string
        description: string
        type: TaskType
        fatalDate: Date | null
        endDate: Date | null
        publicationDate: Date | null
        protocolDate: Date | null
        daysCount: number
        daysType: 'BUSINESS' | 'CALENDAR'
        practiceArea: string
        processId: string | null
        clientId: string | null
        responsibleLawyerId: string | null
        points: number
        tags: string[]
        completedAt: Date | null
        completedById: string | null
    }>) => {
        const { tags, practiceArea, daysType, ...taskData } = data

        return await db.taskCard.update({
            where: { id: taskId, userId },
            data: {
                ...taskData,
                practiceArea: practiceArea as PracticeArea | undefined,
                daysType: daysType as DaysType | undefined,
                tags: tags ? {
                    set: [],
                    connect: tags.map(id => ({ id }))
                } : undefined
            }
        })
    },

    checkAutoArchive: async (userId: string) => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        await db.taskCard.updateMany({
            where: {
                userId,
                phase: 'PROTOCOLLED',
                updatedAt: { lte: thirtyDaysAgo },
                isArchived: false
            },
            data: { isArchived: true }
        })
    }
}
