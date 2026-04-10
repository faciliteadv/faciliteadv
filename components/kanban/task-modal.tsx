'use client'

import { useState, useEffect } from "react"
import { createTaskAction } from "@/lib/actions/kanban-actions"
import { getUsersForResponsibleSelect } from "@/lib/actions/process-actions"
import { X, Plus, Trash2, Briefcase, Scale } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { parseDateInputToDate } from "@/lib/utils/kanban"

type ProcessOption = {
    id: string
    number: string | null
    folderName: string | null
    type?: string | null
}

type UserOption = {
    id: string
    name: string | null
    email: string
}

type ClientOption = {
    id: string
    name: string
}

type ColumnOption = {
    id: string
    name: string
}

type Props = {
    isOpen: boolean
    onClose: () => void
    processes: ProcessOption[]
    columns: ColumnOption[]
    clients?: ClientOption[]
    onTaskCreated?: () => void
    defaultProcessId?: string
    defaultPhase?: string
}

const PRACTICE_AREAS = [
    { value: 'LABOR', label: 'Trabalhista' },
    { value: 'CIVIL', label: 'Cível' },
    { value: 'FAMILY', label: 'Família e Sucessões' },
    { value: 'CRIMINAL', label: 'Criminal' },
    { value: 'HEALTH', label: 'Saúde' },
    { value: 'CONSUMER', label: 'Consumidor' },
    { value: 'TAX', label: 'Tributário' },
    { value: 'SOCIAL_SECURITY', label: 'Previdenciário' },
    { value: 'OTHER', label: 'Outro' }
]

export function TaskModal({ isOpen, onClose, processes, columns, clients, onTaskCreated, defaultProcessId, defaultPhase }: Props) {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<UserOption[]>([])
    const [checklist, setChecklist] = useState<string[]>([])
    const [newChecklistItem, setNewChecklistItem] = useState("")

    const [processId, setProcessId] = useState<string>("")
    const [clientId, setClientId] = useState<string>("")
    const [columnId, setColumnId] = useState<string>(columns.length > 0 ? columns[0].id : "")
    const [practiceArea, setPracticeArea] = useState<string>("")
    const [responsibleLawyerId, setResponsibleLawyerId] = useState<string>("")
    const [daysType, setDaysType] = useState<string>("")  // Default empty for "Selecione"
    const [points, setPoints] = useState<number>(0)

    // Controlled date states for automatic calculation
    const [publicationDate, setPublicationDate] = useState<string>("")
    const [daysCount, setDaysCount] = useState<string>("")
    const [fatalDate, setFatalDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [protocolDate, setProtocolDate] = useState<string>("")

    // Function to add business days (skip weekends)
    const addBusinessDays = (startDate: Date, days: number): Date => {
        const result = new Date(startDate)
        let added = 0
        while (added < days) {
            result.setDate(result.getDate() + 1)
            const dayOfWeek = result.getDay()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
                added++
            }
        }
        return result
    }

    // Function to add calendar days
    const addCalendarDays = (startDate: Date, days: number): Date => {
        const result = new Date(startDate)
        result.setDate(result.getDate() + days)
        return result
    }

    // Function to subtract calendar days (for end date = fatal - 2)
    const subtractCalendarDays = (startDate: Date, days: number): Date => {
        const result = new Date(startDate)
        result.setDate(result.getDate() - days)
        return result
    }

    // Auto-calculate fatalDate and endDate when publicationDate, daysCount, daysType change
    useEffect(() => {
        if (publicationDate && daysCount && daysType && parseInt(daysCount) > 0) {
            const pubDate = new Date(publicationDate + 'T12:00:00') // Avoid timezone issues
            const days = parseInt(daysCount)

            // Calculate fatal date based on days type
            let calculatedFatalDate: Date
            if (daysType === 'BUSINESS') {
                calculatedFatalDate = addBusinessDays(pubDate, days)
            } else {
                calculatedFatalDate = addCalendarDays(pubDate, days)
            }

            // End date is always 2 calendar days before fatal date
            const calculatedEndDate = subtractCalendarDays(calculatedFatalDate, 2)

            // Format as YYYY-MM-DD for input[type="date"]
            setFatalDate(calculatedFatalDate.toISOString().split('T')[0])
            setEndDate(calculatedEndDate.toISOString().split('T')[0])
        }
    }, [publicationDate, daysCount, daysType])

    // Reset form state when modal opens
    useEffect(() => {
        if (isOpen) {
            getUsersForResponsibleSelect().then(setUsers)
            // Reset to defaults
            setProcessId(defaultProcessId || "")
            setClientId("")
            setColumnId(defaultPhase ? (columns.find(c => c.name === defaultPhase)?.id || columns[0]?.id || "") : (columns.length > 0 ? columns[0].id : ""))
            setPracticeArea("")
            setResponsibleLawyerId("")
            setDaysType("") // Empty = "Selecione"
            setPoints(0)
            setChecklist([])
            setNewChecklistItem("")
            // Reset date fields
            setPublicationDate("")
            setDaysCount("")
            setFatalDate("")
            setEndDate("")
            setProtocolDate("")
        }
    }, [isOpen, defaultPhase, defaultProcessId, columns])

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)



        const selectedColumn = columns.find(c => c.id === columnId)
        const payload = {
            title: formData.get('title') as string,
            description: formData.get('description') as string || undefined,
            type: 'INTERNAL' as const,
            columnId: columnId,
            phase: selectedColumn?.name || 'A Fazer',
            practiceArea: practiceArea || undefined,
            processId: (processId && processId !== 'NONE') ? processId : undefined,
            clientId: (clientId && clientId !== 'NONE') ? clientId : undefined,
            publicationDate: publicationDate ? parseDateInputToDate(publicationDate) ?? undefined : undefined,
            daysCount: daysCount ? parseInt(daysCount) : undefined,
            daysType: (daysCount && daysType) ? daysType as 'BUSINESS' | 'CALENDAR' : undefined,
            endDate: endDate ? parseDateInputToDate(endDate) ?? undefined : undefined,
            fatalDate: fatalDate ? parseDateInputToDate(fatalDate) ?? undefined : undefined,
            protocolDate: protocolDate ? parseDateInputToDate(protocolDate) ?? undefined : undefined,
            responsibleLawyerId: responsibleLawyerId || undefined,
            points: points > 0 ? points : undefined,
            checklist: checklist.length > 0 ? checklist : undefined
        }

        try {
            await createTaskAction(payload)
            // Reset form
            setChecklist([])

            setProcessId('')
            setClientId('')
            setPracticeArea('')
            setResponsibleLawyerId('')
            setPoints(0)
            setColumnId(columns.length > 0 ? columns[0].id : "")
            onTaskCreated?.()
            onClose()
        } catch (error) {
            console.error(error)
            alert("Erro ao criar tarefa")
        } finally {
            setLoading(false)
        }
    }

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return
        setChecklist([...checklist, newChecklistItem])
        setNewChecklistItem("")
    }

    const removeChecklistItem = (index: number) => {
        setChecklist(checklist.filter((_, i) => i !== index))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800">Nova Tarefa</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Título */}
                    <div>
                        <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Título <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            name="title"
                            required
                            placeholder="Nome da tarefa"
                            className="w-full"
                        />
                    </div>

                    {/* Setor de Atuação e Situação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Setor de Atuação</Label>
                            <Select value={practiceArea} onValueChange={setPracticeArea}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRACTICE_AREAS.map(area => (
                                        <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Situação (Fase) <span className="text-red-500">*</span>
                            </Label>
                            <Select value={columnId} onValueChange={setColumnId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>



                    {/* Processo e Advogado Responsável */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</Label>
                            <Combobox
                                value={clientId}
                                onValueChange={setClientId}
                                options={clients?.map(c => ({ value: c.id, label: c.name })) || []}
                                placeholder="Selecione..."
                                searchPlaceholder="Buscar cliente..."
                            />
                        </div>

                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Processo Vinculado</Label>
                            <Combobox
                                value={processId}
                                onValueChange={setProcessId}
                                options={processes.map(p => ({
                                    value: p.id,
                                    label: p.folderName ? `${p.folderName} (${p.number || 'S/N'})` : `Processo: ${p.number || 'S/N'}`
                                }))}
                                placeholder="Selecione..."
                                searchPlaceholder="Buscar processo..."
                                renderItem={(op) => {
                                    const proc = processes.find(p => p.id === op.value)
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

                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Advogado Responsável</Label>
                            <Select value={responsibleLawyerId} onValueChange={setResponsibleLawyerId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Nenhum</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name || user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <Label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</Label>
                        <textarea
                            name="description"
                            placeholder="Descrição da atividade (opcional)"
                            className="w-full min-h-[80px] px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Data de Publicação, Dias e Tipo de Dias */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Publicação</Label>
                            <Input
                                type="date"
                                value={publicationDate || ''}
                                onChange={(e) => setPublicationDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Dias</Label>
                            <Input
                                type="number"
                                value={daysCount || ''}
                                onChange={(e) => setDaysCount(e.target.value)}
                                placeholder="Ex: 15"
                                min="0"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Dias</Label>
                            <Select value={daysType} onValueChange={setDaysType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BUSINESS">Úteis</SelectItem>
                                    <SelectItem value="CALENDAR">Corridos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Datas: Final, Fatal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Data Final
                                {endDate && <span className="ml-2 text-xs text-emerald-600">(calculado)</span>}
                            </Label>
                            <Input
                                type="date"
                                value={endDate || ''}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border-emerald-200 bg-emerald-50/30"
                            />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-red-600 mb-1.5 font-bold">
                                Prazo Fatal
                                {fatalDate && publicationDate && daysCount && <span className="ml-2 text-xs font-normal">(calculado)</span>}
                            </Label>
                            <Input
                                type="date"
                                value={fatalDate || ''}
                                onChange={(e) => setFatalDate(e.target.value)}
                                className="w-full border-red-200 focus:ring-red-500 bg-red-50/30"
                            />
                        </div>
                    </div>

                    {/* Pontos */}
                    <div>
                        <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Pontos da Tarefa (0-5)
                        </Label>
                        <div className="flex gap-2">
                            {[0, 1, 2, 3, 4, 5].map(value => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setPoints(value)}
                                    className={`px-4 py-2 rounded-lg border-2 transition ${points === value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Quem completar a tarefa receberá esses pontos
                        </p>
                    </div>

                    {/* Checklist */}
                    <div>
                        <Label className="block text-sm font-medium text-slate-700 mb-2">Checklist</Label>
                        <div className="space-y-2">
                            {checklist.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                    <span className="flex-1 text-sm text-slate-700">{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeChecklistItem(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    value={newChecklistItem}
                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                    placeholder="Adicionar item..."
                                    className="flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={addChecklistItem}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : 'Criar Tarefa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
