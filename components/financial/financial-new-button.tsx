'use client'

import { useState } from 'react'
import { Plus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MoneyInput } from '@/components/ui/money-input'
import { createFinancialRecordAction } from '@/lib/actions/process-actions'
import { useRouter } from 'next/navigation'

type Client = { id: string; name: string }

export function FinancialNewButton({ clients }: { clients: Client[] }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
            </Button>
            <FinancialStandaloneForm
                open={open}
                onOpenChange={setOpen}
                clients={clients}
                onSuccess={() => {
                    setOpen(false)
                    router.refresh()
                }}
            />
        </>
    )
}

function FinancialStandaloneForm({
    open,
    onOpenChange,
    clients,
    onSuccess,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    clients: Client[]
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        clientId: '',
        type: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        paidAt: '',
        description: '',
        paymentMethod: 'Pix',
        installment: '1/1',
        processId: '',
    })

    function set(field: string, value: string) {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!formData.clientId) { setError('Selecione um cliente'); return }
        if (!formData.type) { setError('Selecione o tipo'); return }
        if (!formData.amount || Number(formData.amount.replace(/\D/g, '')) === 0) { setError('Informe o valor'); return }

        setLoading(true)
        try {
            const payload = {
                ...formData,
                processId: formData.processId || null,
            }
            const result = await createFinancialRecordAction(payload)
            if (result.success) {
                setFormData({
                    clientId: '', type: '', amount: '',
                    dueDate: new Date().toISOString().split('T')[0],
                    paidAt: '', description: '', paymentMethod: 'Pix', installment: '1/1', processId: ''
                })
                onSuccess()
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <Select value={formData.clientId} onValueChange={v => set('clientId', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Select value={formData.type} onValueChange={v => set('type', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INCOME">Receita</SelectItem>
                                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor *</Label>
                            <MoneyInput
                                value={formData.amount}
                                onValueChange={v => set('amount', v)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Ex: Honorários iniciais"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vencimento</Label>
                            <Input type="date" value={formData.dueDate} onChange={e => set('dueDate', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Pagamento</Label>
                            <Input type="date" value={formData.paidAt} onChange={e => set('paidAt', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Forma de Pagamento</Label>
                            <Select value={formData.paymentMethod} onValueChange={v => set('paymentMethod', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="Pix">Pix</SelectItem>
                                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                                    <SelectItem value="Transferência">Transferência</SelectItem>
                                    <SelectItem value="Boleto">Boleto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Parcela</Label>
                            <Input value={formData.installment} onChange={e => set('installment', e.target.value)} placeholder="Ex: 1/12" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Lançamento
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
