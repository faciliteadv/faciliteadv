'use client'

import { useState, useCallback } from "react"
import { KanbanBoard } from "./board"
import { TaskModal } from "./task-modal"
import { CaseModal } from "./case-modal"
import { ColumnModal } from "./column-modal"
import { useEsteiraModal } from "@/components/providers/esteira-modal-provider"
import { Plus } from "lucide-react"
import { PipelineActionsMenu } from "./pipeline-actions-menu"
import { Tag, Client, KanbanColumn } from "@prisma/client"
import { cn } from "@/lib/utils"
import { useKanbanTasks } from "./hooks/use-kanban-tasks"
import { useKanbanColumns } from "./hooks/use-kanban-columns"
import { useRouter } from "next/navigation"

// Define proper extended types for data with relations
type ExtendedTask = {
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
    fatalDate: string | null
    endDate: string | null
    publicationDate: string | null
    protocolDate: string | null
    client?: Pick<Client, 'id' | 'name'> | null
    process?: { id: string; number: string; folderName: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
    [key: string]: any
}

type ExtendedCase = {
    id: string
    [key: string]: any
}

type ProcessOption = {
    id: string
    number: string
    folderName: string | null
}

type Pipeline = {
    id: string
    name: string
    isDefault: boolean
    position?: number
    order?: string
}

type Props = {
    initialTasks: ExtendedTask[]
    initialColumns: KanbanColumn[]
    pipelines: Pipeline[]
    activePipelineId: string | null
    processes: ProcessOption[]
    cases: ExtendedCase[]
    users: { id: string; name: string | null; email: string | null }[]
    clients: { id: string; name: string }[]
}

export function KanbanWrapper({
    initialTasks,
    initialColumns,
    pipelines,
    activePipelineId,
    processes,
    cases,
    users,
    clients
}: Props) {
    const router = useRouter()
    const { openModal: openEsteiraModal } = useEsteiraModal()

    // Pipeline selection
    const [selectedPipelineId, setSelectedPipelineId] = useState(activePipelineId)

    // Kanban tasks hook — scoped to active pipeline
    const {
        tasks,
        isLoading: isLoadingTasks,
        moveTask,
        addTask,
        deleteTask,
        refetch: refetchTasks,
    } = useKanbanTasks(selectedPipelineId, initialTasks)

    // Kanban columns hook — Single Source of Truth
    // Replaces manual useState + useEffect sync
    // CRITICAL FIX: Only use initialColumns if we are viewing the server-rendered pipeline.
    // Otherwise, we must fetch fresh data to avoid showing Pipeline A's columns for Pipeline B.
    const shouldInjectInitialData = selectedPipelineId === activePipelineId
    const {
        columns,
        reorderColumns,
        refetch: refetchColumns
    } = useKanbanColumns(selectedPipelineId, shouldInjectInitialData ? initialColumns : [])

    // UI State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isCaseModalOpen, setIsCaseModalOpen] = useState(false)
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
    const [selectedPhase, setSelectedPhase] = useState<string | undefined>(undefined)

    // Pipeline switch handler
    const handlePipelineSwitch = useCallback((pipelineId: string) => {
        setSelectedPipelineId(pipelineId)
        // Update URL without full page reload
        router.push(`/kanban?pipeline=${pipelineId}`, { scroll: false })
    }, [router])

    // Handlers
    const handleTaskCreated = () => {
        refetchTasks()
    }

    const handleOpenAddTask = (phase: string) => {
        setSelectedPhase(phase)
        setIsTaskModalOpen(true)
    }

    // Handled by React Query now
    const handleColumnAdded = useCallback((column: KanbanColumn) => {
        refetchColumns()
    }, [refetchColumns])

    return (
        <>
            {/* Modals */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setSelectedPhase(undefined) }}
                processes={processes}
                columns={columns.map(col => ({ id: col.id, name: col.name }))}
                onTaskCreated={handleTaskCreated}
                defaultPhase={selectedPhase}
            />
            <CaseModal isOpen={isCaseModalOpen} onClose={() => setIsCaseModalOpen(false)} />
            <ColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                pipelineId={selectedPipelineId || ''}
            />

            {/* Main Content */}
            <div className="flex flex-col h-full">
                {/* Pipeline Selector — Full-Width Horizontal Strip */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Pipeline Tabs — scrollable when overflowing */}
                        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-0.5">
                            {pipelines.map(pipeline => (
                                <div
                                    role="button"
                                    key={pipeline.id}
                                    onClick={() => handlePipelineSwitch(pipeline.id)}
                                    className={cn(
                                        "flex items-center justify-center whitespace-nowrap py-2.5 px-6 rounded-lg text-sm font-semibold transition-all min-w-fit cursor-pointer select-none",
                                        selectedPipelineId === pipeline.id
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200/50"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-slate-50"
                                    )}
                                >
                                    {pipeline.name}
                                    {/* Action Menu - Only visible on hover or if active */}
                                    <div onClick={(e) => e.stopPropagation()} className="ml-1">
                                        <PipelineActionsMenu
                                            pipelineId={pipeline.id}
                                            pipelineName={pipeline.name}
                                            isActive={selectedPipelineId === pipeline.id}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* "+" Button — Create New Pipeline */}
                            <button
                                onClick={openEsteiraModal}
                                className="flex items-center justify-center gap-1.5 whitespace-nowrap py-2.5 px-4 rounded-lg text-sm font-medium transition-all min-w-fit border-2 border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                                title="Criar nova esteira"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nova Esteira</span>
                            </button>
                        </div>

                        {/* Right Side — New Task Button */}
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Tarefa
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                    {pipelines.length === 0 ? (
                        /* No pipelines — prompt to create */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4">
                                <p className="text-slate-500 text-lg">Nenhuma esteira encontrada</p>
                                <button
                                    onClick={openEsteiraModal}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Criar Primeira Esteira
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex-1 overflow-hidden relative"
                            // KEY PROP IS CRITICAL for strict isolation.
                            // Forces complete remount of board when pipeline changes.
                            key={selectedPipelineId}
                        >
                            <KanbanBoard
                                tasks={tasks}
                                columns={columns}
                                pipelineId={selectedPipelineId || ''}
                                onOpenAddTask={handleOpenAddTask}
                                users={users}
                                clients={clients}
                                processes={processes}
                                // @ts-ignore
                                onMoveTask={moveTask}
                                onDeleteTask={deleteTask}
                                // Now handled via query invalidation in modal/hook
                                onColumnAdded={handleColumnAdded}
                                onColumnsChanged={() => { }} // Optimistic handled in hook
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
