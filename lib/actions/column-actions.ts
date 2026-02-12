'use server'

import { createClient } from "@/utils/supabase/server"
import { db } from "@/lib/db"
import { withAuth } from "@/lib/auth/with-auth"

/**
 * Get columns for a specific pipeline, ordered by position.
 * PURE READ — does NOT create anything.
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
    if (!user) throw new Error('Não autorizado')

    // Get max position
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
    return withAuth(async ({ userId }) => {
        return await db.$transaction(async (tx) => {
            const currentColumn = await tx.kanbanColumn.findUnique({
                where: { id: columnId }
            })

            if (!currentColumn) throw new Error('Coluna não encontrada')

            const oldName = currentColumn.name

            await tx.kanbanColumn.update({
                where: { id: columnId },
                data: { name, color }
            })

            // Sync phase field on tasks if column was renamed
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
 */
export async function deleteColumnAction(columnId: string) {
    return withAuth(async () => {
        // Safety check: Don't delete if has cards
        const cardsCount = await db.taskCard.count({
            where: { columnId }
        })

        if (cardsCount > 0) {
            throw new Error("Não é possível excluir uma coluna com cards. Mova ou arquive os cards primeiro.")
        }

        await db.kanbanColumn.delete({
            where: { id: columnId }
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
    if (!user) throw new Error('Não autorizado')

    // Only update columns that belong to this pipeline
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
