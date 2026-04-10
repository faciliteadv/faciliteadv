'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Calendar as CalendarIcon,
    AlertCircle,
    CheckSquare,
    Square,
    ExternalLink,
    User,
    Tag,
    Star,
    Briefcase,
    Hash,
    Save,
    Pencil,
    Scale
} from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { TaskCard, Tag as TagType } from "@prisma/client"
import { toggleChecklistItemAction } from "@/lib/actions/kanban-actions"
import { formatKanbanDate } from "@/lib/utils/kanban"

type ExtendedTask = Omit<TaskCard, 'phase' | 'createdAt' | 'updatedAt' | 'fatalDate' | 'endDate' | 'publicationDate' | 'protocolDate'> & {
    phase: string
    createdAt: string
    updatedAt: string
    fatalDate: string | null
    endDate: string | null
    publicationDate: string | null
    protocolDate: string | null
    client?: { id: string; name: string } | null
    process?: { id: string; number: string | null; folderName: string | null; type?: string | null } | null
    responsibleLawyer?: { id: string; name: string | null } | null
    tags?: TagType[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

interface TaskDetailModalProps {
    task: ExtendedTask | null
    isOpen: boolean
    onClose: () => void
    users?: { id: string; name: string | null; email: string | null }[]
    clients?: { id: string; name: string }[]
    processes?: { id: string; number: string | null; folderName: string | null; type?: string | null }[]
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

const TASK_TYPE_LABELS: Record<string, string> = {
    'INTERNAL': 'Interna',
    'DEADLINE': 'Prazo',
    'HEARING': 'Audiência',
    'MEETING': 'Reunião'
}

function toDateTimeLocalValue(value: string | null | undefined) {
    if (!value) return ''

    const [datePart, timePart] = value.split('T')
    const normalizedTime = timePart?.slice(0, 5) || '12:00'

    return `${datePart}T${normalizedTime}`
}

export function TaskDetailModal({ task, isOpen, onClose, users, clients, processes }: TaskDetailModalProps) {
    const router = useRouter()

    const [checklistItems, setChecklistItems] = useState<{ id: string; title: string; isCompleted: boolean }[]>([])

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        fatalDate: null as string | null,
        endDate: null as string | null,
        protocolDate: null as string | null,
        publicationDate: null as string | null,
        responsibleLawyerId: null as string | null,
        clientId: null as string | null,
        processId: null as string | null,
        type: 'INTERNAL',
        daysCount: 0,
        daysType: 'BUSINESS',
        practiceArea: 'CIVIL',
        tags: [] as string[]
    })


    // Sync local state with task prop
    useEffect(() => {
        if (task) {
            setChecklistItems(task.checklist || [])
            setEditForm({
                title: task.title,
                description: task.description || '',
                fatalDate: task.fatalDate,
                endDate: task.endDate,
                protocolDate: task.protocolDate,
                publicationDate: task.publicationDate,
                responsibleLawyerId: task.responsibleLawyer?.id || null,
                clientId: task.client?.id || null,
                processId: task.process?.id || null,
                type: task.type || 'INTERNAL',
                daysCount: task.daysCount || 0,
                daysType: task.daysType || 'BUSINESS',
                practiceArea: task.practiceArea || 'CIVIL',
                tags: task.tags?.map(t => t.id) || []
            })
        }
    }, [task])

    if (!task) return null

    const handleSave = async () => {
        try {
            await import('@/lib/actions/kanban-actions').then(mod => mod.updateTaskAction(task.id, {
                ...editForm,
                fatalDate: editForm.fatalDate || null,
                endDate: editForm.endDate || null,
                protocolDate: editForm.protocolDate || null,
                publicationDate: editForm.publicationDate || null,
            }))
            setIsEditing(false)
            onClose()
        } catch {
            console.error('Failed to update task')
        }
    }

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
        } catch {
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

                            {/* Accessible Title Always Rendered */}
                            <DialogTitle className={cn("text-xl font-bold text-slate-800 leading-tight pr-8", isEditing && "sr-only")}>
                                {task.title}
                            </DialogTitle>

                            {isEditing && (
                                <Input
                                    value={editForm.title}
                                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="text-lg font-bold h-10 w-full"
                                    placeholder="Título da Tarefa"
                                    autoFocus
                                />
                            )}

                            {!isEditing && (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Status Badges or Type Selectors */}
                        <div className="flex flex-wrap items-center gap-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Select
                                        value={editForm.type}
                                        onValueChange={(val) => setEditForm(prev => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger className="h-7 w-[130px] text-xs">
                                            <span>{TASK_TYPE_LABELS[editForm.type] || 'Tipo'}</span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={editForm.practiceArea}
                                        onValueChange={(val) => setEditForm(prev => ({ ...prev, practiceArea: val }))}
                                    >
                                        <SelectTrigger className="h-7 w-[130px] text-xs">
                                            <span>{PRACTICE_AREA_LABELS[editForm.practiceArea] || 'Área'}</span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PRACTICE_AREA_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-medium">
                                        {task.phase}
                                    </Badge>
                                    {task.type && (
                                        <Badge variant={task.type === 'DEADLINE' ? 'destructive' : 'secondary'}>
                                            {task.type === 'DEADLINE' ? '⚡ ' : '📋 '}
                                            {TASK_TYPE_LABELS[task.type] || task.type}
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
                                </>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* EDIT MODE FORM */}
                    {isEditing ? (
                        <div className="space-y-4">
                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Prazo Fatal</label>
                                    <Input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(editForm.fatalDate)}
                                        onChange={e => setEditForm(prev => ({ ...prev, fatalDate: e.target.value || null }))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Data Final</label>
                                    <Input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(editForm.endDate)}
                                        onChange={e => setEditForm(prev => ({ ...prev, endDate: e.target.value || null }))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Data Publicação</label>
                                    <Input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(editForm.publicationDate)}
                                        onChange={e => setEditForm(prev => ({ ...prev, publicationDate: e.target.value || null }))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Data Protocolo</label>
                                    <Input
                                        type="datetime-local"
                                        value={toDateTimeLocalValue(editForm.protocolDate)}
                                        onChange={e => setEditForm(prev => ({ ...prev, protocolDate: e.target.value || null }))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Dropdowns Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Responsible */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Responsável</label>
                                    <Select
                                        value={editForm.responsibleLawyerId || undefined}
                                        onValueChange={(val) => setEditForm(prev => ({ ...prev, responsibleLawyerId: val }))}
                                    >
                                        <SelectTrigger className="h-9 text-sm">
                                            <span className="truncate">
                                                {users?.find(u => u.id === editForm.responsibleLawyerId)?.name ||
                                                    users?.find(u => u.id === editForm.responsibleLawyerId)?.email ||
                                                    'Selecionar...'}
                                            </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users && users.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.name || u.email || 'Usuário sem nome'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Client */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Cliente</label>
                                    <Combobox
                                        value={editForm.clientId || ""}
                                        onValueChange={(val) => setEditForm(prev => ({ ...prev, clientId: val || null }))}
                                        options={clients?.map(c => ({ value: c.id, label: c.name })) || []}
                                        placeholder="Selecione..."
                                        searchPlaceholder="Buscar cliente..."
                                        className="h-9 text-sm"
                                    />
                                </div>

                                {/* Process */}
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Processo / Caso</label>
                                    <Combobox
                                        value={editForm.processId || ""}
                                        onValueChange={(val) => setEditForm(prev => ({ ...prev, processId: val || null }))}
                                        options={processes?.map(p => ({
                                            value: p.id,
                                            label: p.folderName ? `${p.folderName} (${p.number || 'S/N'})` : `Processo: ${p.number || 'S/N'}`
                                        })) || []}
                                        placeholder="Vincular processo..."
                                        searchPlaceholder="Buscar processo..."
                                        className="h-9 text-sm"
                                        renderItem={(op) => {
                                            const proc = processes?.find(p => p.id === op.value)
                                            const isCase = proc?.type === 'CASE'
                                            return (
                                                <div className="flex flex-col py-1">
                                                    <span className="font-medium text-sm">{op.label}</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        {isCase ? <Briefcase className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                                                        {isCase ? "Caso / Consultivo" : "Processo Judicial"}
                                                    </span>
                                                </div>
                                            )
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Days Count & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Contagem</label>
                                    <Input
                                        type="number"
                                        value={editForm.daysCount}
                                        onChange={e => setEditForm(prev => ({ ...prev, daysCount: parseInt(e.target.value) || 0 }))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Tipo Dias</label>
                                    <Select
                                        value={editForm.daysType}
                                        onValueChange={(val) => setEditForm(prev => ({ ...prev, daysType: val }))}
                                    >
                                        <SelectTrigger className="h-9 text-sm">
                                            <span>{DAYS_TYPE_LABELS[editForm.daysType] || 'Tipo'}</span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(DAYS_TYPE_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Descrição</label>
                                <Textarea
                                    value={editForm.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full min-h-[120px] p-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    ) : (
                        // VIEW MODE (Existing Layout)
                        <>
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
                                            {formatKanbanDate(task.fatalDate, {
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

                            {/* Descrição Preview */}
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
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">Data Final</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {formatKanbanDate(task.endDate)}
                                        </p>
                                    </div>
                                )}

                                {/* Publication Date */}
                                {task.publicationDate && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">Data Publicação</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {formatKanbanDate(task.publicationDate)}
                                        </p>
                                    </div>
                                )}

                                {/* Protocol Date */}
                                {task.protocolDate && (
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">Data Protocolo</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {formatKanbanDate(task.protocolDate)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Processo Vinculado */}
                            {task.process && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        {task.process.type === 'CASE' ? <Briefcase className="w-4 h-4 text-emerald-600" /> : <Scale className="w-4 h-4 text-blue-600" />}
                                        {task.process.type === 'CASE' ? 'Caso Vinculado' : 'Processo Vinculado'}
                                    </label>
                                    <Button
                                        onClick={handleProcessClick}
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-between gap-3 p-4 h-auto hover:bg-gradient-to-r hover:to-transparent transition-all group rounded-xl",
                                            task.process.type === 'CASE' ? "hover:from-emerald-50 hover:border-emerald-300" : "hover:from-blue-50 hover:border-blue-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm",
                                                task.process.type === 'CASE' ? "from-emerald-500 to-emerald-600" : "from-blue-500 to-blue-600"
                                            )}>
                                                {task.process.type === 'CASE' ? <Briefcase className="w-5 h-5 text-white" /> : <Scale className="w-5 h-5 text-white" />}
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
                        </>
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
                    {isEditing ? (
                        <>
                            <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-lg">
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onClose} variant="outline" className="rounded-lg">
                            Fechar
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
