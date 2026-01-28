"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { createFinancialRecordAction } from "@/lib/actions/process-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface FinancialRecordFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    processId: string
    clientId: string
    onSuccess: (record: any) => void
}

export function FinancialRecordForm({ open, onOpenChange, processId, clientId, onSuccess }: FinancialRecordFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: "INCOME",
        amount: "",
        dueDate: new Date().toISOString().split('T')[0],
        paidAt: "",
        description: "",
        paymentMethod: "Pix",
        installment: "1/1",
        processId,
        clientId
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.amount || Number(formData.amount.replace(/\D/g, "")) === 0) {
            toast({ title: "Erro", description: "Valor é obrigatório", type: "error" })
            return
        }

        setLoading(true)
        try {
            const result = await createFinancialRecordAction(formData)
            if (result.success) {
                toast({ title: "Sucesso", description: "Lançamento registrado", type: "success" })
                onSuccess(result.record)
                router.refresh()
            }
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, type: "error" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
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
                                onValueChange={(v) => setFormData({ ...formData, amount: v })}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Honorários iniciais"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vencimento</Label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Pagamento (se pago)</Label>
                            <Input
                                type="date"
                                value={formData.paidAt}
                                onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Forma de Pagamento</Label>
                            <Select
                                value={formData.paymentMethod}
                                onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
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
                            <Input
                                value={formData.installment}
                                onChange={(e) => setFormData({ ...formData, installment: e.target.value })}
                                placeholder="Ex: 1/12"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Lançamento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
