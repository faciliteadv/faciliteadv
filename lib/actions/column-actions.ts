'use server'

import { createClient } from "@/utils/supabase/server"
import { db } from "@/lib/db"
import { withAuth } from "@/lib/auth/with-auth"

/**
 * Get columns for a specific pipeline, ordered by position.
 * PURE READ â€” does NOT create anything.
 */
export async function getColumnsByPipeline(pipelineId: string) {
    const columns = await db.kanbanColumn.findMany({
        where: { pipelineId },
        orderBy: { position: 'asc' }
    })

    return columns
}

/**
 * Create a new column in a pipeline.
 * Position is automatically calculated as max + 1.
 * guardrail: pipelineId is mandatory. Pipeline-first architecture.
 */
export async function createColumnAction(pipelineId: string, name: string, color: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('NÃ£o autorizado')

    const maxPos = await db.kanbanColumn.aggregate({
        where: { pipelineId },
        _max: { position: true }
    })

    const column = await db.kanbanColumn.create({
        data: {
            name,
            color,
            pipelineId,
            userId: user.id,
            position: (maxPos._max.position ?? -1) + 1
        }
    })

    return { success: true, column }
}

/**
 * Update column name and/or color.
 * Also updates the `phase` field on all tasks in this column for legacy compat.
 */
export async function updateColumnAction(columnId: string, name: string, color: string) {
    return withAuth(async () => {
        return await db.$transaction(async (tx) => {
            const currentColumn = await tx.kanbanColumn.findUnique({
                where: { id: columnId }
            })

            if (!currentColumn) throw new Error('Coluna nÃ£o encontrada')

            const oldName = currentColumn.name

            await tx.kanbanColumn.update({
                where: { id: columnId },
                data: { name, color }
            })

            if (oldName !== name) {
                await tx.taskCard.updateMany({
                    where: { columnId },
                    data: { phase: name }
                })
            }

            return { success: true }
        })
    })
}

/**
 * Delete a column.
 * If the column still has cards, a destination column must be provided.
 */
export async function deleteColumnAction(columnId: string, targetColumnId?: string) {
    return withAuth(async () => {
        await db.$transaction(async (tx) => {
            const column = await tx.kanbanColumn.findUnique({
                where: { id: columnId },
                select: { id: true, pipelineId: true, position: true }
            })

            if (!column) {
                throw new Error("Coluna nÃ£o encontrada.")
            }

            const cardsCount = await tx.taskCard.count({
                where: { columnId }
            })

            if (cardsCount > 0) {
                if (!targetColumnId) {
                    throw new Error("Selecione uma fila de destino para mover os cards antes de excluir.")
                }

                const targetColumn = await tx.kanbanColumn.findFirst({
                    where: {
                        id: targetColumnId,
                        pipelineId: column.pipelineId
                    },
                    select: {
                        id: true,
                        name: true
                    }
                })

                if (!targetColumn) {
                    throw new Error("Fila de destino nÃ£o encontrada.")
                }

                const targetMaxPosition = await tx.taskCard.aggregate({
                    where: { columnId: targetColumnId },
                    _max: { position: true }
                })

                const tasksToMove = await tx.taskCard.findMany({
                    where: { columnId },
                    orderBy: { position: "asc" },
                    select: { id: true }
                })

                await Promise.all(
                    tasksToMove.map((task, index) =>
                        tx.taskCard.update({
                            where: { id: task.id },
                            data: {
                                columnId: targetColumnId,
                                position: (targetMaxPosition._max.position ?? -1) + 1 + index,
                                phase: targetColumn.name
                            }
                        })
                    )
                )
            }

            await tx.kanbanColumn.delete({
                where: { id: columnId }
            })

            await tx.kanbanColumn.updateMany({
                where: {
                    pipelineId: column.pipelineId,
                    position: { gt: column.position }
                },
                data: {
                    position: { decrement: 1 }
                }
            })
        })

        return { success: true }
    })
}

/**
 * Reorder columns within a pipeline.
 * Updates position for each column based on array order.
 * Only updates columns that belong to the specified pipeline (workspace isolation).
 */
export async function reorderColumnsAction(pipelineId: string, columnIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('NÃ£o autorizado')

    await Promise.all(
        columnIds.map((id, index) =>
            db.kanbanColumn.updateMany({
                where: { id, pipelineId },
                data: { position: index }
            })
        )
    )

    return { success: true }
}
