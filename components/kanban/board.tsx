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
    PointerSensor
} from "@dnd-kit/core"
import {
    SortableContext,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    arrayMove,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard, Tag, KanbanColumn } from "@prisma/client"
import { moveCardAction, deleteTaskAction, quickCreateTaskAction } from "@/lib/actions/kanban-actions"
import { reorderColumnsAction, updateColumnAction, createColumnAction } from "@/lib/actions/column-actions"
import { AlertCircle, FileText, MoreHorizontal, Trash2, GripVertical, Calendar, Plus, Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskDetailModal } from "./task-detail-modal"

type ExtendedTask = Omit<TaskCard, 'phase'> & {
    phase: string
    columnId?: string | null // Manually added to satisfy TS if Prisma types are stale
    client?: { id: string; name: string } | null
    process?: { id: string; number: string; folderName: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

type BoardProps = {
    initialTasks: ExtendedTask[]
    columns: KanbanColumn[]
    onOpenAddTask?: (phase: string) => void
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

export function KanbanBoard({ initialTasks, columns: initialColumns, onOpenAddTask }: BoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [columns, setColumns] = useState(initialColumns)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeType, setActiveType] = useState<'column' | 'card' | null>(null)
    const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null)

    // Sync tasks with initialTasks when it changes (e.g., from calendar filter)
    useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

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
                const newIndex = columns.findIndex(col => col.id === over.id)

                const reorderedColumns = arrayMove(columns, oldIndex, newIndex)
                setColumns(reorderedColumns)

                // Persist to server
                await reorderColumnsAction(reorderedColumns.map(col => col.id))
            }
            return
        }

        // Handle Card Movement
        if (activeType === 'card') {
            const cardId = active.id as string

            // Find which column the card was dropped on
            let targetColumnId: string | null = null
            let targetColumnName: string | null = null

            // Check if dropped directly on a column
            const targetColumn = columns.find(col => col.id === over.id)
            if (targetColumn) {
                targetColumnId = targetColumn.id
                targetColumnName = targetColumn.name
            } else {
                // Dropped on another card - find that card's column
                const targetCard = tasks.find(t => t.id === over.id)
                if (targetCard) {
                    targetColumnId = targetCard.columnId || null
                    // Fallback to phase matching if columnId is missing (should not happen after migration)
                    if (!targetColumnId) {
                        const col = columns.find(c => c.name === targetCard.phase)
                        if (col) targetColumnId = col.id
                    }
                    targetColumnName = targetCard.phase // Approximate, or fetch from column
                }
            }

            const activeCard = tasks.find(t => t.id === cardId)

            if (targetColumnId && activeCard && targetColumnId !== activeCard.columnId) {
                // Move to different column
                setTasks((prev) =>
                    prev.map(t => t.id === cardId ? {
                        ...t,
                        columnId: targetColumnId!,
                        phase: targetColumnName || t.phase // Optimistic update of phase too
                    } : t)
                )

                // Server Action
                // Note: moveCardAction now expects columnId
                await moveCardAction(cardId, targetColumnId)
            } else if (targetColumnId && activeCard && targetColumnId === activeCard.columnId) {
                // Reorder within same column
                if (over.id !== active.id && !targetColumn) {
                    const oldIndex = tasks.findIndex(t => t.id === active.id)
                    const newIndex = tasks.findIndex(t => t.id === over.id)

                    if (oldIndex !== -1 && newIndex !== -1) {
                        setTasks((prev) => arrayMove(prev, oldIndex, newIndex))
                    }
                }
            }
        }
    }

    const activeColumn = activeType === 'column' && activeId
        ? columns.find(col => col.id === activeId)
        : null
    const activeTask = activeType === 'card' && activeId
        ? tasks.find(t => t.id === activeId)
        : null

    return (
        <DndContext
            id="kanban-dnd-context"
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
        >
            <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
                <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4">
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
                                    onTaskCreated={(task) => setTasks(prev => [task, ...prev])}
                                    onOpenAddTask={onOpenAddTask}
                                    onColumnRenamed={(id: string, name: string) => {
                                        setColumns(prev => prev.map(c => c.id === id ? { ...c, name } : c))
                                    }}
                                />
                            ))}
                        </SortableContext>
                        <AddListButton onAddList={async (name) => {
                            const result = await createColumnAction('tasks', name, '#64748b')
                            if (result.success && result.column) {
                                setColumns(prev => [...prev, result.column])
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
                task={selectedTask}
                isOpen={selectedTask !== null}
                onClose={() => setSelectedTask(null)}
            />
        </DndContext>
    )
}

function SortableColumn({
    column,
    tasks,
    onCardClick,
    onTaskCreated,
    onOpenAddTask,
    onColumnRenamed
}: {
    column: KanbanColumn
    tasks: ExtendedTask[]
    onCardClick: (task: ExtendedTask) => void
    onTaskCreated: (task: ExtendedTask) => void
    onOpenAddTask?: (phase: string) => void
    onColumnRenamed?: (columnId: string, newName: string) => void
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
    onColumnRenamed
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
}) {
    const { setNodeRef, isOver } = useSortable({
        id,
        data: { type: 'column' } as DragData
    })
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(title)
    const [isSaving, setIsSaving] = useState(false)

    const handleRename = async () => {
        if (!editName.trim() || editName === title) {
            setIsEditing(false)
            setEditName(title)
            return
        }

        setIsSaving(true)
        try {
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
            ref={setNodeRef}
            className={cn(
                "rounded-xl border border-slate-200/60 bg-[#ebecf0] flex flex-col max-h-full w-[280px] flex-shrink-0 shadow-sm transition-all",
                isOver ? 'ring-2 ring-blue-500/30' : ''
            )}
        >
            {/* Column Header */}
            <div className="p-3 pl-4 flex items-center justify-between group/header cursor-grab active:cursor-grabbing" {...dragHandleProps}>
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
                <div className="flex items-center">
                    <span className="text-xs font-semibold text-slate-500 mr-2 bg-slate-200/50 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                    <button className="p-1 hover:bg-slate-300/50 rounded text-slate-500 opacity-0 group-hover/header:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar min-h-0">
                <div className="flex flex-col gap-2">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <DraggableCard key={task.id} task={task} onCardClick={onCardClick} />
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
        </div>
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



function DraggableCard({ task, onCardClick }: { task: ExtendedTask, onCardClick?: (task: ExtendedTask) => void }) {
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
        >
            <TaskCardItem task={task} onCardClick={onCardClick} />
        </div>
    )
}

function TaskCardItem({ task, isOverlay, onDelete, onCardClick }: { task: ExtendedTask, isOverlay?: boolean, onDelete?: (id: string) => void, onCardClick?: (task: ExtendedTask) => void }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

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
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
        setDeleting(true)
        try {
            await deleteTaskAction(task.id)
            onDelete?.(task.id)
        } catch {
            alert('Erro ao excluir tarefa')
        } finally {
            setDeleting(false)
            setMenuOpen(false)
        }
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
                deleting && "opacity-50 pointer-events-none",
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
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[11px] text-white flex items-center justify-center font-bold shadow-sm cursor-default"
                        title={task.responsibleLawyer.name}
                    >
                        {task.responsibleLawyer.name.charAt(0).toUpperCase()}
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
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                        <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]">
                            <button
                                onClick={handleDelete}
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
