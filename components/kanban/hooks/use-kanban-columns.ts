import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getColumnsByPipeline, createColumnAction, updateColumnAction, deleteColumnAction, reorderColumnsAction } from '@/lib/actions/column-actions'
import { KanbanColumn } from '@prisma/client'

// Adapter to use project's toast if needed, or just standard console for now and UI handles it.
// The user wants PROFESSIONAL flow. 
// I'll stick to data fetching logic here.

export function useKanbanColumns(pipelineId: string | null, initialColumns: KanbanColumn[] = []) {
    const queryClient = useQueryClient()
    const QUERY_KEY = ['kanban-columns', pipelineId]

    // 1. Fetch Columns
    const { data: columns = initialColumns, isLoading, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!pipelineId) return []
            return await getColumnsByPipeline(pipelineId)
        },
        initialData: initialColumns.length > 0 ? initialColumns : undefined, // Seed with server data
        enabled: !!pipelineId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // 2. Optimistic Reorder (Crucial for drag-drop)
    const { mutate: reorderColumns } = useMutation({
        mutationFn: async (newOrder: KanbanColumn[]) => {
            if (!pipelineId) return
            // Fix: reorderColumnsAction expects just the IDs in order
            const ids = newOrder.map(col => col.id)
            await reorderColumnsAction(pipelineId, ids)
        },
        onMutate: async (newOrder) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const previouscolumns = queryClient.getQueryData(QUERY_KEY)
            queryClient.setQueryData(QUERY_KEY, newOrder)
            return { previouscolumns }
        },
        onError: (err, newOrder, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.previouscolumns)
            // toast.error("Falha ao reordenar colunas")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // 3. Add Column
    const { mutate: addColumn } = useMutation({
        mutationFn: async ({ name, color }: { name: string, color: string }) => {
            if (!pipelineId) throw new Error("No pipeline selected")
            return await createColumnAction(pipelineId, name, color)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    return {
        columns,
        isLoading,
        reorderColumns,
        refetch,
        addColumn
    }
}
