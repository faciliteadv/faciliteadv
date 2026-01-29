'use client'

import { useState } from "react"
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
    arrayMove,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard, Tag, KanbanColumn } from "@prisma/client"
import { moveCardAction, deleteTaskAction } from "@/lib/actions/kanban-actions"
import { reorderColumnsAction } from "@/lib/actions/column-actions"
import { AlertCircle, FileText, MoreHorizontal, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type ExtendedTask = Omit<TaskCard, 'phase'> & {
    phase: string
    client?: { id: string; name: string } | null
    process?: { id: string; number: string; folderName: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

type BoardProps = {
    initialTasks: ExtendedTask[]
    columns: KanbanColumn[]
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

export function KanbanBoard({ initialTasks, columns: initialColumns }: BoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [columns, setColumns] = useState(initialColumns)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeType, setActiveType] = useState<'column' | 'card' | null>(null)

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
            // over.id could be a column id or another card id
            let targetColumnName: string | null = null

            // Check if dropped directly on a column
            const targetColumn = columns.find(col => col.id === over.id)
            if (targetColumn) {
                targetColumnName = targetColumn.name
            } else {
                // Dropped on another card - find that card's column
                const targetCard = tasks.find(t => t.id === over.id)
                if (targetCard) {
                    targetColumnName = targetCard.phase
                }
            }

            if (targetColumnName && targetColumnName !== tasks.find(t => t.id === cardId)?.phase) {
                // Optimistic Update
                setTasks((prev) =>
                    prev.map(t => t.id === cardId ? { ...t, phase: targetColumnName } : t)
                )

                // Server Action
                await moveCardAction(cardId, targetColumnName)
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
            <div className="h-full bg-slate-50 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
                    <SortableContext
                        items={columns.map(col => col.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <div className="flex gap-6 items-start min-w-max h-full">
                            {columns.map((col) => (
                                <SortableColumn
                                    key={col.id}
                                    column={col}
                                    tasks={tasks.filter(t => t.phase === col.name)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeColumn ? (
                    <ColumnOverlay
                        column={activeColumn}
                        tasks={tasks.filter(t => t.phase === activeColumn.name)}
                    />
                ) : activeTask ? (
                    <CardOverlay task={activeTask} />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

function SortableColumn({ column, tasks }: { column: KanbanColumn, tasks: ExtendedTask[] }) {
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
            className="flex-shrink-0 w-80 flex flex-col"
        >
            <Column
                id={column.id}
                title={column.name}
                color="bg-white"
                accent={column.color}
                tasks={tasks}
                dragHandleProps={{ ...attributes, ...listeners }}
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
    dragHandleProps
}: {
    id: string
    title: string
    color: string
    accent: string
    tasks: ExtendedTask[]
    dragHandleProps?: any
}) {
    const { setNodeRef, isOver } = useSortable({
        id,
        data: { type: 'column' } as DragData
    })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "rounded-xl border border-slate-200 flex flex-col h-[calc(100vh-160px)] transition-all duration-200 w-80 flex-shrink-0 bg-white shadow-md",
                isOver ? 'ring-2 ring-blue-500/30 bg-blue-50/50 scale-[1.02]' : ''
            )}
        >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-inherit rounded-t-xl">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing touch-none hover:bg-slate-100 rounded p-1 transition-colors"
                        title="Arrastar coluna"
                    >
                        <GripVertical className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                    <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-black/5">
                    {tasks.length}
                </span>
            </div>

            {/* Column Body */}
            <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-[150px] custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                    {tasks.map((task) => (
                        <DraggableCard key={task.id} task={task} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                        Arraste para cá
                    </div>
                )}
            </div>
        </div>
    )
}

function DraggableCard({ task }: { task: ExtendedTask }) {
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
            <TaskCardItem task={task} />
        </div>
    )
}

function TaskCardItem({ task, isOverlay, onDelete }: { task: ExtendedTask, isOverlay?: boolean, onDelete?: (id: string) => void }) {
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

    return (
        <div className={cn(
            "group relative rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 border-l-[6px]",
            borderColor,
            bgColor,
            isOverlay && "shadow-xl rotate-2 scale-105 cursor-grabbing",
            deleting && "opacity-50 pointer-events-none"
        )}>

            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 pr-6">
                    {task.title}
                </h4>
            </div>

            {/* Compact Info: Process */}
            <div className="space-y-1 mb-3">
                {task.process && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="font-mono bg-slate-50 px-1 rounded text-[10px] truncate max-w-[150px]">{task.process.folderName || task.process.number}</span>
                    </div>
                )}
            </div>

            {/* Footer: Dates & Responsible */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                <div className="flex flex-col gap-1">
                    {task.endDate && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span>Fim:</span>
                            {new Date(task.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                    )}
                    {task.fatalDate && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold",
                            isLate ? "text-red-600" : isDueSoon ? "text-yellow-600" : "text-sky-600"
                        )}>
                            <AlertCircle className="w-3 h-3" />
                            {new Date(task.fatalDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                    )}
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] text-slate-600 flex items-center justify-center font-bold ring-2 ring-white" title="Responsável">
                    U
                </div>
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
