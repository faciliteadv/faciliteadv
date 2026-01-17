'use client'

import { useState } from "react"
import { createTaskAction } from "@/lib/actions/kanban-actions"
import { X, Plus, Trash2 } from "lucide-react"

type ProcessOption = {
    id: string
    number: string
    folderName: string | null
}

type Props = {
    isOpen: boolean
    onClose: () => void
    processes: ProcessOption[]
}

export function TaskModal({ isOpen, onClose, processes }: Props) {
    const [loading, setLoading] = useState(false)
    const [checklist, setChecklist] = useState<string[]>([])
    const [newChecklistItem, setNewChecklistItem] = useState("")

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const payload = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as 'INTERNAL' | 'DEADLINE',
            processId: formData.get('processId') as string || undefined,
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
            fatalDate: formData.get('fatalDate') ? new Date(formData.get('fatalDate') as string) : undefined,
            checklist: checklist.length > 0 ? checklist : undefined
        }

        try {
            await createTaskAction(payload)
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Nova Tarefa</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                        <input name="title" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Protocolar Petição Inicial" />
                    </div>

                    {/* Type & Process */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select name="type" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
                                <option value="INTERNAL">Atividade Interna</option>
                                <option value="DEADLINE">Prazo Processual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Processo Vinculado</label>
                            <select name="processId" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
                                <option value="">Sem vínculo</option>
                                {processes.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.folderName || p.number}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Final</label>
                            <input type="date" name="endDate" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-red-600 mb-1 font-bold">Prazo Fatal</label>
                            <input type="date" name="fatalDate" className="w-full px-3 py-2 border border-red-200 rounded-lg outline-none focus:ring-red-500" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Detalhes (Descrição) *</label>
                        <textarea name="description" required rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none resize-none" placeholder="Descreva o que precisa ser feito..." />
                    </div>

                    {/* Checklist */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Checklist</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={newChecklistItem}
                                onChange={e => setNewChecklistItem(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm"
                                placeholder="Adicionar item..."
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                            />
                            <button type="button" onClick={addChecklistItem} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {checklist.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm text-slate-700">
                                    <span>{item}</span>
                                    <button type="button" onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50">
                            {loading ? 'Criando...' : 'Criar Tarefa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
