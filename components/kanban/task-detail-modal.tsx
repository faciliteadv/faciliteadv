'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Calendar,
    AlertCircle,
    CheckSquare,
    Square,
    ExternalLink,
    User,
    Tag,
    Clock,
    Star,
    Briefcase,
    Hash
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskCard, Tag as TagType } from "@prisma/client"
import { toggleChecklistItemAction } from "@/lib/actions/kanban-actions"

type ExtendedTask = Omit<TaskCard, 'phase' | 'createdAt' | 'updatedAt' | 'fatalDate' | 'endDate' | 'publicationDate' | 'protocolDate'> & {
    phase: string
    createdAt: string
    updatedAt: string
    fatalDate: string | null
    endDate: string | null
    publicationDate: string | null
    protocolDate: string | null
    client?: { id: string; name: string } | null
    process?: { id: string; number: string; folderName: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: TagType[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

interface TaskDetailModalProps {
    task: ExtendedTask | null
    isOpen: boolean
    onClose: () => void
}

const PRACTICE_AREA_LABELS: Record<string, string> = {
    'CIVIL': 'Cível',
    'CRIMINAL': 'Criminal',
    'LABOR': 'Trabalhista',
    'TAX': 'Tributário',
    'FAMILY': 'Família',
    'BUSINESS': 'Empresarial',
    'ADMINISTRATIVE': 'Administrativo',
    'OTHER': 'Outro'
}

const DAYS_TYPE_LABELS: Record<string, string> = {
    'BUSINESS': 'Dias Úteis',
    'CALENDAR': 'Dias Corridos'
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
    const router = useRouter()

    // Local checklist state for optimistic updates
    const [checklistItems, setChecklistItems] = useState<{ id: string; title: string; isCompleted: boolean }[]>([])

    // Sync local state with task prop
    useEffect(() => {
        if (task?.checklist) {
            setChecklistItems(task.checklist)
        }
    }, [task?.checklist])

    if (!task) return null

    const isLate = task.fatalDate && new Date(task.fatalDate) < new Date() && (task.phase !== 'Concluído' && task.phase !== 'PROTOCOLLED')
    const isDueSoon = task.fatalDate && new Date(task.fatalDate).getTime() - new Date().getTime() < 86400000 * 2

    const handleProcessClick = () => {
        if (task.process) {
            router.push(`/processes/${task.process.id}`)
            onClose()
        }
    }

    const handleToggleChecklist = async (itemId: string) => {
        // Optimistic update
        setChecklistItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? { ...item, isCompleted: !item.isCompleted }
                    : item
            )
        )

        try {
            await toggleChecklistItemAction(itemId)
        } catch (error) {
            // Revert on error
            setChecklistItems(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? { ...item, isCompleted: !item.isCompleted }
                        : item
                )
            )
        }
    }

    const completedChecklist = checklistItems.filter(item => item.isCompleted).length
    const totalChecklist = checklistItems.length

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                {/* Header with gradient and phase badge */}
                <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-b border-slate-100">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <DialogTitle className="text-xl font-bold text-slate-800 leading-tight pr-8">
                                {task.title}
                            </DialogTitle>
                        </div>

                        {/* Status Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-medium">
                                {task.phase}
                            </Badge>
                            {task.type && (
                                <Badge variant={task.type === 'DEADLINE' ? 'destructive' : 'secondary'}>
                                    {task.type === 'DEADLINE' ? '⚡ Prazo' : '📋 Interna'}
                                </Badge>
                            )}
                            {task.practiceArea && (
                                <Badge variant="outline" className="bg-white">
                                    {PRACTICE_AREA_LABELS[task.practiceArea] || task.practiceArea}
                                </Badge>
                            )}
                            {task.points && task.points > 0 && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <Star className="w-3 h-3 mr-1" />
                                    {task.points} pts
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Fatal Date Alert - Prominent if exists */}
                    {task.fatalDate && (
                        <div className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border-2",
                            isLate
                                ? "bg-red-50 border-red-200"
                                : isDueSoon
                                    ? "bg-yellow-50 border-yellow-200"
                                    : "bg-blue-50 border-blue-200"
                        )}>
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                isLate
                                    ? "bg-red-100"
                                    : isDueSoon
                                        ? "bg-yellow-100"
                                        : "bg-blue-100"
                            )}>
                                <AlertCircle className={cn(
                                    "w-6 h-6",
                                    isLate ? "text-red-600" : isDueSoon ? "text-yellow-600" : "text-blue-600"
                                )} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium">Prazo Fatal</p>
                                <p className={cn(
                                    "text-lg font-bold",
                                    isLate ? "text-red-700" : isDueSoon ? "text-yellow-700" : "text-blue-700"
                                )}>
                                    {new Date(task.fatalDate).toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                                {isLate && <span className="text-xs font-medium text-red-600">⚠️ Prazo atrasado!</span>}
                                {isDueSoon && !isLate && <span className="text-xs font-medium text-yellow-600">⏰ Prazo próximo</span>}
                            </div>
                        </div>
                    )}

                    {/* Descrição */}
                    {task.description && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Descrição</label>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Responsável */}
                        {task.responsibleLawyer && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">Responsável</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {task.responsibleLawyer.name || 'Não definido'}
                                </p>
                            </div>
                        )}

                        {/* Cliente */}
                        {task.client && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">Cliente</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {task.client.name}
                                </p>
                            </div>
                        )}

                        {/* Dias/Contagem */}
                        {task.daysCount && task.daysCount > 0 && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Hash className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">Contagem de Dias</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {task.daysCount} {DAYS_TYPE_LABELS[task.daysType || 'BUSINESS'] || 'dias'}
                                </p>
                            </div>
                        )}

                        {/* End Date */}
                        {task.endDate && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">Data Final</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {new Date(task.endDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}

                        {/* Publication Date */}
                        {task.publicationDate && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">Data Publicação</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {new Date(task.publicationDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}

                        {/* Protocol Date */}
                        {task.protocolDate && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500">Data Protocolo</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {new Date(task.protocolDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Processo Vinculado */}
                    {task.process && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Processo Vinculado
                            </label>
                            <Button
                                onClick={handleProcessClick}
                                variant="outline"
                                className="w-full justify-between gap-3 p-4 h-auto hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:border-blue-300 transition-all group rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {task.process.folderName || 'Processo'}
                                        </p>
                                        <p className="text-xs font-mono text-slate-500">
                                            {task.process.number}
                                        </p>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </Button>
                        </div>
                    )}

                    {/* Checklist */}
                    {checklistItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    Checklist
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all"
                                            style={{ width: totalChecklist > 0 ? `${(completedChecklist / totalChecklist) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">
                                        {completedChecklist}/{totalChecklist}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {checklistItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleToggleChecklist(item.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all w-full text-left hover:shadow-sm",
                                            item.isCompleted
                                                ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        {item.isCompleted ? (
                                            <CheckSquare className="w-5 h-5 shrink-0 text-emerald-600" />
                                        ) : (
                                            <Square className="w-5 h-5 shrink-0 text-slate-400" />
                                        )}
                                        <span className={cn(
                                            "text-sm flex-1",
                                            item.isCompleted ? "line-through text-slate-500" : "text-slate-700"
                                        )}>
                                            {item.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-purple-600" />
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {task.tags.map((tag) => (
                                    <Badge
                                        key={tag.id}
                                        className="px-3 py-1 text-white shadow-sm"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <Button onClick={onClose} variant="outline" className="rounded-lg">
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
