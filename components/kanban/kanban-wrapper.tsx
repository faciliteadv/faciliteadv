'use client'

import { startTransition, useState, useCallback, useMemo, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Tag, Client, KanbanColumn } from "@prisma/client"
import { Plus, Search, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { useEsteiraModal } from "@/components/providers/esteira-modal-provider"

import { KanbanBoard } from "./board"
import { TaskModal } from "./task-modal"
import { ColumnModal } from "./column-modal"
import { PipelineActionsMenu } from "./pipeline-actions-menu"
import { useKanbanTasks } from "./hooks/use-kanban-tasks"
import { useKanbanColumns } from "./hooks/use-kanban-columns"
import { KanbanSortMode, KANBAN_PRACTICE_AREA_OPTIONS, matchesKanbanSearch, sortKanbanTasks } from "@/lib/utils/kanban"
import { fetchBoardAction, updateTaskAction } from "@/lib/actions/kanban-actions"
import { getColumnsByPipeline } from "@/lib/actions/column-actions"

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
    completedAt: string | null
    fatalDate: string | null
    endDate: string | null
    publicationDate: string | null
    protocolDate: string | null
    client?: Pick<Client, "id" | "name"> | null
    process?: { id: string; number: string | null; folderName: string | null; type?: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
    [key: string]: unknown
}

type ProcessOption = {
    id: string
    number: string | null
    folderName: string | null
    type?: string | null
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
    users: { id: string; name: string | null; email: string | null }[]
    clients: { id: string; name: string }[]
}

const SORT_OPTIONS: { value: KanbanSortMode; label: string }[] = [
    { value: "manual", label: "Manual" },
    { value: "fatalDateAsc", label: "Prazo fatal mais proximo" },
    { value: "fatalDateDesc", label: "Prazo fatal mais distante" },
    { value: "titleAsc", label: "Titulo A-Z" },
    { value: "clientAsc", label: "Cliente A-Z" },
    { value: "responsibleAsc", label: "Responsavel A-Z" },
    { value: "createdDesc", label: "Mais recentes" },
]

const RESPONSIBLE_FILTER_ALL = "__all__"

export function KanbanWrapper({
    initialTasks,
    initialColumns,
    pipelines,
    activePipelineId,
    processes,
    users,
    clients,
}: Props) {
    const { openModal: openEsteiraModal } = useEsteiraModal()
    const queryClient = useQueryClient()

    const [selectedPipelineId, setSelectedPipelineId] = useState(activePipelineId)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
    const [selectedPhase, setSelectedPhase] = useState<string | undefined>(undefined)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedProcessId, setSelectedProcessId] = useState("")
    const [selectedClientId, setSelectedClientId] = useState("")
    const [selectedResponsibleId, setSelectedResponsibleId] = useState("")
    const [selectedPracticeArea, setSelectedPracticeArea] = useState("ALL")
    const [sortMode, setSortMode] = useState<KanbanSortMode>("manual")
    const [isSwitchingPipeline, startPipelineTransition] = useTransition()

    const shouldInjectInitialData = selectedPipelineId === activePipelineId

    const {
        tasks,
        moveTask,
        deleteTask,
        toggleTaskCompleted,
        addTask,
        refetch: refetchTasks,
    } = useKanbanTasks(
        selectedPipelineId,
        shouldInjectInitialData ? initialTasks : []
    )

    const {
        columns,
        reorderColumns,
        addColumn,
        deleteColumn,
        renameColumn,
    } = useKanbanColumns(
        selectedPipelineId,
        shouldInjectInitialData ? initialColumns : []
    )

    const handlePipelineSwitch = useCallback((pipelineId: string) => {
        startPipelineTransition(() => {
            setSelectedPipelineId(pipelineId)
            window.history.replaceState(null, "", `/kanban?pipeline=${pipelineId}`)
        })
    }, [])

    const prefetchPipeline = useCallback((pipelineId: string) => {
        void queryClient.prefetchQuery({
            queryKey: ["kanban-tasks", pipelineId],
            queryFn: () => fetchBoardAction(pipelineId),
            staleTime: 1000 * 30,
        })

        void queryClient.prefetchQuery({
            queryKey: ["kanban-columns", pipelineId],
            queryFn: () => getColumnsByPipeline(pipelineId),
            staleTime: 1000 * 30,
        })
    }, [queryClient])

    const handleTaskCreated = useCallback((task: any) => {
        if (task) {
            addTask(task)
        } else {
            refetchTasks()
        }
    }, [addTask, refetchTasks])

    const handleOpenAddTask = useCallback((phase: string) => {
        setSelectedPhase(phase)
        setIsTaskModalOpen(true)
    }, [])

    const handleColumnsReordered = useCallback((newOrder: KanbanColumn[]) => {
        reorderColumns(newOrder)
    }, [reorderColumns])

    const handleAddColumn = useCallback((name: string) => {
        addColumn({ name, color: "#64748b" })
    }, [addColumn])

    const handleDeleteColumn = useCallback((columnId: string, targetColumnId?: string) => {
        deleteColumn({ columnId, targetColumnId })
    }, [deleteColumn])

    const handleRenameColumn = useCallback((columnId: string, name: string, color: string) => {
        renameColumn({ columnId, name, color })
    }, [renameColumn])

    const handleQuickAssignResponsible = useCallback(async (taskId: string, responsibleLawyerId: string | null) => {
        await updateTaskAction(taskId, {
            responsibleLawyerId,
        })
        startTransition(() => {
            void refetchTasks()
        })
    }, [refetchTasks])

    const handleTaskChanged = useCallback(async () => {
        await refetchTasks()
    }, [refetchTasks])

    const filteredTasks = useMemo<ExtendedTask[]>(() => {
        const searched = tasks.filter((task) => {
            if (!matchesKanbanSearch(task, searchQuery)) return false
            if (selectedProcessId && task.process?.id !== selectedProcessId) return false
            if (selectedClientId && task.client?.id !== selectedClientId) return false
            if (selectedResponsibleId && task.responsibleLawyer?.id !== selectedResponsibleId) return false
            if (selectedPracticeArea !== "ALL" && task.practiceArea !== selectedPracticeArea) return false
            return true
        })

        return sortKanbanTasks(searched, sortMode) as ExtendedTask[]
    }, [tasks, searchQuery, selectedProcessId, selectedClientId, selectedResponsibleId, selectedPracticeArea, sortMode])

    const processOptions = useMemo(() => processes.map((process) => ({
        value: process.id,
        label: process.folderName ? `${process.folderName} (${process.number || "S/N"})` : `Processo: ${process.number || "S/N"}`,
        search: `${process.folderName || ""} ${process.number || ""}`.trim(),
    })), [processes])

    const clientOptions = useMemo(() => clients.map((client) => ({
        value: client.id,
        label: client.name,
        search: client.name,
    })), [clients])

    const selectedResponsibleLabel = useMemo(() => {
        if (!selectedResponsibleId) return "Todos os colaboradores"

        const selectedUser = users.find((user) => user.id === selectedResponsibleId)
        return selectedUser?.name || selectedUser?.email || "Colaborador"
    }, [selectedResponsibleId, users])

    return (
        <>
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false)
                    setSelectedPhase(undefined)
                }}
                processes={processes}
                columns={columns.map((column) => ({ id: column.id, name: column.name }))}
                clients={clients}
                onTaskCreated={handleTaskCreated}
                defaultPhase={selectedPhase}
            />

            <ColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                pipelineId={selectedPipelineId || ""}
            />

            <div className="flex h-full flex-col">
                <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-0.5">
                            {pipelines.map((pipeline) => (
                                <div
                                    role="button"
                                    key={pipeline.id}
                                    onClick={() => handlePipelineSwitch(pipeline.id)}
                                    onMouseEnter={() => prefetchPipeline(pipeline.id)}
                                    onFocus={() => prefetchPipeline(pipeline.id)}
                                    className={cn(
                                        "flex min-w-fit cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
                                        selectedPipelineId === pipeline.id
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200/50"
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                    )}
                                >
                                    {pipeline.name}
                                    <div onClick={(event) => event.stopPropagation()} className="ml-1">
                                        <PipelineActionsMenu
                                            pipelineId={pipeline.id}
                                            pipelineName={pipeline.name}
                                            isActive={selectedPipelineId === pipeline.id}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={openEsteiraModal}
                                className="flex min-w-fit items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                                title="Criar nova esteira"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Nova Esteira</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200/50 transition-colors hover:bg-blue-700"
                        >
                            <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Nova Tarefa
                            </span>
                        </button>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1.1fr)_minmax(200px,1fr)_minmax(200px,1fr)_minmax(200px,1fr)_180px_220px]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Filtrar por tarefa, processo, cliente ou palavra..."
                                className="pl-9"
                            />
                        </div>

                        <Combobox
                            value={selectedProcessId}
                            onValueChange={setSelectedProcessId}
                            options={processOptions}
                            placeholder="Filtrar por processo"
                            searchPlaceholder="Buscar processo..."
                            showAddCustom={false}
                        />

                        <Combobox
                            value={selectedClientId}
                            onValueChange={setSelectedClientId}
                            options={clientOptions}
                            placeholder="Filtrar por cliente"
                            searchPlaceholder="Buscar cliente..."
                            showAddCustom={false}
                        />

                        <Select
                            value={selectedResponsibleId || RESPONSIBLE_FILTER_ALL}
                            onValueChange={(value) => setSelectedResponsibleId(value === RESPONSIBLE_FILTER_ALL ? "" : value)}
                        >
                            <SelectTrigger>
                                <span className="truncate text-left">
                                    {selectedResponsibleLabel}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={RESPONSIBLE_FILTER_ALL}>Todos os colaboradores</SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || user.email || "Sem nome"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedPracticeArea} onValueChange={setSelectedPracticeArea}>
                            <SelectTrigger>
                                <span className="truncate text-left">
                                    {KANBAN_PRACTICE_AREA_OPTIONS.find((option) => option.value === selectedPracticeArea)?.label || "Area"}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {KANBAN_PRACTICE_AREA_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sortMode} onValueChange={(value) => setSortMode(value as KanbanSortMode)}>
                            <SelectTrigger>
                                <span className="truncate text-left">
                                    {SORT_OPTIONS.find((option) => option.value === sortMode)?.label || "Ordenar fila"}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span>
                                Exibindo <strong className="text-slate-700">{filteredTasks.length}</strong> de <strong className="text-slate-700">{tasks.length}</strong> cards
                            </span>
                            {isSwitchingPipeline ? (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                    Trocando esteira...
                                </span>
                            ) : null}
                        </div>

                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
                    {pipelines.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="space-y-4 text-center">
                                <p className="text-lg text-slate-500">Nenhuma esteira encontrada</p>
                                <button
                                    onClick={openEsteiraModal}
                                    className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    Criar Primeira Esteira
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex-1 overflow-hidden">
                            <KanbanBoard
                                tasks={filteredTasks}
                                allTasks={tasks as ExtendedTask[]}
                                allColumns={columns}
                                columns={columns}
                                pipelineId={selectedPipelineId || ""}
                                onOpenAddTask={handleOpenAddTask}
                                users={users}
                                clients={clients}
                                processes={processes}
                                onMoveTask={moveTask}
                                onDeleteTask={deleteTask}
                                onToggleTaskCompleted={toggleTaskCompleted}
                                onQuickAssignResponsible={handleQuickAssignResponsible}
                                onTaskChanged={handleTaskChanged}
                                onColumnsReordered={handleColumnsReordered}
                                onAddColumn={handleAddColumn}
                                onDeleteColumn={handleDeleteColumn}
                                onRenameColumn={handleRenameColumn}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
