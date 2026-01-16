'use client'

import { useState } from "react"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDraggable,
    useDroppable,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DropAnimation
} from "@dnd-kit/core"
import { TaskCard, TaskPhase, Tag } from "@prisma/client"
import { moveCardAction } from "@/lib/actions/kanban-actions"
import { Calendar, AlertCircle, FileText, User, MoreHorizontal, Clock, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Professional Blue Columns
const COLUMNS: { id: TaskPhase; label: string; color: string; accent: string }[] = [
    { id: 'TODO', label: 'A Fazer', color: 'bg-slate-50', accent: 'bg-slate-500' },
    { id: 'DOING', label: 'Em Andamento', color: 'bg-blue-50/50', accent: 'bg-blue-600' },
    { id: 'REVIEW', label: 'Revisão', color: 'bg-amber-50/50', accent: 'bg-amber-500' },
    { id: 'WAITING_DOCS', label: 'Docs Pendentes', color: 'bg-purple-50/50', accent: 'bg-purple-500' },
    { id: 'PROTOCOL', label: 'Protocolar', color: 'bg-emerald-50/50', accent: 'bg-emerald-600' },
    { id: 'PROTOCOLLED', label: 'Concluído', color: 'bg-slate-100/50', accent: 'bg-slate-400' },
]

type ExtendedTask = TaskCard & {
    client: { name: string } | null,
    process: { number: string } | null,
    tags: Tag[]
}

type BoardProps = {
    initialTasks: ExtendedTask[]
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

export function KanbanBoard({ initialTasks }: BoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)

        if (over && active.id !== over.id) {
            const cardId = active.id as string
            const newPhase = over.id as TaskPhase

            // Optimistic Update
            setTasks((prev) =>
                prev.map(t => t.id === cardId ? { ...t, phase: newPhase } : t)
            )

            // Server Action
            await moveCardAction(cardId, newPhase)
        }
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-6 overflow-x-auto pb-6 px-1 items-start">
                {COLUMNS.map((col) => (
                    <Column
                        key={col.id}
                        id={col.id}
                        title={col.label}
                        color={col.color}
                        accent={col.accent}
                        tasks={tasks.filter(t => t.phase === col.id)}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeTask ? <CardOverlay task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    )
}

function Column({ id, title, color, accent, tasks }: { id: string, title: string, color: string, accent: string, tasks: ExtendedTask[] }) {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-shrink-0 w-80 rounded-xl border border-slate-200/60 flex flex-col max-h-full transition-colors duration-200",
                color,
                isOver ? 'ring-2 ring-blue-500/20 bg-blue-50/80' : ''
            )}
        >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/50 sticky top-0 backdrop-blur-sm rounded-t-xl bg-inherit z-10">
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", accent)} />
                    <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 text-slate-500 border border-black/5">
                    {tasks.length}
                </span>
            </div>

            {/* Column Body */}
            <div className="p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-[150px]">
                {tasks.map((task) => (
                    <DraggableCard key={task.id} task={task} />
                ))}
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
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0 : 1
    } : undefined

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none select-none">
            <TaskCardItem task={task} />
        </div>
    )
}

function TaskCardItem({ task, isOverlay }: { task: ExtendedTask, isOverlay?: boolean }) {
    // Deadline Logic
    const isLate = task.fatalDate && new Date(task.fatalDate) < new Date()
    const isDueSoon = task.fatalDate && new Date(task.fatalDate).getTime() - new Date().getTime() < 86400000 * 2 // 2 days

    return (
        <div className={cn(
            "group relative bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-grab active:cursor-grabbing",
            isOverlay && "shadow-xl rotate-2 scale-105 border-blue-500",
            isLate && "border-l-4 border-l-red-500",
            !isLate && isDueSoon && "border-l-4 border-l-amber-500"
        )}>
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
                {task.tags && task.tags.map(tag => (
                    <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {tag.name}
                    </span>
                ))}
                {task.type === 'DEADLINE' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium border border-red-100">
                        Prazo
                    </span>
                )}
            </div>

            <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-snug">
                {task.title}
            </h4>

            {/* Client & Process */}
            <div className="space-y-1 mb-3">
                {task.client && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[180px]">{task.client.name}</span>
                    </div>
                )}
                {task.process && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="font-mono bg-slate-50 px-1 rounded text-[10px]">{task.process.number}</span>
                    </div>
                )}
            </div>

            {/* Footer: Date & Avatar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                <div className="flex items-center gap-2">
                    {task.fatalDate ? (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                            isLate ? "bg-red-50 text-red-600" : isDueSoon ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
                        )}>
                            <Clock className="w-3 h-3" />
                            {new Date(task.fatalDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </div>
                    ) : (
                        <div className="text-xs text-slate-400">Sem data</div>
                    )}
                </div>

                {/* User Avatar Placeholder */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-white">
                    U
                </div>
            </div>

            {/* Hover Actions */}
            <button className="absolute top-2 right-2 p-1 rounded hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    )
}

function CardOverlay({ task }: { task: ExtendedTask }) {
    return <TaskCardItem task={task} isOverlay />
}
