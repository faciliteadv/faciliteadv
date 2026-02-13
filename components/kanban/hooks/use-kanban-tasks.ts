'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBoardAction, moveCardAction, deleteTaskAction } from '@/lib/actions/kanban-actions'

type Task = any // Will be typed from the full TaskCard with relations

/**
 * Kanban tasks hook — pipeline-scoped, with proper optimistic updates.
 * 
 * KEY DESIGN DECISIONS:
 * - Query key includes pipelineId so changing pipeline = new cache
 * - moveTask does optimistic update with snapshot rollback
 * - NO invalidateQueries on settle — we trust the optimistic state
 * - Server is source of truth only on initial load and explicit refetch
 */
export function useKanbanTasks(pipelineId: string | null, initialTasks: Task[] = []) {
    const queryClient = useQueryClient()

    const QUERY_KEY = ['kanban-tasks', pipelineId]

    // Fetch tasks for the active pipeline
    const { data: tasks = initialTasks, isLoading, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            if (!pipelineId) return []
            return await fetchBoardAction(pipelineId)
        },
        initialData: initialTasks.length > 0 ? initialTasks : undefined,
        enabled: !!pipelineId,
        staleTime: 1000 * 60 * 5, // 5 min — don't refetch aggressively
        refetchOnWindowFocus: false, // Don't fight optimistic state
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
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: QUERY_KEY })

            // Snapshot current state for rollback
            const snapshot = queryClient.getQueryData<Task[]>(QUERY_KEY)

            // Optimistic update
            queryClient.setQueryData<Task[]>(QUERY_KEY, (old = []) => {
                const card = old.find(t => t.id === cardId)
                if (!card) return old

                const sourceColumnId = card.columnId
                const isColumnChange = sourceColumnId !== targetColumnId

                let updated = old.map(t => ({ ...t })) // Shallow clone all

                if (isColumnChange) {
                    // 1. Close gap in source column
                    updated = updated.map(t => {
                        if (t.columnId === sourceColumnId && t.position > card.position) {
                            return { ...t, position: t.position - 1 }
                        }
                        return t
                    })

                    // 2. Make space in target column
                    updated = updated.map(t => {
                        if (t.columnId === targetColumnId && t.position >= targetPosition) {
                            return { ...t, position: t.position + 1 }
                        }
                        return t
                    })

                    // 3. Move the card
                    updated = updated.map(t => {
                        if (t.id === cardId) {
                            return { ...t, columnId: targetColumnId, position: targetPosition }
                        }
                        return t
                    })
                } else {
                    // Same column reorder
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
            // Rollback on failure
            if (context?.snapshot) {
                queryClient.setQueryData(QUERY_KEY, context.snapshot)
            }
        },
        // NO onSettled invalidation — trust optimistic state
    })

    // === DELETE TASK ===
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

    // === ADD TASK (directly to cache) ===
    const addTask = useCallback((task: Task) => {
        queryClient.setQueryData<Task[]>(QUERY_KEY, (old = []) => {
            return [...old, task]
        })
    }, [queryClient, QUERY_KEY])

    // === FACADE FUNCTIONS ===

    /**
     * Move a task to a target column at a specific position.
     * Board.tsx computes the position from the drop context.
     */
    const moveTask = useCallback((cardId: string, targetColumnId: string, targetPosition: number) => {
        moveTaskMutation({ cardId, targetColumnId, targetPosition })
    }, [moveTaskMutation])

    const deleteTask = useCallback((taskId: string) => {
        deleteTaskMutation(taskId)
    }, [deleteTaskMutation])

    return {
        tasks,
        isLoading,
        moveTask,
        addTask,
        deleteTask,
        refetch,
    }
}
