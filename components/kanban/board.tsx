'use client'

import { useState, useEffect } from "react"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragOverEvent,
    closestCorners,
    PointerSensor,
    MeasuringStrategy
} from "@dnd-kit/core"
import {
    SortableContext,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    arrayMove,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Tag, KanbanColumn, Client } from "@prisma/client"
import { moveCardAction, deleteTaskAction, quickCreateTaskAction } from "@/lib/actions/kanban-actions"
import { reorderColumnsAction, updateColumnAction, createColumnAction, deleteColumnAction } from "@/lib/actions/column-actions"
import { AlertCircle, FileText, MoreHorizontal, Trash2, GripVertical, Calendar, Plus, Pencil, Check, X, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskDetailModal } from "./task-detail-modal"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { DeleteDialog } from "./delete-dialog"
import { useDraggableScroll } from "./hooks/use-draggable-scroll"


// Helper functions for User UI
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
        "bg-rose-500"
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
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

type BoardProps = {
    tasks: ExtendedTask[]
    columns: KanbanColumn[]
    pipelineId: string
    onOpenAddTask?: (phase: string) => void
    users: { id: string; name: string | null; email: string | null }[]
    clients: { id: string; name: string }[]
    processes: { id: string; number: string; folderName: string | null }[]
    onMoveTask: (cardId: string, targetColumnId: string, targetPosition: number) => void
    onDeleteTask: (taskId: string) => void
    onColumnAdded?: (column: KanbanColumn) => void
    onColumnsChanged?: (columns: KanbanColumn[]) => void
}

type DragData = {
    type: 'column' | 'card'
    columnId?: string
    cardId?: string
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export function KanbanBoard({
    tasks,
    columns: initialColumns,
    pipelineId,
    onOpenAddTask,
    users,
    clients,
    processes,
    onMoveTask,
    onDeleteTask,
    onColumnAdded,
    onColumnsChanged
}: BoardProps) {
    // REMOVED: const [tasks, setTasks] = useState(initialTasks)
    // REMOVED: useEffect sync

    // Kept for Column reordering (for now, as it wasn't prioritized in "Split State" audit, 
    // but ideally should be lifted too. User said "KanbanWrapper and ALL components below it".
    // I will leave columns local for this specific step to minimize blast radius, 
    // focusing on TASKS as the primary data integrity risk).
    const [columns, setColumns] = useState(initialColumns)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeType, setActiveType] = useState<'column' | 'card' | null>(null)
    const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null)

    // Delete States
    const [columnToDelete, setColumnToDelete] = useState<{ id: string, name: string } | null>(null)
    const [columnWarning, setColumnWarning] = useState<{ id: string, name: string, count: number } | null>(null)
    const [taskToDelete, setTaskToDelete] = useState<{ id: string, title: string } | null>(null)
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
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        setActiveId(active.id as string)

        // Determine if dragging a column or a card
        const isColumn = columns.some(col => col.id === active.id)
        setActiveType(isColumn ? 'column' : 'card')
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)
        setActiveType(null)

        if (!over) return

        // Handle Column Reordering
        if (activeType === 'column') {
            if (active.id !== over.id) {
                const oldIndex = columns.findIndex(col => col.id === active.id)
                let newIndex = columns.findIndex(col => col.id === over.id)

                // FIX: If over.id is NOT a column, check if it's a card and find its column
                if (newIndex === -1) {
                    const overCard = tasks.find(t => t.id === over.id)
                    if (overCard && overCard.columnId) {
                        newIndex = columns.findIndex(col => col.id === overCard.columnId)
                    }
                }

                if (newIndex !== -1) {
                    const reorderedColumns = arrayMove(columns, oldIndex, newIndex)
                    setColumns(reorderedColumns)
                    onColumnsChanged?.(reorderedColumns)

                    // Persist to server — scoped to this pipeline
                    await reorderColumnsAction(pipelineId, reorderedColumns.map(col => col.id))
                }
            }
            return
        }

        // Handle Card Movement
        if (activeType === 'card') {
            const cardId = active.id as string
            const activeCard = tasks.find(t => t.id === cardId)
            if (!activeCard) return

            let targetColumnId: string | null = null
            let targetPosition: number = 0

            // Check if dropped directly on a column (empty column or column header)
            const targetColumn = columns.find(col => col.id === over.id)
            if (targetColumn) {
                targetColumnId = targetColumn.id
                // Dropped on column itself = append at end
                const columnTasks = tasks.filter(t => t.columnId === targetColumnId && t.id !== cardId)
                targetPosition = columnTasks.length
            } else {
                // Dropped on another card - find that card's column + compute position
                const overCard = tasks.find(t => t.id === over.id)
                if (overCard) {
                    targetColumnId = overCard.columnId
                    const columnTasks = tasks
                        .filter(t => t.columnId === targetColumnId && t.id !== cardId)
                        .sort((a, b) => a.position - b.position)

                    // Find the position of the card we dropped onto
                    const overIndex = columnTasks.findIndex(t => t.id === overCard.id)
                    targetPosition = overIndex !== -1 ? overIndex : columnTasks.length
                }
            }

            if (targetColumnId) {
                onMoveTask(cardId, targetColumnId, targetPosition)
            }
        }
    }

    const activeColumn = activeType === 'column' && activeId
        ? columns.find(col => col.id === activeId)
        : null
    const activeTask = activeType === 'card' && activeId
        ? tasks.find(t => t.id === activeId)
        : null

    const confirmDeleteColumn = async () => {
        if (!columnToDelete) return

        setIsDeleting(true)
        try {
            // Optimistic Update
            setColumns(prev => prev.filter(c => c.id !== columnToDelete.id))

            await deleteColumnAction(columnToDelete.id)
        } catch (error) {
            console.error(error)
            // Rollback could be added here if needed, but for columns it's rare to fail
            // Ideally re-fetch or rollback state
            setColumns(initialColumns) // Simple rollback
            alert("Erro ao excluir lista")
        } finally {
            setIsDeleting(false)
            setColumnToDelete(null)
        }
    }

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return

        // Delegate to Parent / Hook
        // Note: The UI for the dialog stays here, but the Confirm Action calls the prop
        setIsDeleting(true)
        try {
            await onDeleteTask(taskToDelete.id)
            // Dialog close is handled by finally
        } catch (error) {
            console.error(error)
            // The hook handles alerts, but we should ensure UI state resets
        } finally {
            setIsDeleting(false)
            setTaskToDelete(null)
        }
    }

    const isDialogOpen = !!columnToDelete || !!taskToDelete || !!columnWarning
    const { ref: scrollContainerRef } = useDraggableScroll()

    // EMPTY STATE
    if (columns.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-8 animate-in fade-in duration-500">
                <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                    <div className="p-4 bg-blue-50 rounded-2xl mb-6 ring-8 ring-blue-50/50">
                        <LayoutDashboard className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Sua esteira está vazia</h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed max-w-xs mx-auto">
                        Crie sua primeira lista para organizar o fluxo de trabalho desta esteira.
                    </p>

                    <AddListButton onAddList={async (name) => {
                        const result = await createColumnAction(pipelineId, name, '#64748b')
                        if (result.success && result.column) {
                            setColumns(prev => [...prev, result.column])
                            if (onColumnAdded) onColumnAdded(result.column)
                        }
                    }} />
                </div>
            </div>
        )
    }

    // ... Render (Keep rest same, but now using `tasks` prop) ...
    return (
        <>
            <DndContext
                id="kanban-dnd-context"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                collisionDetection={closestCorners}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
            >
                <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
                    {/* Board Scroll Container - Horizontal Only + Drag to Pan */}
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 custom-scrollbar"
                    >
                        <div className="flex h-full gap-1.5 pt-4">
                            <SortableContext
                                items={columns.map(col => col.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                {columns.map((col) => (
                                    <SortableColumn
                                        key={col.id}
                                        column={col}
                                        tasks={tasks.filter(t => t.columnId === col.id)}
                                        onCardClick={setSelectedTask}
                                        onTaskCreated={() => { }}
                                        onOpenAddTask={onOpenAddTask}
                                        onColumnRenamed={(id: string, name: string) => {
                                            setColumns(prev => prev.map(c => c.id === id ? { ...c, name } : c))
                                        }}
                                        onRequestDeleteColumn={(id, name) => {
                                            const count = tasks.filter(t => t.columnId === id).length
                                            if (count > 0) {
                                                setColumnWarning({ id, name, count })
                                            } else {
                                                setColumnToDelete({ id, name })
                                            }
                                        }}
                                        onRequestDeleteTask={(id, title) => setTaskToDelete({ id, title })}
                                    />
                                ))}
                            </SortableContext>
                            <AddListButton onAddList={async (name) => {
                                const result = await createColumnAction(pipelineId, name, '#64748b')
                                if (result.success && result.column) {
                                    setColumns(prev => [...prev, result.column])
                                    if (onColumnAdded) onColumnAdded(result.column)
                                }
                            }} />
                        </div>
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeColumn ? (
                        <ColumnOverlay
                            column={activeColumn}
                            tasks={tasks.filter(t => t.columnId === activeColumn.id)}
                        />
                    ) : activeTask ? (
                        <CardOverlay task={activeTask} />
                    ) : null}
                </DragOverlay>

                <TaskDetailModal
                    task={selectedTask as any}
                    isOpen={selectedTask !== null}
                    onClose={() => setSelectedTask(null)}
                    users={users}
                    clients={clients}
                    processes={processes}
                />
            </DndContext>

            {/* List Deletion Dialog - SAFER */}
            <AlertDialog open={!!columnToDelete} onOpenChange={(open) => !open && !isDeleting && setColumnToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A lista <strong>{columnToDelete?.name}</strong> será excluída permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteColumn()
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Task Deletion Dialog - PREMIUM */}
            <DeleteDialog
                isOpen={!!taskToDelete}
                title="Excluir tarefa?"
                description={
                    <span>
                        Você está prestes a excluir <strong>{taskToDelete?.title}</strong>.
                        <br /><br />
                        Esta ação é irreversível e removerá todos os dados associados, incluindo checklists e comentários.
                    </span>
                }
                isDeleting={isDeleting}
                onClose={() => setTaskToDelete(null)}
                onConfirm={confirmDeleteTask}
            />

            {/* Column Has Tasks Warning - SAFETY */}
            <AlertDialog open={!!columnWarning} onOpenChange={(open) => !open && setColumnWarning(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold uppercase text-xs tracking-wider">Ação Bloqueada</span>
                        </div>
                        <AlertDialogTitle>Lista não pode ser excluída</AlertDialogTitle>
                        <AlertDialogDescription>
                            A lista <strong>{columnWarning?.name}</strong> contém <strong>{columnWarning?.count} cartões</strong>.
                            <br /><br />
                            Por segurança, você deve mover ou excluir todos os cartões desta lista antes de excluí-la.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setColumnWarning(null)}>
                            Entendi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function SortableColumn({
    column,
    tasks,
    onCardClick,
    onTaskCreated,
    onOpenAddTask,
    onColumnRenamed,
    onRequestDeleteColumn,
    onRequestDeleteTask
}: {
    column: KanbanColumn
    tasks: ExtendedTask[]
    onCardClick: (task: ExtendedTask) => void
    onTaskCreated: (task: ExtendedTask) => void
    onOpenAddTask?: (phase: string) => void
    onColumnRenamed?: (columnId: string, newName: string) => void
    onRequestDeleteColumn?: (columnId: string, name: string) => void
    onRequestDeleteTask?: (taskId: string, title: string) => void

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
        data: { type: 'column' } as DragData
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex-shrink-0 w-[280px] flex flex-col"
        >
            <Column
                id={column.id}
                title={column.name}
                color="bg-white"
                accent={column.color}
                tasks={tasks}
                dragHandleProps={{ ...attributes, ...listeners }}
                onCardClick={onCardClick}
                onTaskCreated={onTaskCreated}
                onOpenAddTask={onOpenAddTask}
                onColumnRenamed={onColumnRenamed}
                onRequestDeleteColumn={onRequestDeleteColumn}
                onRequestDeleteTask={onRequestDeleteTask}
            />
        </div>
    )
}

function Column({
    id,
    title,
    color,
    accent,
    tasks,
    dragHandleProps,
    onCardClick,
    onTaskCreated,
    onOpenAddTask,
    onColumnRenamed,
    onRequestDeleteColumn,
    onRequestDeleteTask
}: {
    id: string
    title: string
    color: string
    accent: string
    tasks: ExtendedTask[]
    dragHandleProps?: any
    onCardClick?: (task: ExtendedTask) => void
    onTaskCreated?: (task: ExtendedTask) => void
    onOpenAddTask?: (phase: string) => void
    onColumnRenamed?: (columnId: string, newName: string) => void
    onRequestDeleteColumn?: (columnId: string, name: string) => void
    onRequestDeleteTask?: (taskId: string, title: string) => void
}) {
    // REMOVED useSortable from here to avoid conflict with SortableColumn
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(title)
    const [isSaving, setIsSaving] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    // Update local state if title prop changes (e.g. from parent state update)
    useEffect(() => {
        setEditName(title)
    }, [title])

    const handleRename = async () => {
        if (!editName.trim() || editName === title) {
            setIsEditing(false)
            setEditName(title)
            return
        }

        setIsSaving(true)
        try {
            // Note: Optimistic update is handled by parent, we just trigger action
            await updateColumnAction(id, editName.trim(), accent)
            if (onColumnRenamed) {
                onColumnRenamed(id, editName.trim())
            }
            setIsEditing(false)
        } catch (error) {
            console.error('Erro ao renomear coluna:', error)
            setEditName(title)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = () => {
        onRequestDeleteColumn?.(id, title)
        setMenuOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleRename()
        } else if (e.key === 'Escape') {
            setEditName(title)
            setIsEditing(false)
        }
    }

    const handleTaskCreated = (newTask: ExtendedTask) => {
        if (onTaskCreated) {
            onTaskCreated(newTask)
        }
    }

    return (
        <div
            // ref={setNodeRef} // Removed ref from here, it's on the wrapper in SortableColumn
            className={cn(
                "rounded-xl border border-slate-200/60 bg-[#ebecf0] flex flex-col max-h-full w-[280px] flex-shrink-0 shadow-sm transition-all",
                // isOver ? 'ring-2 ring-blue-500/30' : ''
            )}
        >
            {/* Column Header */}
            <div
                className="p-3 pl-4 flex items-center justify-between group/header cursor-grab active:cursor-grabbing"
                {...dragHandleProps}
                data-no-drag-scroll="true"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleRename}
                            autoFocus
                            disabled={isSaving}
                            className="w-full text-sm font-semibold px-2 py-1 rounded border-2 border-blue-500 focus:outline-none"
                        />
                    ) : (
                        <h3
                            className="font-semibold text-slate-700 text-sm truncate"
                            onClick={() => setIsEditing(true)}
                        >
                            {title}
                        </h3>
                    )}
                </div>
                <div className="flex items-center relative">
                    <span className="text-xs font-semibold text-slate-500 mr-2 bg-slate-200/50 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>

                </div>
            </div>


            {/* Column Body */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar min-h-0">
                <div className="flex flex-col gap-2">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <DraggableCard
                                key={task.id}
                                task={task}
                                onCardClick={onCardClick}
                                onRequestDelete={onRequestDeleteTask}
                            />
                        ))}
                    </SortableContext>
                </div>
            </div>

            {/* Column Footer - Add Card */}
            <div className="p-2 pt-0">
                <button
                    onClick={() => onOpenAddTask && onOpenAddTask(title)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 w-full px-2 py-1.5 rounded-lg text-sm text-left transition-colors"
                >
                    <Plus className="w-4 h-4" /> Adicionar cartão
                </button>
            </div>
        </div >
    )
}

function AddListButton({ onAddList }: { onAddList: (name: string) => Promise<void> }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState("")

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
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
            <div className="w-[280px] flex-shrink-0 bg-white rounded-xl p-3 border border-slate-200 shadow-lg h-fit animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        placeholder="Título da lista..."
                        className="w-full px-3 py-2 text-sm border-2 border-blue-500 rounded-md mb-2 focus:outline-none"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Escape') setIsEditing(false)
                        }}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors"
                        >
                            Adicionar lista
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-slate-500 hover:text-slate-700 p-1.5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div
            className="w-[280px] flex-shrink-0 h-12 bg-white/50 hover:bg-white/80 rounded-xl transition-colors cursor-pointer flex items-center px-4 font-medium text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200 backdrop-blur-sm"
            onClick={() => setIsEditing(true)}
        >
            <Plus className="w-4 h-4 mr-2" /> Adicionar outra lista
        </div>
    )
}



function DraggableCard({
    task,
    onCardClick,
    onRequestDelete
}: {
    task: ExtendedTask,
    onCardClick?: (task: ExtendedTask) => void
    onRequestDelete?: (taskId: string, title: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: { type: 'card' } as DragData
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="touch-none cursor-grab active:cursor-grabbing"
            data-no-drag-scroll="true"
        >
            <TaskCardItem
                task={task}
                onCardClick={onCardClick}
                onRequestDelete={onRequestDelete}
            />
        </div>
    )
}

function TaskCardItem({
    task,
    isOverlay,
    onRequestDelete,
    onCardClick
}: {
    task: ExtendedTask,
    isOverlay?: boolean,
    onRequestDelete?: (id: string, title: string) => void,
    onCardClick?: (task: ExtendedTask) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)

    // Logic: Color based on Critical Deadline (Prazo Fatal)
    const isProtocolQueue = task.phase === 'Protocolar' || task.phase === 'PROTOCOL'
    const isLate = task.fatalDate && new Date(task.fatalDate) < new Date() && (task.phase !== 'Concluído' && task.phase !== 'PROTOCOLLED')
    const isDueSoon = task.fatalDate && new Date(task.fatalDate).getTime() - new Date().getTime() < 86400000 * 2

    let borderColor = "border-l-sky-400"
    const bgColor = "bg-white"

    if (isProtocolQueue) {
        borderColor = "border-l-emerald-500"
    } else if (isLate) {
        borderColor = "border-l-red-500"
    } else if (isDueSoon) {
        borderColor = "border-l-yellow-400"
    }

    const handleDelete = async () => {
        setMenuOpen(false)
        // Decouple dialog opening from event handling to prevent focus freeze
        // This allows the menu to close and focus to reset before the dialog tries to open
        setTimeout(() => {
            onRequestDelete?.(task.id, task.title)
        }, 10)
    }

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on menu button or menu items
        if ((e.target as HTMLElement).closest('button')) return
        onCardClick?.(task)
    }

    return (
        <div
            className={cn(
                "group relative rounded-xl p-4 border shadow-sm hover:shadow-lg transition-all duration-200 border-l-4",
                borderColor,
                bgColor,
                isOverlay && "shadow-2xl rotate-2 scale-105 cursor-grabbing",
                !isOverlay && onCardClick && "cursor-pointer hover:scale-[1.01] hover:border-slate-300"
            )}
            onClick={!isOverlay ? handleCardClick : undefined}
        >
            {/* Title */}
            <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 pr-6 mb-3">
                {task.title}
            </h4>

            {/* Process Badge - Improved */}
            {task.process && (
                <div className="mb-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[160px]">
                            {task.process.folderName || task.process.number}
                        </span>
                    </div>
                </div>
            )}

            {/* Footer: Date & Responsible */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                    {task.endDate ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="font-medium">
                                {new Date(task.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Sem prazo</span>
                    )}
                </div>
                {task.responsibleLawyer?.name ? (
                    <div
                        className={cn(
                            "w-7 h-7 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-sm cursor-default ring-1 ring-white",
                            getUserColor(task.responsibleLawyer.name)
                        )}
                        title={task.responsibleLawyer.name}
                    >
                        {getUserInitials(task.responsibleLawyer.name)}
                    </div>
                ) : (
                    <div
                        className="w-7 h-7 rounded-full bg-slate-100 text-[11px] text-slate-400 flex items-center justify-center font-medium cursor-default border border-dashed border-slate-300"
                        title="Sem responsável"
                    >
                        ?
                    </div>
                )}
            </div>

            {/* Menu Button */}
            {!isOverlay && (
                <div className="absolute top-2 right-2">
                    <button
                        onPointerDown={(e) => e.stopPropagation()} // STOP DRAG START
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]"
                            onPointerDown={(e) => e.stopPropagation()} // STOP DRAG inside menu
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onPointerDown={(e) => e.stopPropagation()} // DOUBLE SAFETY
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete()
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}



function CardOverlay({ task }: { task: ExtendedTask }) {
    return <TaskCardItem task={task} isOverlay />
}

function ColumnOverlay({ column, tasks }: { column: KanbanColumn, tasks: ExtendedTask[] }) {
    return (
        <div className="w-80 rounded-xl border-2 border-blue-400 bg-white shadow-2xl opacity-90 flex flex-col max-h-[600px]">
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="font-bold text-slate-800 text-sm">{column.name}</h3>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                    {tasks.length}
                </span>
            </div>

            {/* Column Body Preview */}
            <div className="p-3 flex flex-col gap-2 overflow-hidden">
                {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="opacity-60">
                        <TaskCardItem task={task} />
                    </div>
                ))}
                {tasks.length > 3 && (
                    <div className="text-xs text-slate-400 text-center">
                        +{tasks.length - 3} mais
                    </div>
                )}
            </div>
        </div>
    )
}
