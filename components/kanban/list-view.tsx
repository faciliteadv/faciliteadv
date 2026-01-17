'use client'

import { useState } from "react"
import { TaskCard } from "@prisma/client"
import { AlertCircle, FileText, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

type ExtendedTask = TaskCard & {
    client?: { id: string; name: string } | null
    process?: { id: string; number: string; folderName: string | null } | null
    tags?: { id: string; name: string; color: string }[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

type Props = {
    tasks: ExtendedTask[]
}

const PHASE_LABELS: Record<string, string> = {
    'TODO': 'A Fazer',
    'DOING': 'Em Andamento',
    'REVIEW': 'Revisão',
    'REFACTOR': 'Refazer',
    'WAITING_DOCS': 'Aguardando Docs',
    'PROTOCOL': 'Protocolar',
    'PROTOCOLLED': 'Concluído'
}

const PHASE_COLORS: Record<string, string> = {
    'TODO': 'bg-slate-100 text-slate-700',
    'DOING': 'bg-sky-100 text-sky-700',
    'REVIEW': 'bg-yellow-100 text-yellow-700',
    'REFACTOR': 'bg-red-100 text-red-700',
    'WAITING_DOCS': 'bg-slate-100 text-slate-600',
    'PROTOCOL': 'bg-emerald-100 text-emerald-700',
    'PROTOCOLLED': 'bg-blue-100 text-blue-700'
}

const SortIcon = ({
    column,
    sortBy,
    sortOrder
}: {
    column: 'fatalDate' | 'title' | 'phase',
    sortBy: string,
    sortOrder: 'asc' | 'desc'
}) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
}

export function KanbanListView({ tasks }: Props) {
    const [sortBy, setSortBy] = useState<'fatalDate' | 'title' | 'phase'>('fatalDate')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const sortedTasks = [...tasks].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
            case 'fatalDate':
                const dateA = a.fatalDate ? new Date(a.fatalDate).getTime() : Infinity
                const dateB = b.fatalDate ? new Date(b.fatalDate).getTime() : Infinity
                comparison = dateA - dateB
                break
            case 'title':
                comparison = a.title.localeCompare(b.title)
                break
            case 'phase':
                comparison = a.phase.localeCompare(b.phase)
                break
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })

    const toggleSort = (column: 'fatalDate' | 'title' | 'phase') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('asc')
        }
    }

    const getDateColor = (task: ExtendedTask) => {
        if (!task.fatalDate) return 'text-slate-400'

        const isProtocolQueue = task.phase === 'PROTOCOL'
        const isLate = new Date(task.fatalDate) < new Date() && task.phase !== 'PROTOCOLLED'
        const isDueSoon = new Date(task.fatalDate).getTime() - new Date().getTime() < 86400000 * 2

        if (isProtocolQueue) return 'text-emerald-600 font-bold'
        if (isLate) return 'text-red-600 font-bold'
        if (isDueSoon) return 'text-yellow-600 font-bold'
        return 'text-sky-600'
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    <button
                        onClick={() => toggleSort('title')}
                        className="col-span-3 flex items-center gap-2 hover:text-blue-600 transition-colors text-left"
                    >
                        Tarefa
                        <SortIcon column="title" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                    <div className="col-span-2">Processo</div>
                    <button
                        onClick={() => toggleSort('phase')}
                        className="col-span-2 flex items-center gap-2 hover:text-blue-600 transition-colors text-left"
                    >
                        Status
                        <SortIcon column="phase" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                    <div className="col-span-1 text-center">Tipo</div>
                    <div className="col-span-2 text-center">Data Final</div>
                    <button
                        onClick={() => toggleSort('fatalDate')}
                        className="col-span-2 flex items-center gap-2 justify-center hover:text-blue-600 transition-colors"
                    >
                        Prazo Fatal
                        <SortIcon column="fatalDate" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-100 max-h-[calc(100vh-320px)] overflow-y-auto">
                {sortedTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Nenhuma tarefa encontrada</p>
                    </div>
                ) : (
                    sortedTasks.map((task) => (
                        <div
                            key={task.id}
                            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                            {/* Title */}
                            <div className="col-span-3">
                                <h4 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
                                    {task.title}
                                </h4>
                                {task.description && (
                                    <p className="text-xs text-slate-500 line-clamp-1">
                                        {task.description}
                                    </p>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {task.tags.map(tag => (
                                            <span
                                                key={tag.id}
                                                className="text-[10px] px-1.5 py-0.5 rounded"
                                                style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Process */}
                            <div className="col-span-2 flex items-center">
                                {task.process ? (
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="text-xs text-slate-600 font-mono truncate">
                                            {task.process.folderName || task.process.number}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                )}
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex items-center">
                                <span className={cn(
                                    "text-xs px-2 py-1 rounded-full font-medium",
                                    PHASE_COLORS[task.phase] || "bg-slate-100 text-slate-700"
                                )}>
                                    {PHASE_LABELS[task.phase] || task.phase}
                                </span>
                            </div>

                            {/* Type */}
                            <div className="col-span-1 flex items-center justify-center">
                                <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded font-medium",
                                    task.type === 'DEADLINE'
                                        ? "bg-red-50 text-red-600 border border-red-100"
                                        : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}>
                                    {task.type === 'DEADLINE' ? 'Prazo' : 'Interna'}
                                </span>
                            </div>

                            {/* End Date */}
                            <div className="col-span-2 flex items-center justify-center">
                                {task.endDate ? (
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(task.endDate).toLocaleDateString('pt-BR')}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                )}
                            </div>

                            {/* Fatal Date */}
                            <div className="col-span-2 flex items-center justify-center">
                                {task.fatalDate ? (
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-semibold",
                                        getDateColor(task)
                                    )}>
                                        <AlertCircle className="w-3 h-3" />
                                        {new Date(task.fatalDate).toLocaleDateString('pt-BR')}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
