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
// Kanban Phases (Matches User Request + Schema)
const COLUMNS: { id: TaskPhase; label: string; color: string; accent: string }[] = [
    { id: 'TODO', label: 'A Fazer', color: 'bg-slate-50', accent: 'bg-slate-500' }, // Gray
    { id: 'DOING', label: 'Em Andamento', color: 'bg-sky-50', accent: 'bg-sky-500' }, // Light Blue
    { id: 'REVIEW', label: 'Revisão', color: 'bg-yellow-50', accent: 'bg-yellow-500' }, // Yellow
    { id: 'REFACTOR', label: 'Refazer', color: 'bg-red-50', accent: 'bg-red-500' }, // Red (Mapped to Refactor)
    { id: 'WAITING_DOCS', label: 'Aguardando Docs', color: 'bg-slate-100', accent: 'bg-slate-400' }, // Gray
    { id: 'PROTOCOL', label: 'Protocolar', color: 'bg-emerald-50', accent: 'bg-emerald-500' }, // Green (Submit Queue)
    { id: 'PROTOCOLLED', label: 'Concluído', color: 'bg-blue-900/5', accent: 'bg-blue-900' }, // Dark Blue (Filed)
]

type ExtendedTask = TaskCard & {
    client?: { id: string; name: string } | null
    process?: { id: string; number: string; folderName: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
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
                distance: 8, // Slightly higher to distinguish scroll vs drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Reduced delay
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
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none select-none cursor-grab active:cursor-grabbing">
            <TaskCardItem task={task} />
        </div>
    )
}

function TaskCardItem({ task, isOverlay }: { task: ExtendedTask, isOverlay?: boolean }) {
    // Logic: Color based on Critical Deadline (Prazo Fatal)
    // Blue (Default) -> Yellow (2 days left) -> Red (Late) -> Green (Protocol Queue)

    const isProtocolQueue = task.phase === 'PROTOCOL'
    const isLate = task.fatalDate && new Date(task.fatalDate) < new Date() && task.phase !== 'PROTOCOLLED'
    const isDueSoon = task.fatalDate && new Date(task.fatalDate).getTime() - new Date().getTime() < 86400000 * 2 // 2 days

    let borderColor = "border-l-sky-400" // Default Light Blue
    let bgColor = "bg-white"

    if (isProtocolQueue) {
        borderColor = "border-l-emerald-500" // Green
    } else if (isLate) {
        borderColor = "border-l-red-500" // Red
    } else if (isDueSoon) {
        borderColor = "border-l-yellow-400" // Yellow
    }

    return (
        <div className={cn(
            "group relative rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing border-l-[6px]",
            borderColor,
            bgColor,
            isOverlay && "shadow-xl rotate-2 scale-105"
        )}>

            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                    {task.title}
                </h4>
            </div>

            {/* Compact Info: Process & Client */}
            <div className="space-y-1 mb-3">
                {task.process && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="font-mono bg-slate-50 px-1 rounded text-[10px] truncate max-w-[150px]">{task.process.folderName || task.process.number}</span>
                    </div>
                )}
                {task.client && (
                    <div className="hidden"> {/* Hidden based on request? "process folder name... visible". Client not explicitly mentioned but useful. Keeping hidden if strict. User said: "Process Folder Name... End Date... Critical Deadline... Responsible" */}
                        {/* Hiding client to strictly follow: Name, Process Folder, End Date, Critical Deadline, Responsible */}
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

                {/* Responsible Avatar (Using User Initials) */}
                <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] text-slate-600 flex items-center justify-center font-bold ring-2 ring-white" title="Responsável">
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
