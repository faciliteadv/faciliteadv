'use client'

import { useState } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core"
import { TaskCard, TaskPhase } from "@prisma/client"
import { moveCardAction } from "@/lib/actions/kanban-actions"

// Defined Columns and Colors
const COLUMNS: { id: TaskPhase; label: string; color: string }[] = [
    { id: 'TODO', label: 'A Fazer', color: 'bg-slate-100 border-slate-200' },
    { id: 'DOING', label: 'Em Andamento', color: 'bg-blue-50 border-blue-200' },
    { id: 'REVIEW', label: 'Revisar', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'REFACTOR', label: 'Refazer', color: 'bg-red-50 border-red-200' },
    { id: 'WAITING_DOCS', label: 'Aguardando Docs', color: 'bg-slate-100 border-slate-200' },
    { id: 'PROTOCOL', label: 'Protocolar', color: 'bg-green-50 border-green-200' },
    { id: 'PROTOCOLLED', label: 'Protocolados', color: 'bg-indigo-50 border-indigo-200' },
]

type BoardProps = {
    initialTasks: (TaskCard & { client: { name: string } | null, process: { number: string } | null })[]
}

export function KanbanBoard({ initialTasks }: BoardProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [activeId, setActiveId] = useState<string | null>(null)

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

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <Column key={col.id} id={col.id} title={col.label} color={col.color} tasks={tasks.filter(t => t.phase === col.id)} />
                ))}
            </div>
            <DragOverlay>
                {activeId ? <CardOverlay task={tasks.find(t => t.id === activeId)} /> : null}
            </DragOverlay>
        </DndContext>
    )
}

function Column({ id, title, color, tasks }: { id: string, title: string, color: string, tasks: any[] }) {
    const { setNodeRef } = useDroppable({ id })

    return (
        <div ref={setNodeRef} className={`flex-shrink-0 w-80 rounded-lg border ${color} p-4 flex flex-col gap-3 min-h-[500px]`}>
            <h3 className="font-semibold text-slate-700">{title} <span className="text-xs text-slate-400">({tasks.length})</span></h3>
            {tasks.map((task) => (
                <DraggableCard key={task.id} task={task} />
            ))}
        </div>
    )
}

function DraggableCard({ task }: { task: any }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <TaskCardItem task={task} />
        </div>
    )
}

function TaskCardItem({ task }: { task: any }) {
    // Deadline Logic
    const isLate = task.fatalDate && new Date(task.fatalDate) < new Date()

    return (
        <div className={`p-3 bg-white rounded shadow-sm border ${isLate ? 'border-red-500 border-l-4' : 'border-slate-200'} cursor-grab hover:shadow-md transition-shadow`}>
            <p className="font-medium text-sm text-slate-900">{task.title}</p>
            {task.client && <p className="text-xs text-slate-500 mt-1">{task.client.name}</p>}
            {task.process && <p className="text-xs text-slate-400 font-mono">{task.process.number}</p>}
            {task.fatalDate && (
                <div className={`text-xs mt-2 font-semibold ${isLate ? 'text-red-600' : 'text-orange-600'}`}>
                    Fatal: {new Date(task.fatalDate).toLocaleDateString()}
                </div>
            )}
        </div>
    )
}

function CardOverlay({ task }: { task: any }) {
    if (!task) return null
    return <TaskCardItem task={task} />
}
