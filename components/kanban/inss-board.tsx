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
} from "@dnd-kit/core"
import { INSSCase } from "@prisma/client"
import { moveINSSCaseAction } from "@/lib/actions/crm-actions"
import { AlertCircle, MoreHorizontal, Key, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

type KanbanColumn = {
    id: string
    name: string
    color: string
}

const ACTION_TYPE_LABELS: Record<string, string> = {
    MATERNITY_ASSISTANCE: 'Auxílio Maternidade',
    RETIREMENT_AGE: 'Aposent. por Idade',
    RETIREMENT_CONTRIBUTION: 'Aposent. por Tempo',
    DISABILITY_RETIREMENT: 'Aposent. por Invalidez',
    SICKNESS_BENEFIT: 'Auxílio Doença',
    ACCIDENT_AID: 'Auxílio Acidente',
    BPC_LOAS: 'BPC/LOAS',
    REVIEW: 'Revisão',
    OTHER: 'Outro',
}

type ExtendedINSS = Omit<INSSCase, 'createdAt' | 'updatedAt' | 'deadline'> & {
    createdAt: string
    updatedAt: string
    deadline: string | null
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

type BoardProps = {
    initialCases: ExtendedINSS[]
    columns: KanbanColumn[]
}

export function INSSBoard({ initialCases, columns }: BoardProps) {
    const [cases, setCases] = useState<ExtendedINSS[]>(initialCases)
    const [activeCase, setActiveCase] = useState<ExtendedINSS | null>(null)

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const draggedCase = cases.find(c => c.id === event.active.id)
        setActiveCase(draggedCase || null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveCase(null)

        if (!over) return

        const caseId = active.id as string
        const newPhase = over.id as string // Now a string (Column Name or ID)

        const movedCase = cases.find(c => c.id === caseId)
        if (!movedCase || movedCase.phase === newPhase) return

        // Optimistic update
        setCases(prev => prev.map(c =>
            c.id === caseId ? { ...c, phase: newPhase } : c
        ))

        try {
            await moveINSSCaseAction(caseId, newPhase)
        } catch {
            setCases(prev => prev.map(c =>
                c.id === caseId ? { ...c, phase: movedCase.phase } : c
            ))
        }
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full overflow-x-auto pb-4">
                {columns.map(column => {
                    const columnCases = cases.filter(c => c.phase === column.name)
                    return (
                        <Column
                            key={column.id}
                            id={column.name}
                            label={column.name}
                            color="bg-white"
                            accent={column.color}
                            cases={columnCases}
                        />
                    )
                })}
            </div>
            <DragOverlay>
                {activeCase && <INSSCardItem caseItem={activeCase} isOverlay />}
            </DragOverlay>
        </DndContext>
    )
}

function Column({ id, label, accent, cases }: { id: string, label: string, color: string, accent: string, cases: ExtendedINSS[] }) {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col min-w-[260px] max-w-[260px] rounded-xl transition-all duration-200 border border-slate-200 bg-white shadow-sm",
                isOver && "ring-2 ring-blue-400 ring-offset-2"
            )}
        >
            <div className="p-3 flex items-center gap-2 border-b border-slate-50">
                <div className={cn("w-2 h-2 rounded-full")} style={{ backgroundColor: accent }} />
                <h3 className="font-semibold text-slate-700 text-sm truncate">{label}</h3>
                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    {cases.length}
                </span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
                {cases.map(caseItem => (
                    <DraggableINSSCard key={caseItem.id} caseItem={caseItem} />
                ))}
            </div>
        </div>
    )
}

function DraggableINSSCard({ caseItem }: { caseItem: ExtendedINSS }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: caseItem.id
    })

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-30"
            )}
        >
            <INSSCardItem caseItem={caseItem} />
        </div>
    )
}

function INSSCardItem({ caseItem, isOverlay }: { caseItem: ExtendedINSS; isOverlay?: boolean }) {
    const isApproved = caseItem.phase === 'Deferido' || caseItem.phase === 'APPROVED'
    const isJudicial = caseItem.phase === 'Ação Judicial' || caseItem.phase === 'JUDICIAL_ACTION'
    const isLate = caseItem.deadline && new Date(caseItem.deadline) < new Date() && !isApproved && !isJudicial
    const isDueSoon = caseItem.deadline && new Date(caseItem.deadline).getTime() - new Date().getTime() < 86400000 * 2

    let borderColor = "border-l-sky-400"
    if (isApproved) borderColor = "border-l-green-500"
    else if (isJudicial) borderColor = "border-l-indigo-600"
    else if (isLate) borderColor = "border-l-red-500"
    else if (isDueSoon) borderColor = "border-l-yellow-400"

    return (
        <div className={cn(
            "group relative rounded-lg p-3 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 border-l-[6px]",
            borderColor,
            isOverlay && "shadow-xl rotate-2 scale-105"
        )}>
            {/* Action Type Badge */}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold mb-2 inline-block bg-purple-100 text-purple-700">
                {ACTION_TYPE_LABELS[caseItem.actionType as keyof typeof ACTION_TYPE_LABELS] || caseItem.actionType}
            </span>

            {/* Client Name */}
            <h4 className="text-sm font-bold text-slate-800 mb-2">{caseItem.clientName}</h4>

            {/* CPF & GOV Password */}
            <div className="space-y-1 mb-2">
                {caseItem.clientCpf && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{caseItem.clientCpf}</span>
                    </div>
                )}
                {caseItem.govPassword && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{caseItem.govPassword}</span>
                    </div>
                )}
            </div>

            {/* Footer: Deadline & Responsible */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                {caseItem.deadline ? (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold",
                        isLate ? "text-red-600" : isDueSoon ? "text-yellow-600" : isApproved ? "text-green-600" : "text-sky-600"
                    )}>
                        <AlertCircle className="w-3 h-3" />
                        {new Date(caseItem.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                ) : (
                    <span className="text-xs text-slate-400">Sem prazo</span>
                )}
                <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] text-slate-600 flex items-center justify-center font-bold ring-2 ring-white" title="Responsável">
                    U
                </div>
            </div>

            <button className="absolute top-2 right-2 p-1 rounded hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    )
}
