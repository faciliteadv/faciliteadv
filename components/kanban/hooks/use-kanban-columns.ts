import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getColumnsByPipeline, createColumnAction, updateColumnAction, deleteColumnAction, reorderColumnsAction } from '@/lib/actions/column-actions'
import { KanbanColumn } from '@prisma/client'

/**
 * useKanbanColumns — Single Source of Truth for column data.
 *
 * ARCHITECTURE:
 * - React Query is the ONLY state store for columns.
 * - board.tsx receives columns as props and NEVER copies them to local state.
 * - All mutations (add, delete, rename, reorder) go through this hook with optimistic updates.
 * - QUERY_KEY is stabilized via useMemo to prevent stale closures.
 * - placeholderData: keepPreviousData prevents flash of empty state during pipeline switches.
 */
export function useKanbanColumns(pipelineId: string | null, initialColumns: KanbanColumn[] = []) {
    const queryClient = useQueryClient()

    // Stable query key — prevents stale closures in mutation callbacks
    const QUERY_KEY = useMemo(() => ['kanban-columns', pipelineId] as const, [pipelineId])

    // 1. Fetch Columns
    const { data: columns = [], isLoading, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!pipelineId) return []
            return await getColumnsByPipeline(pipelineId)
        },
        initialData: initialColumns.length > 0 ? initialColumns : undefined,
        enabled: !!pipelineId,
        staleTime: 1000 * 30, // 30s — balanced between freshness and performance
        placeholderData: keepPreviousData, // Show previous pipeline data during transition
    })

    // 2. Optimistic Reorder (Column drag-drop)
    const { mutate: reorderColumns } = useMutation({
        mutationFn: async (newOrder: KanbanColumn[]) => {
            if (!pipelineId) return
            const ids = newOrder.map(col => col.id)
            await reorderColumnsAction(pipelineId, ids)
        },
        onMutate: async (newOrder) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const snapshot = queryClient.getQueryData(QUERY_KEY)
            queryClient.setQueryData(QUERY_KEY, newOrder)
            return { snapshot }
        },
        onError: (_err, _newOrder, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.snapshot)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // 3. Add Column (Optimistic — instant feedback in board)
    const { mutate: addColumn } = useMutation({
        mutationFn: async ({ name, color }: { name: string, color: string }) => {
            if (!pipelineId) throw new Error("No pipeline selected")
            return await createColumnAction(pipelineId, name, color)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // 4. Delete Column (Optimistic — removes instantly, rollback on failure)
    const { mutate: deleteColumn } = useMutation({
        mutationFn: async (columnId: string) => {
            await deleteColumnAction(columnId)
        },
        onMutate: async (columnId) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const snapshot = queryClient.getQueryData<KanbanColumn[]>(QUERY_KEY)
            queryClient.setQueryData<KanbanColumn[]>(QUERY_KEY, (old = []) =>
                old.filter(c => c.id !== columnId)
            )
            return { snapshot }
        },
        onError: (_err, _columnId, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.snapshot)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // 5. Rename Column (Optimistic — instant name update in board)
    const { mutate: renameColumn } = useMutation({
        mutationFn: async ({ columnId, name, color }: { columnId: string, name: string, color: string }) => {
            await updateColumnAction(columnId, name, color)
        },
        onMutate: async ({ columnId, name }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const snapshot = queryClient.getQueryData<KanbanColumn[]>(QUERY_KEY)
            queryClient.setQueryData<KanbanColumn[]>(QUERY_KEY, (old = []) =>
                old.map(c => c.id === columnId ? { ...c, name } : c)
            )
            return { snapshot }
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.snapshot)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    return {
        columns,
        isLoading,
        reorderColumns,
        addColumn,
        deleteColumn,
        renameColumn,
        refetch,
    }
}
