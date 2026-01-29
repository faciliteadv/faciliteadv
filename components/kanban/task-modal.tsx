'use client'

import { useState, useEffect } from "react"
import { createTaskAction } from "@/lib/actions/kanban-actions"
import { getUsersForResponsibleSelect } from "@/lib/actions/process-actions"
import { X, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type ProcessOption = {
    id: string
    number: string
    folderName: string | null
}

type UserOption = {
    id: string
    name: string | null
    email: string
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
    onTaskCreated?: () => void
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

export function TaskModal({ isOpen, onClose, processes, columns, onTaskCreated }: Props) {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<UserOption[]>([])
    const [checklist, setChecklist] = useState<string[]>([])
    const [newChecklistItem, setNewChecklistItem] = useState("")
    const [taskType, setTaskType] = useState<string>('')
    const [processId, setProcessId] = useState<string>("")
    const [phase, setPhase] = useState<string>(columns.length > 0 ? columns[0].name : "A Fazer")
    const [practiceArea, setPracticeArea] = useState<string>("")
    const [responsibleLawyerId, setResponsibleLawyerId] = useState<string>("")
    const [daysType, setDaysType] = useState<string>("BUSINESS")
    const [points, setPoints] = useState<number>(0)

    useEffect(() => {
        if (isOpen) {
            getUsersForResponsibleSelect().then(setUsers)
        }
    }, [isOpen])

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        if (!taskType) {
            alert("Por favor, selecione o tipo da tarefa")
            setLoading(false)
            return
        }

        const payload = {
            title: formData.get('title') as string,
            description: formData.get('description') as string || undefined,
            type: taskType as 'INTERNAL' | 'DEADLINE',
            phase: phase,
            practiceArea: practiceArea || undefined,
            processId: (processId && processId !== 'NONE') ? processId : undefined,
            publicationDate: formData.get('publicationDate') ? new Date(formData.get('publicationDate') as string) : undefined,
            daysCount: formData.get('daysCount') ? parseInt(formData.get('daysCount') as string) : undefined,
            daysType: (formData.get('daysCount') && daysType) ? daysType as 'BUSINESS' | 'CALENDAR' : undefined,
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
            fatalDate: formData.get('fatalDate') ? new Date(formData.get('fatalDate') as string) : undefined,
            protocolDate: formData.get('protocolDate') ? new Date(formData.get('protocolDate') as string) : undefined,
            responsibleLawyerId: responsibleLawyerId || undefined,
            points: points > 0 ? points : undefined,
            checklist: checklist.length > 0 ? checklist : undefined
        }

        try {
            await createTaskAction(payload)
            // Reset form
            setChecklist([])
            setTaskType('')
            setProcessId('')
            setPracticeArea('')
            setResponsibleLawyerId('')
            setPoints(0)
            setPhase(columns.length > 0 ? columns[0].name : "A Fazer")
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
                            <Select value={phase} onValueChange={setPhase}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col.id} value={col.name}>{col.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Tipo */}
                    <div>
                        <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Tipo <span className="text-red-500">*</span>
                        </Label>
                        <Select value={taskType} onValueChange={setTaskType}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INTERNAL">Atividade Interna</SelectItem>
                                <SelectItem value="DEADLINE">Prazo Processual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Processo e Advogado Responsável */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Processo Vinculado</Label>
                            <Select value={processId} onValueChange={setProcessId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Sem vínculo</SelectItem>
                                    {processes.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.folderName || p.number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <Input type="date" name="publicationDate" className="w-full" />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Dias</Label>
                            <Input type="number" name="daysCount" placeholder="Ex: 15" min="0" className="w-full" />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Dias</Label>
                            <Select value={daysType} onValueChange={setDaysType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BUSINESS">Úteis</SelectItem>
                                    <SelectItem value="CALENDAR">Corridos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Datas: Final, Fatal, Protocolo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Data Final</Label>
                            <Input type="date" name="endDate" className="w-full" />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-red-600 mb-1.5 font-bold">Prazo Fatal</Label>
                            <Input type="date" name="fatalDate" className="w-full border-red-200 focus:ring-red-500" />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Protocolo</Label>
                            <Input type="date" name="protocolDate" className="w-full" />
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
