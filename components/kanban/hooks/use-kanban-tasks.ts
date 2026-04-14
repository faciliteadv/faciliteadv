'use client'

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { fetchBoardAction, moveCardAction, deleteTaskAction, toggleTaskCompletedAction } from '@/lib/actions/kanban-actions'
import { Tag } from '@prisma/client'
import { getNextProtocolDate } from '@/lib/utils/kanban'

type Task = {
    id: string
    title: string
    description?: string | null
    type?: string
    phase: string
    columnId: string
    position: number
    isArchived: boolean
    createdAt: string
    updatedAt: string
    completedAt?: string | null
    fatalDate?: string | null
    endDate?: string | null
    publicationDate?: string | null
    protocolDate?: string | null
    practiceArea?: string | null
    client?: { id: string; name: string } | null
    process?: { id: string; number: string | null; folderName: string | null; type?: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
    commentsCount?: number
    hasUnreadComments?: boolean
    [key: string]: unknown
}

/**
 * useKanbanTasks — Single Source of Truth for task data.
 *
 * ARCHITECTURE:
 * - React Query is the ONLY state store for tasks.
 * - board.tsx receives tasks as props and NEVER copies them to local state.
 * - QUERY_KEY is stabilized via useMemo to prevent stale closures.
 * - placeholderData: keepPreviousData prevents flash of empty state during pipeline switches.
 * - initialData is ONLY injected when the caller explicitly provides it (controlled by KanbanWrapper).
 */
export function useKanbanTasks(pipelineId: string | null, initialTasks: Task[] = []) {
    const queryClient = useQueryClient()

    // Stable query key — prevents stale closures in mutation callbacks
    const QUERY_KEY = useMemo(() => ['kanban-tasks', pipelineId] as const, [pipelineId])

    // Fetch tasks for the active pipeline
    const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!pipelineId) return []
            return await fetchBoardAction(pipelineId)
        },
        initialData: initialTasks.length > 0 ? initialTasks : undefined,
        enabled: !!pipelineId,
        staleTime: 1000 * 30, // 30s — balanced between freshness and performance
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData, // Show previous pipeline data during transition
    })

    // === MOVE TASK (Optimistic + Transactional) ===
    const { mutate: moveTaskMutation } = useMutation({
        mutationFn: async ({ cardId, targetColumnId, targetPosition }: {
            cardId: string
            targetColumnId: string
            targetPosition: number
        }) => {
            await moveCardAction(cardId, targetColumnId, targetPosition)
        },
        onMutate: async ({ cardId, targetColumnId, targetPosition }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const snapshot = queryClient.getQueryData<Task[]>(QUERY_KEY)

            queryClient.setQueryData<Task[]>(QUERY_KEY, (old = []) => {
                const card = old.find(t => t.id === cardId)
                if (!card) return old

                const sourceColumnId = card.columnId
                const isColumnChange = sourceColumnId !== targetColumnId

                let updated = old.map(t => ({ ...t }))

                if (isColumnChange) {
                    updated = updated.map(t => {
                        if (t.columnId === sourceColumnId && t.position > card.position) {
                            return { ...t, position: t.position - 1 }
                        }
                        return t
                    })
                    updated = updated.map(t => {
                        if (t.columnId === targetColumnId && t.position >= targetPosition) {
                            return { ...t, position: t.position + 1 }
                        }
                        return t
                    })
                    updated = updated.map(t => {
                        if (t.id === cardId) {
                            return { ...t, columnId: targetColumnId, position: targetPosition }
                        }
                        return t
                    })
                } else {
                    const oldPos = card.position
                    const newPos = targetPosition

                    updated = updated.map(t => {
                        if (t.id === cardId) {
                            return { ...t, position: newPos }
                        }
                        if (t.columnId === sourceColumnId) {
                            if (oldPos < newPos && t.position > oldPos && t.position <= newPos) {
                                return { ...t, position: t.position - 1 }
                            }
                            if (oldPos > newPos && t.position >= newPos && t.position < oldPos) {
                                return { ...t, position: t.position + 1 }
                            }
                        }
                        return t
                    })
                }

                return updated
            })

            return { snapshot }
        },
        onError: (err, vars, context) => {
            console.error('[Kanban] Falha ao mover card:', {
                error: err,
                cardId: vars.cardId,
                targetColumnId: vars.targetColumnId,
                targetPosition: vars.targetPosition,
            })
            if (context?.snapshot) {
                queryClient.setQueryData(QUERY_KEY, context.snapshot)
            }
        },
    })

    // === DELETE TASK (Optimistic) ===
    const { mutate: deleteTaskMutation } = useMutation({
        mutationFn: async (taskId: string) => {
            await deleteTaskAction(taskId)
        },
        onMutate: async (taskId) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const snapshot = queryClient.getQueryData<Task[]>(QUERY_KEY)

            queryClient.setQueryData<Task[]>(QUERY_KEY, (old = []) => {
                return old.filter(t => t.id !== taskId)
            })

            return { snapshot }
        },
        onError: (_err, _vars, context) => {
            if (context?.snapshot) {
                queryClient.setQueryData(QUERY_KEY, context.snapshot)
            }
        },
    })

    // === TOGGLE COMPLETED (Optimistic) ===
    const { mutate: toggleTaskCompletedMutation } = useMutation({
        mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
            await toggleTaskCompletedAction(taskId, completed)
        },
        onMutate: async ({ taskId, completed }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })
            const snapshot = queryClient.getQueryData<Task[]>(QUERY_KEY)

            queryClient.setQueryData<Task[]>(QUERY_KEY, (old = []) =>
                old.map((task) =>
                    task.id === taskId
                        ? {
                            ...task,
                            completedAt: completed ? new Date().toISOString() : null,
                            protocolDate: getNextProtocolDate(task.protocolDate, completed),
                        }
                        : task
                )
            )

            return { snapshot }
        },
        onError: (_err, _vars, context) => {
            if (context?.snapshot) {
                queryClient.setQueryData(QUERY_KEY, context.snapshot)
            }
        },
    })

    // === ADD TASK (directly to cache) ===
    const addTask = useCallback((task: Task) => {
        queryClient.setQueryData<Task[]>(QUERY_KEY, (old = []) => {
            return [...old, task]
        })
    }, [queryClient, QUERY_KEY])

    // === FACADE FUNCTIONS ===
    const moveTask = useCallback((cardId: string, targetColumnId: string, targetPosition: number) => {
        moveTaskMutation({ cardId, targetColumnId, targetPosition })
    }, [moveTaskMutation])

    const deleteTask = useCallback((taskId: string) => {
        deleteTaskMutation(taskId)
    }, [deleteTaskMutation])

    const toggleTaskCompleted = useCallback((taskId: string, completed: boolean) => {
        toggleTaskCompletedMutation({ taskId, completed })
    }, [toggleTaskCompletedMutation])

    return {
        tasks,
        isLoading,
        moveTask,
        addTask,
        deleteTask,
        toggleTaskCompleted,
        refetch,
    }
}
