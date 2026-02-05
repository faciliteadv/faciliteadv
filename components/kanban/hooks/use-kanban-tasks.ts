import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { arrayMove } from "@dnd-kit/sortable"
import { TaskCard, Tag, Client } from "@prisma/client"
import { moveCardAction, deleteTaskAction, createTaskAction, fetchBoardAction } from "@/lib/actions/kanban-actions"
import { useRouter } from 'next/navigation'

// Define the ExtendedTask type matching the one in the components
export type ExtendedTask = Omit<TaskCard, 'phase' | 'createdAt' | 'updatedAt' | 'fatalDate' | 'endDate' | 'publicationDate' | 'protocolDate'> & {
    phase: string
    createdAt: string
    updatedAt: string
    fatalDate: string | null
    endDate: string | null
    publicationDate: string | null
    protocolDate: string | null
    columnId?: string | null
    client?: Pick<Client, 'id' | 'name'> | null
    process?: { id: string; number: string; folderName: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

// Structured Query Key for Granularity
const QUERY_KEY = ['kanban-tasks', { scope: 'board', view: 'all' }]

export function useKanbanTasks(initialTasks: ExtendedTask[]) {
    const queryClient = useQueryClient()
    const router = useRouter()

    // 1. Query (The Single Source of Truth)
    // Real Server State Architecture:
    // - queryFn: fetchBoardAction (Server Action)
    // - initialData: Hydrates from Server Props
    // - staleTime: 5 mins (Prevents aggressive background refetching)
    // - refetchOnWindowFocus: false (Prevents layout jumps)
    const { data: tasks = initialTasks } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => fetchBoardAction(),
        initialData: initialTasks,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    })

    // 2. Mutations with Snapshot Pattern

    // Move Task Mutation
    const { mutate: moveTaskMutation } = useMutation({
        mutationFn: async ({ taskId, targetColumnId, targetPhaseName, overTaskId }: { taskId: string, targetColumnId: string, targetPhaseName?: string, overTaskId?: string }) => {
            const task = tasks.find(t => t.id === taskId)
            if (!task) return

            const isColumnChange = task.columnId !== targetColumnId

            if (isColumnChange) {
                await moveCardAction(taskId, targetColumnId)
            } else {
                // Logic for same-column reorder (if backend supported it)
            }
        },
        onMutate: async ({ taskId, targetColumnId, targetPhaseName, overTaskId }) => {
            // A. Cancel any outgoing refetches (Mutation Ordering Protection)
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })

            // B. Snapshot the previous value
            const previousTasks = queryClient.getQueryData<ExtendedTask[]>(QUERY_KEY)

            // C. Optimistically update to the new value
            queryClient.setQueryData<ExtendedTask[]>(QUERY_KEY, (old) => {
                if (!old) return []
                const activeIndexer = old.findIndex(t => t.id === taskId)
                if (activeIndexer === -1) return old

                const activeTask = old[activeIndexer]
                const isColumnChange = activeTask.columnId !== targetColumnId
                let newTasks = [...old]

                if (isColumnChange) {
                    newTasks[activeIndexer] = {
                        ...activeTask,
                        columnId: targetColumnId,
                        phase: targetPhaseName || activeTask.phase
                    }
                } else if (overTaskId) {
                    const overIndexer = old.findIndex(t => t.id === overTaskId)
                    if (activeIndexer !== overIndexer && overIndexer !== -1) {
                        newTasks = arrayMove(newTasks, activeIndexer, overIndexer)
                    }
                }
                return newTasks
            })

            // D. Return context for rollback
            return { previousTasks }
        },
        onError: (err, newTodo, context) => {
            console.error("Move failed", err)
            // E. Rollback to the previous value
            if (context?.previousTasks) {
                queryClient.setQueryData(QUERY_KEY, context.previousTasks)
            }
            alert("Erro ao mover tarefa.")
        },
        onSettled: () => {
            // F. Eventual Consistency (Background Validate)
            // Replaces router.refresh() to avoid Page Flicker
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // Add Task Mutation
    const { mutate: addTaskMutation } = useMutation({
        mutationFn: async (task: ExtendedTask) => {
            // Facade: The Modal already called Server Action. This acts as a Sync.
            return task
        },
        onMutate: async (task) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const previousTasks = queryClient.getQueryData<ExtendedTask[]>(QUERY_KEY)

            queryClient.setQueryData<ExtendedTask[]>(QUERY_KEY, (old) => {
                return old ? [task, ...old] : [task]
            })

            return { previousTasks }
        },
        onSettled: () => {
            // Sync with server state
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // Delete Task Mutation
    const { mutate: deleteTaskMutation } = useMutation({
        mutationFn: async (taskId: string) => {
            await deleteTaskAction(taskId)
        },
        onMutate: async (taskId) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const previousTasks = queryClient.getQueryData<ExtendedTask[]>(QUERY_KEY)

            queryClient.setQueryData<ExtendedTask[]>(QUERY_KEY, (old) => {
                return old ? old.filter(t => t.id !== taskId) : []
            })

            return { previousTasks }
        },
        onError: (err, taskId, context) => {
            console.error("Delete failed", err)
            if (context?.previousTasks) {
                queryClient.setQueryData(QUERY_KEY, context.previousTasks)
            }
            alert("Erro ao excluir tarefa.")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
    })

    // Facade Functions (Adapters to maintain API)
    const moveTask = useCallback((taskId: string, targetColumnId: string, targetPhaseName?: string, overTaskId?: string) => {
        moveTaskMutation({ taskId, targetColumnId, targetPhaseName, overTaskId })
    }, [moveTaskMutation])

    const addTask = useCallback((task: ExtendedTask) => {
        addTaskMutation(task)
    }, [addTaskMutation])

    const deleteTask = useCallback((taskId: string) => {
        deleteTaskMutation(taskId)
    }, [deleteTaskMutation])

    // Legacy Sync - Replaced by React Query internal hydration
    // Kept empty to satisfy signature if called
    const syncServerTasks = useCallback((serverTasks: ExtendedTask[]) => {
        // Option: we could update query data here if we trust server props more
        // queryClient.setQueryData(QUERY_KEY, serverTasks)
    }, [])

    return {
        tasks,
        moveTask,
        addTask,
        deleteTask,
        syncServerTasks
    }
}
