'use client'

import { type ComponentProps, type HTMLAttributes, useMemo, useState } from "react"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    TouchSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DropAnimation,
    pointerWithin,
    closestCenter,
    CollisionDetection,
    PointerSensor,
    MeasuringStrategy,
} from "@dnd-kit/core"
import {
    SortableContext,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Tag, KanbanColumn, Client } from "@prisma/client"
import {
    Calendar,
    Check,
    CheckCircle2,
    FileText,
    GripVertical,
    LayoutDashboard,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    UserRound,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskDetailModal } from "./task-detail-modal"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeleteDialog } from "./delete-dialog"
import { useDraggableScroll } from "./hooks/use-draggable-scroll"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatKanbanDate, isKanbanTaskCompleted, normalizeKanbanDate } from "@/lib/utils/kanban"

const zoomSafeCollision: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return closestCenter(args)
}

function getUserInitials(name: string): string {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getUserColor(name: string): string {
    const colors = [
        "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
        "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
        "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
        "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
        "bg-rose-500",
    ]

    let hash = 0
    for (let index = 0; index < name.length; index += 1) {
        hash = name.charCodeAt(index) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}

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

type BoardProps = {
    tasks: ExtendedTask[]
    allTasks: ExtendedTask[]
    columns: KanbanColumn[]
    allColumns: KanbanColumn[]
    pipelineId: string
    onOpenAddTask?: (phase: string) => void
    users: { id: string; name: string | null; email: string | null }[]
    clients: { id: string; name: string }[]
    processes: { id: string; number: string | null; folderName: string | null; type?: string | null }[]
    onMoveTask: (cardId: string, targetColumnId: string, targetPosition: number) => void
    onDeleteTask: (taskId: string) => void
    onToggleTaskCompleted: (taskId: string, completed: boolean) => void
    onColumnsReordered: (columns: KanbanColumn[]) => void
    onAddColumn: (name: string) => void
    onDeleteColumn: (columnId: string, targetColumnId?: string) => void
    onRenameColumn: (columnId: string, name: string, color: string) => void
}

type DragData = {
    type: "column" | "card"
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.5",
            },
        },
    }),
}

export function KanbanBoard({
    tasks,
    allTasks,
    columns,
    allColumns,
    onOpenAddTask,
    users,
    clients,
    processes,
    onMoveTask,
    onDeleteTask,
    onToggleTaskCompleted,
    onColumnsReordered,
    onAddColumn,
    onDeleteColumn,
    onRenameColumn,
}: BoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeType, setActiveType] = useState<"column" | "card" | null>(null)
    const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null)
    const [columnToDelete, setColumnToDelete] = useState<{ id: string; name: string; count: number } | null>(null)
    const [targetColumnId, setTargetColumnId] = useState<string>("")
    const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        })
    )

    const { ref: scrollContainerRef } = useDraggableScroll()

    const deleteTargets = useMemo(
        () => allColumns.filter((column) => columnToDelete && column.id !== columnToDelete.id),
        [allColumns, columnToDelete]
    )

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        setActiveId(active.id as string)
        setActiveType(columns.some((column) => column.id === active.id) ? "column" : "card")
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)
        setActiveType(null)

        if (!over) return

        if (activeType === "column") {
            if (active.id === over.id) return

            const oldIndex = columns.findIndex((column) => column.id === active.id)
            let newIndex = columns.findIndex((column) => column.id === over.id)

            if (newIndex === -1) {
                const overCard = tasks.find((task) => task.id === over.id)
                if (overCard) {
                    newIndex = columns.findIndex((column) => column.id === overCard.columnId)
                }
            }

            if (oldIndex !== -1 && newIndex !== -1) {
                onColumnsReordered(arrayMove(columns, oldIndex, newIndex))
            }

            return
        }

        if (activeType !== "card") return

        const cardId = active.id as string
        const activeCard = allTasks.find((task) => task.id === cardId)
        if (!activeCard) return

        let nextColumnId: string | null = null
        let nextPosition = 0

        const targetColumn = columns.find((column) => column.id === over.id)
        if (targetColumn) {
            nextColumnId = targetColumn.id
            nextPosition = allTasks.filter((task) => task.columnId === targetColumn.id && task.id !== cardId).length
        } else {
            const overCard = allTasks.find((task) => task.id === over.id)
            if (overCard) {
                nextColumnId = overCard.columnId
                const orderedColumnTasks = allTasks
                    .filter((task) => task.columnId === nextColumnId && task.id !== cardId)
                    .sort((first, second) => first.position - second.position)
                const overIndex = orderedColumnTasks.findIndex((task) => task.id === overCard.id)
                nextPosition = overIndex === -1 ? orderedColumnTasks.length : overIndex
            }
        }

        if (nextColumnId) {
            onMoveTask(cardId, nextColumnId, nextPosition)
        }
    }

    function openDeleteColumnDialog(columnId: string, name: string) {
        const count = allTasks.filter((task) => task.columnId === columnId).length
        const firstTarget = allColumns.find((column) => column.id !== columnId)
        setColumnToDelete({ id: columnId, name, count })
        setTargetColumnId(firstTarget?.id || "")
    }

    function confirmDeleteColumn() {
        if (!columnToDelete) return
        if (columnToDelete.count > 0 && !targetColumnId) return

        setIsDeleting(true)
        try {
            onDeleteColumn(columnToDelete.id, columnToDelete.count > 0 ? targetColumnId : undefined)
        } finally {
            setIsDeleting(false)
            setColumnToDelete(null)
            setTargetColumnId("")
        }
    }

    function confirmDeleteTask() {
        if (!taskToDelete) return

        setIsDeleting(true)
        try {
            onDeleteTask(taskToDelete.id)
        } finally {
            setIsDeleting(false)
            setTaskToDelete(null)
        }
    }

    const activeColumn = activeType === "column" && activeId
        ? columns.find((column) => column.id === activeId) ?? null
        : null
    const activeTask = activeType === "card" && activeId
        ? allTasks.find((task) => task.id === activeId) ?? null
        : null

    if (columns.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50/50 p-8 animate-in fade-in duration-500">
                <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mb-6 rounded-2xl bg-blue-50 p-4 ring-8 ring-blue-50/50">
                        <LayoutDashboard className="h-10 w-10 text-blue-600" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-slate-900">Sua esteira esta vazia</h2>
                    <p className="mb-8 max-w-xs text-sm leading-relaxed text-slate-500">
                        Crie sua primeira fila para organizar o fluxo de trabalho desta esteira.
                    </p>
                    <AddListButton onAddList={onAddColumn} />
                </div>
            </div>
        )
    }

    return (
        <>
            <DndContext
                id="kanban-dnd-context"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                collisionDetection={zoomSafeCollision}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
            >
                <div className="flex h-full flex-1 flex-col overflow-hidden bg-slate-100">
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 custom-scrollbar"
                    >
                        <div className="flex h-full gap-1.5 pt-4">
                            <SortableContext
                                items={columns.map((column) => column.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                {columns.map((column) => (
                                    <SortableColumn
                                        key={column.id}
                                        column={column}
                                        tasks={tasks.filter((task) => task.columnId === column.id)}
                                        onCardClick={setSelectedTask}
                                        onOpenAddTask={onOpenAddTask}
                                        onColumnRenamed={(columnId, name) => onRenameColumn(columnId, name, column.color)}
                                        onRequestDeleteColumn={openDeleteColumnDialog}
                                        onRequestDeleteTask={(id, title) => setTaskToDelete({ id, title })}
                                        onToggleTaskCompleted={onToggleTaskCompleted}
                                    />
                                ))}
                            </SortableContext>

                            <AddListButton onAddList={onAddColumn} />
                        </div>
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeColumn ? (
                        <ColumnOverlay column={activeColumn} tasks={tasks.filter((task) => task.columnId === activeColumn.id)} />
                    ) : activeTask ? (
                        <CardOverlay task={activeTask} />
                    ) : null}
                </DragOverlay>

                <TaskDetailModal
                    task={selectedTask as ComponentProps<typeof TaskDetailModal>["task"]}
                    isOpen={selectedTask !== null}
                    onClose={() => setSelectedTask(null)}
                    users={users}
                    clients={clients}
                    processes={processes}
                />
            </DndContext>

            <AlertDialog
                open={!!columnToDelete}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setColumnToDelete(null)
                        setTargetColumnId("")
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir fila?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <span className="block">
                                A fila <strong>{columnToDelete?.name}</strong> sera excluida permanentemente.
                            </span>
                            {columnToDelete?.count ? (
                                <span className="block">
                                    Ela possui <strong>{columnToDelete.count} card(s)</strong>. Escolha abaixo para onde esses cards devem ir antes da exclusao.
                                </span>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {columnToDelete?.count ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Mover cards para</p>
                            <Select value={targetColumnId} onValueChange={setTargetColumnId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a fila de destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deleteTargets.map((column) => (
                                        <SelectItem key={column.id} value={column.id}>
                                            {column.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault()
                                confirmDeleteColumn()
                            }}
                            disabled={isDeleting || Boolean(columnToDelete?.count && !targetColumnId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Excluindo..." : "Excluir fila"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteDialog
                isOpen={!!taskToDelete}
                title="Excluir tarefa?"
                description={
                    <span>
                        Voce esta prestes a excluir <strong>{taskToDelete?.title}</strong>.
                        <br /><br />
                        Esta acao e irreversivel e removera todos os dados associados, incluindo checklists e comentarios.
                    </span>
                }
                isDeleting={isDeleting}
                onClose={() => setTaskToDelete(null)}
                onConfirm={confirmDeleteTask}
            />
        </>
    )
}

function SortableColumn({
    column,
    tasks,
    onCardClick,
    onOpenAddTask,
    onColumnRenamed,
    onRequestDeleteColumn,
    onRequestDeleteTask,
    onToggleTaskCompleted,
}: {
    column: KanbanColumn
    tasks: ExtendedTask[]
    onCardClick: (task: ExtendedTask) => void
    onOpenAddTask?: (phase: string) => void
    onColumnRenamed?: (columnId: string, newName: string) => void
    onRequestDeleteColumn?: (columnId: string, name: string) => void
    onRequestDeleteTask?: (taskId: string, title: string) => void
    onToggleTaskCompleted: (taskId: string, completed: boolean) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: { type: "column" } as DragData,
    })

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
            }}
            className="flex w-[280px] flex-shrink-0 flex-col"
        >
            <Column
                id={column.id}
                title={column.name}
                accent={column.color}
                tasks={tasks}
                dragHandleProps={{ ...attributes, ...listeners }}
                onCardClick={onCardClick}
                onOpenAddTask={onOpenAddTask}
                onColumnRenamed={onColumnRenamed}
                onRequestDeleteColumn={onRequestDeleteColumn}
                onRequestDeleteTask={onRequestDeleteTask}
                onToggleTaskCompleted={onToggleTaskCompleted}
            />
        </div>
    )
}

function Column({
    id,
    title,
    accent,
    tasks,
    dragHandleProps,
    onCardClick,
    onOpenAddTask,
    onColumnRenamed,
    onRequestDeleteColumn,
    onRequestDeleteTask,
    onToggleTaskCompleted,
}: {
    id: string
    title: string
    accent: string
    tasks: ExtendedTask[]
    dragHandleProps?: HTMLAttributes<HTMLDivElement>
    onCardClick?: (task: ExtendedTask) => void
    onOpenAddTask?: (phase: string) => void
    onColumnRenamed?: (columnId: string, newName: string) => void
    onRequestDeleteColumn?: (columnId: string, name: string) => void
    onRequestDeleteTask?: (taskId: string, title: string) => void
    onToggleTaskCompleted: (taskId: string, completed: boolean) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(title)
    const [isSaving, setIsSaving] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    function handleRename() {
        if (!editName.trim() || editName === title) {
            setEditName(title)
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            onColumnRenamed?.(id, editName.trim())
            setIsEditing(false)
            setMenuOpen(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex max-h-full w-[280px] flex-shrink-0 flex-col rounded-xl border border-slate-200/60 bg-[#ebecf0] shadow-sm transition-all">
            <div
                className="flex items-center justify-between p-3 pl-4 cursor-grab active:cursor-grabbing"
                {...dragHandleProps}
                data-no-drag-scroll="true"
            >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent || "#64748b" }} />
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault()
                                    handleRename()
                                }
                                if (event.key === "Escape") {
                                    setEditName(title)
                                    setIsEditing(false)
                                }
                            }}
                            autoFocus
                            disabled={isSaving}
                            className="w-full rounded border-2 border-blue-500 px-2 py-1 text-sm font-semibold focus:outline-none"
                        />
                    ) : (
                        <h3 className="truncate text-sm font-semibold text-slate-700">
                            {title}
                        </h3>
                    )}
                </div>

                <div className="relative flex items-center gap-2">
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-500">
                        {tasks.length}
                    </span>

                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation()
                            setMenuOpen((current) => !current)
                        }}
                        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {menuOpen ? (
                        <div
                            className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(true)
                                    setMenuOpen(false)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <Pencil className="h-4 w-4" />
                                Renomear fila
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onRequestDeleteColumn?.(id, title)
                                    setMenuOpen(false)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Excluir fila
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
                <div className="flex flex-col gap-2">
                    <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <DraggableCard
                                key={task.id}
                                task={task}
                                onCardClick={onCardClick}
                                onRequestDelete={onRequestDeleteTask}
                                onToggleCompleted={onToggleTaskCompleted}
                            />
                        ))}
                    </SortableContext>
                </div>
            </div>

            <div className="p-2 pt-0">
                <button
                    type="button"
                    onClick={() => onOpenAddTask?.(title)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-200/50 hover:text-slate-800"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar card
                </button>
            </div>
        </div>
    )
}

function AddListButton({ onAddList }: { onAddList: (name: string) => void | Promise<void> }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState("")

    async function handleSubmit(event?: React.FormEvent) {
        event?.preventDefault()
        if (!name.trim()) {
            setIsEditing(false)
            return
        }

        await onAddList(name)
        setName("")
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="h-fit w-[280px] flex-shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        placeholder="Titulo da fila..."
                        className="mb-2 w-full rounded-md border-2 border-blue-500 px-3 py-2 text-sm focus:outline-none"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") setIsEditing(false)
                        }}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            Adicionar fila
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="p-1.5 text-slate-500 hover:text-slate-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div
            className="flex h-12 w-[280px] flex-shrink-0 cursor-pointer items-center rounded-xl border border-transparent bg-white/50 px-4 font-medium text-slate-700 backdrop-blur-sm transition-colors hover:border-slate-200 hover:bg-white/80 hover:text-slate-900"
            onClick={() => setIsEditing(true)}
        >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar outra fila
        </div>
    )
}

function DraggableCard({
    task,
    onCardClick,
    onRequestDelete,
    onToggleCompleted,
}: {
    task: ExtendedTask
    onCardClick?: (task: ExtendedTask) => void
    onRequestDelete?: (taskId: string, title: string) => void
    onToggleCompleted: (taskId: string, completed: boolean) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: { type: "card" } as DragData,
    })

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0 : 1,
            }}
            {...listeners}
            {...attributes}
            className="touch-none cursor-grab active:cursor-grabbing"
            data-no-drag-scroll="true"
        >
            <TaskCardItem
                task={task}
                onCardClick={onCardClick}
                onRequestDelete={onRequestDelete}
                onToggleCompleted={onToggleCompleted}
            />
        </div>
    )
}

function TaskCardItem({
    task,
    isOverlay,
    onRequestDelete,
    onCardClick,
    onToggleCompleted,
}: {
    task: ExtendedTask
    isOverlay?: boolean
    onRequestDelete?: (id: string, title: string) => void
    onCardClick?: (task: ExtendedTask) => void
    onToggleCompleted?: (taskId: string, completed: boolean) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)

    const isCompleted = isKanbanTaskCompleted(task)
    const today = normalizeKanbanDate(new Date())
    const fatalDate = normalizeKanbanDate(task.fatalDate)
    const isLate = Boolean(fatalDate && today && fatalDate.getTime() < today.getTime() && !isCompleted)
    const isDueSoon = Boolean(
        fatalDate &&
        today &&
        fatalDate.getTime() >= today.getTime() &&
        fatalDate.getTime() - today.getTime() <= 1000 * 60 * 60 * 24 * 2 &&
        !isCompleted
    )

    let borderColor = "border-l-sky-400"
    let backgroundColor = "bg-white"

    if (isCompleted) {
        borderColor = "border-l-emerald-500"
        backgroundColor = "bg-emerald-50"
    } else if (isLate) {
        borderColor = "border-l-red-500"
    } else if (isDueSoon) {
        borderColor = "border-l-yellow-400"
    }

    return (
        <div
            className={cn(
                "group relative rounded-xl border border-l-4 p-4 shadow-sm transition-all duration-200 hover:shadow-lg",
                borderColor,
                backgroundColor,
                isOverlay && "rotate-2 scale-105 shadow-2xl",
                !isOverlay && onCardClick && "cursor-pointer hover:scale-[1.01] hover:border-slate-300"
            )}
            onClick={isOverlay ? undefined : (event) => {
                if ((event.target as HTMLElement).closest("button")) return
                onCardClick?.(task)
            }}
        >
            <div className="mb-3 flex items-start justify-between gap-2 pr-14">
                <h4 className={cn(
                    "line-clamp-2 text-sm font-semibold leading-snug text-slate-800",
                    isCompleted && "text-emerald-900"
                )}>
                    {task.title}
                </h4>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                {task.process ? (
                    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 px-2.5 py-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        <span className="truncate text-xs font-medium text-slate-700">
                            {task.process.folderName || task.process.number || "Processo vinculado"}
                        </span>
                    </div>
                ) : null}

                {task.client ? (
                    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate text-xs font-medium text-emerald-900">
                            {task.client.name}
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                    {task.fatalDate ? (
                        <div
                            className={cn(
                                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                                isCompleted
                                    ? "bg-emerald-100 text-emerald-700"
                                    : isLate
                                        ? "bg-red-50 text-red-600"
                                        : isDueSoon
                                            ? "bg-yellow-50 text-yellow-700"
                                            : "bg-slate-50 text-slate-500"
                            )}
                        >
                            <Calendar className="h-3 w-3" />
                            <span className="font-medium">
                                {formatKanbanDate(task.fatalDate, { day: "2-digit", month: "2-digit" })}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs italic text-slate-400">Sem prazo fatal</span>
                    )}
                </div>

                {task.responsibleLawyer?.name ? (
                    <div
                        className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-1 ring-white",
                            getUserColor(task.responsibleLawyer.name)
                        )}
                        title={task.responsibleLawyer.name}
                    >
                        {getUserInitials(task.responsibleLawyer.name)}
                    </div>
                ) : (
                    <div
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-100 text-[11px] font-medium text-slate-400"
                        title="Sem responsavel"
                    >
                        ?
                    </div>
                )}
            </div>

            {!isOverlay ? (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation()
                            onToggleCompleted?.(task.id, !isCompleted)
                        }}
                        className={cn(
                            "rounded-md p-1.5 transition",
                            isCompleted
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        )}
                        title={isCompleted ? "Desmarcar concluido" : "Marcar como concluido"}
                    >
                        {isCompleted ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation()
                            setMenuOpen((current) => !current)
                        }}
                        className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {menuOpen ? (
                        <div
                            className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false)
                                    onRequestDelete?.(task.id, task.title)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

function CardOverlay({ task }: { task: ExtendedTask }) {
    return <TaskCardItem task={task} isOverlay />
}

function ColumnOverlay({ column, tasks }: { column: KanbanColumn; tasks: ExtendedTask[] }) {
    return (
        <div className="flex max-h-[600px] w-80 flex-col rounded-xl border-2 border-blue-400 bg-white opacity-90 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="text-sm font-bold text-slate-800">{column.name}</h3>
                </div>
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {tasks.length}
                </span>
            </div>

            <div className="flex flex-col gap-2 overflow-hidden p-3">
                {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="opacity-60">
                        <TaskCardItem task={task} />
                    </div>
                ))}
                {tasks.length > 3 ? (
                    <div className="text-center text-xs text-slate-400">
                        +{tasks.length - 3} mais
                    </div>
                ) : null}
            </div>
        </div>
    )
}
