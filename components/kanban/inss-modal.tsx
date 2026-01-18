'use client'

import { useState } from "react"
import { createINSSCaseAction } from "@/lib/actions/crm-actions"
import { X, Plus, Trash2 } from "lucide-react"
import { formatCPF, validateCPF } from "@/lib/utils/validation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Props = {
    isOpen: boolean
    onClose: () => void
}

const INSS_ACTION_TYPES: { value: string; label: string }[] = [
    { value: 'MATERNITY_ASSISTANCE', label: 'Auxílio Maternidade' },
    { value: 'RETIREMENT_AGE', label: 'Aposentadoria por Idade' },
    { value: 'RETIREMENT_CONTRIBUTION', label: 'Aposentadoria por Tempo de Contribuição' },
    { value: 'DISABILITY_RETIREMENT', label: 'Aposentadoria por Invalidez' },
    { value: 'SICKNESS_BENEFIT', label: 'Auxílio Doença' },
    { value: 'ACCIDENT_AID', label: 'Auxílio Acidente' },
    { value: 'BPC_LOAS', label: 'BPC/LOAS' },
    { value: 'REVIEW', label: 'Revisão de Benefício' },
    { value: 'OTHER', label: 'Outro' },
]

const DEFAULT_DOCUMENTS = [
    "RG",
    "CPF",
    "Comprovante de Residência",
    "Carteira de Trabalho (CTPS)",
    "Laudos Médicos",
    "Declaração de Último Emprego",
    "Procuração",
]

export function INSSModal({ isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const [checklist, setChecklist] = useState<string[]>([])
    const [newCheckItem, setNewCheckItem] = useState("")
    const [cpf, setCpf] = useState("")
    const [cpfError, setCpfError] = useState("")
    const [actionType, setActionType] = useState<string>(INSS_ACTION_TYPES[0].value)

    if (!isOpen) return null

    const handleCpfChange = (value: string) => {
        const formatted = formatCPF(value)
        setCpf(formatted)

        // Validate when complete
        if (formatted.replace(/\D/g, '').length === 11) {
            if (!validateCPF(formatted)) {
                setCpfError("CPF inválido")
            } else {
                setCpfError("")
            }
        } else {
            setCpfError("")
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        // Validate CPF before submit
        if (cpf && !validateCPF(cpf)) {
            setCpfError("CPF inválido")
            return
        }

        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const payload = {
            clientName: formData.get('clientName') as string,
            clientCpf: cpf || undefined,
            govPassword: formData.get('govPassword') as string || undefined,
            actionType: actionType,
            deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined,
            description: formData.get('description') as string || undefined,
            checklist: checklist.length > 0 ? checklist : undefined
        }

        try {
            await createINSSCaseAction(payload)
            onClose()
            setChecklist([])
            setCpf("")
        } catch (error) {
            console.error(error)
            alert("Erro ao criar caso INSS")
        } finally {
            setLoading(false)
        }
    }

    const addCheckItem = () => {
        if (!newCheckItem.trim()) return
        setChecklist([...checklist, newCheckItem])
        setNewCheckItem("")
    }

    const addDefaultDoc = (doc: string) => {
        if (!checklist.includes(doc)) {
            setChecklist([...checklist, doc])
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                    <h2 className="text-xl font-bold text-slate-800">Novo Caso INSS</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente *</label>
                        <input name="clientName" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Maria José Santos" />
                    </div>

                    {/* CPF & GOV Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                            <input
                                value={cpf}
                                onChange={(e) => handleCpfChange(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg outline-none font-mono ${cpfError ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
                                    } focus:ring-2`}
                                placeholder="000.000.000-00"
                                maxLength={14}
                            />
                            {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha GOV.BR</label>
                            <input name="govPassword" type="password" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                        </div>
                    </div>

                    {/* Action Type & Deadline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ação *</Label>
                            <Select value={actionType} onValueChange={setActionType}>
                                <SelectTrigger className="w-full bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {INSS_ACTION_TYPES.map(action => (
                                        <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
                            <input type="date" name="deadline" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição da Atividade</label>
                        <textarea name="description" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-indigo-500" placeholder="Detalhes do caso..." />
                    </div>

                    {/* Document Checklist */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Documentos Necessários</label>

                        <div className="flex flex-wrap gap-1 mb-3">
                            {DEFAULT_DOCUMENTS.map(doc => (
                                <button
                                    key={doc}
                                    type="button"
                                    onClick={() => addDefaultDoc(doc)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${checklist.includes(doc)
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50'
                                        }`}
                                >
                                    + {doc}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 mb-3">
                            <input
                                value={newCheckItem}
                                onChange={e => setNewCheckItem(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="Adicionar documento personalizado..."
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
                        <button type="submit" disabled={loading || !!cpfError} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50">
                            {loading ? 'Criando...' : 'Criar Caso INSS'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
