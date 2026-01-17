'use client'

import { useState } from "react"
import { createCaseAction } from "@/lib/actions/crm-actions"
import { X, Plus, Trash2 } from "lucide-react"

type Props = {
    isOpen: boolean
    onClose: () => void
}

const PRACTICE_AREAS: { value: string; label: string }[] = [
    { value: 'LABOR', label: 'Trabalhista' },
    { value: 'CIVIL', label: 'Cível' },
    { value: 'FAMILY', label: 'Família e Sucessões' },
    { value: 'CRIMINAL', label: 'Criminal' },
    { value: 'SOCIAL_SECURITY', label: 'Previdenciário' },
    { value: 'TAX', label: 'Tributário' },
    { value: 'OTHER', label: 'Outro' },
]

export function CaseModal({ isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const [checklist, setChecklist] = useState<string[]>([])
    const [newCheckItem, setNewCheckItem] = useState("")

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const payload = {
            clientName: formData.get('clientName') as string,
            defendantName: formData.get('defendantName') as string || undefined,
            practiceArea: formData.get('practiceArea') as string,
            deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined,
            description: formData.get('description') as string || undefined,
            checklist: checklist.length > 0 ? checklist : undefined
        }

        try {
            await createCaseAction(payload)
            onClose()
            setChecklist([])
        } catch (error) {
            console.error(error)
            alert("Erro ao criar caso")
        } finally {
            setLoading(false)
        }
    }

    const addCheckItem = () => {
        if (!newCheckItem.trim()) return
        setChecklist([...checklist, newCheckItem])
        setNewCheckItem("")
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
                    <h2 className="text-xl font-bold text-slate-800">Novo Caso (CRM)</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client & Defendant */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente *</label>
                            <input name="clientName" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: João da Silva" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Réu</label>
                            <input name="defendantName" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="Ex: Empresa XYZ Ltda" />
                        </div>
                    </div>

                    {/* Practice Area & Deadline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Área de Atuação *</label>
                            <select name="practiceArea" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
                                {PRACTICE_AREAS.map(area => (
                                    <option key={area.value} value={area.value}>{area.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
                            <input type="date" name="deadline" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <textarea name="description" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none resize-none" placeholder="Detalhes do caso..." />
                    </div>

                    {/* Document Checklist */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Documentos Necessários</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={newCheckItem}
                                onChange={e => setNewCheckItem(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm"
                                placeholder="Ex: RG, CPF, Comprovante de Residência..."
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                            />
                            <button type="button" onClick={addCheckItem} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
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
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50">
                            {loading ? 'Criando...' : 'Criar Caso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
