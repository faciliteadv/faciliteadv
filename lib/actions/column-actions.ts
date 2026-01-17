'use server'

import { createClient } from "@/utils/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Default columns per board type
const DEFAULT_TASK_COLUMNS = [
    { name: 'A Fazer', color: '#64748b', order: 0 },
    { name: 'Em Andamento', color: '#0ea5e9', order: 1 },
    { name: 'Revisão', color: '#eab308', order: 2 },
    { name: 'Refazer', color: '#ef4444', order: 3 },
    { name: 'Aguardando Docs', color: '#94a3b8', order: 4 },
    { name: 'Protocolar', color: '#10b981', order: 5 },
    { name: 'Concluído', color: '#1e3a8a', order: 6 },
]

const DEFAULT_CASE_COLUMNS = [
    { name: 'Novo Lead', color: '#a855f7', order: 0 },
    { name: 'Negociando', color: '#3b82f6', order: 1 },
    { name: 'Enviar Contrato', color: '#0ea5e9', order: 2 },
    { name: 'Aguard. Assinatura', color: '#eab308', order: 3 },
    { name: 'Aguard. Docs', color: '#94a3b8', order: 4 },
    { name: 'A Fazer', color: '#64748b', order: 5 },
    { name: 'Em Andamento', color: '#3b82f6', order: 6 },
    { name: 'Revisão', color: '#f59e0b', order: 7 },
    { name: 'Refazer', color: '#ef4444', order: 8 },
    { name: 'Distribuir', color: '#10b981', order: 9 },
    { name: 'Distribuído', color: '#1e3a8a', order: 10 },
]

const DEFAULT_INSS_COLUMNS = [
    { name: 'Novo Caso', color: '#a855f7', order: 0 },
    { name: 'Aguard. Assinaturas', color: '#eab308', order: 1 },
    { name: 'Aguard. Docs', color: '#94a3b8', order: 2 },
    { name: 'A Fazer', color: '#64748b', order: 3 },
    { name: 'Em Andamento', color: '#3b82f6', order: 4 },
    { name: 'Revisão', color: '#f59e0b', order: 5 },
    { name: 'Refazer', color: '#ef4444', order: 6 },
    { name: 'Protocolar', color: '#10b981', order: 7 },
    { name: 'Aguard. Resultado', color: '#0ea5e9', order: 8 },
    { name: 'Deferido', color: '#22c55e', order: 9 },
    { name: 'Indeferido', color: '#dc2626', order: 10 },
    { name: 'Recurso Admin.', color: '#f97316', order: 11 },
    { name: 'Ação Judicial', color: '#4f46e5', order: 12 },
]

export async function getKanbanColumns(boardType: 'tasks' | 'cases' | 'inss') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    let columns = await db.kanbanColumn.findMany({
        where: { userId: user.id, boardType },
        orderBy: { order: 'asc' }
    })

    // If no custom columns, create defaults
    if (columns.length === 0) {
        const defaults = boardType === 'tasks'
            ? DEFAULT_TASK_COLUMNS
            : boardType === 'cases'
                ? DEFAULT_CASE_COLUMNS
                : DEFAULT_INSS_COLUMNS

        await db.kanbanColumn.createMany({
            data: defaults.map(col => ({
                ...col,
                userId: user.id,
                boardType
            }))
        })

        columns = await db.kanbanColumn.findMany({
            where: { userId: user.id, boardType },
            orderBy: { order: 'asc' }
        })
    }

    return columns
}

export async function createColumnAction(boardType: string, name: string, color: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    // Get max order
    const maxOrder = await db.kanbanColumn.aggregate({
        where: { userId: user.id, boardType },
        _max: { order: true }
    })

    await db.kanbanColumn.create({
        data: {
            name,
            color,
            boardType,
            userId: user.id,
            order: (maxOrder._max.order ?? -1) + 1
        }
    })

    revalidatePath('/kanban')
    return { success: true }
}

export async function updateColumnAction(columnId: string, name: string, color: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    await db.kanbanColumn.update({
        where: { id: columnId, userId: user.id },
        data: { name, color }
    })

    revalidatePath('/kanban')
    return { success: true }
}

export async function deleteColumnAction(columnId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    await db.kanbanColumn.delete({
        where: { id: columnId, userId: user.id }
    })

    revalidatePath('/kanban')
    return { success: true }
}

export async function reorderColumnsAction(columnIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    // Update order for each column
    await Promise.all(
        columnIds.map((id, index) =>
            db.kanbanColumn.update({
                where: { id, userId: user.id },
                data: { order: index }
            })
        )
    )

    revalidatePath('/kanban')
    return { success: true }
}
