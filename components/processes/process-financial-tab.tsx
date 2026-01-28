"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Plus, Printer, Trash2 } from "lucide-react"
import { FinancialRecord } from "@prisma/client"
import { FinancialRecordForm } from "./financial-record-form"
import { FinancialReceipt } from "./financial-receipt"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ProcessFinancialTabProps {
    processId: string
    clientId: string
    initialRecords: FinancialRecord[]
}

export function ProcessFinancialTab({ processId, clientId, initialRecords }: ProcessFinancialTabProps) {
    const [records, setRecords] = useState<FinancialRecord[]>(initialRecords)
    const [recordFormOpen, setRecordFormOpen] = useState(false)
    const [receiptRecord, setReceiptRecord] = useState<FinancialRecord | null>(null)

    const handleSuccess = (newRecord: FinancialRecord) => {
        setRecords([newRecord, ...records])
        setRecordFormOpen(false)
    }

    const formatCurrency = (value: any) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    }

    return (
        <div className="space-y-6">
            <FinancialRecordForm
                open={recordFormOpen}
                onOpenChange={setRecordFormOpen}
                processId={processId}
                clientId={clientId}
                onSuccess={handleSuccess}
            />

            {receiptRecord && (
                <FinancialReceipt
                    record={receiptRecord}
                    onClose={() => setReceiptRecord(null)}
                />
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Histórico Financeiro
                    </CardTitle>
                    <Button size="sm" onClick={() => setRecordFormOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Novo Lançamento
                    </Button>
                </CardHeader>
                <CardContent>
                    {records.length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Data Venc.</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(record.dueDate), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{record.description || "Sem descrição"}</p>
                                                    {record.installment && (
                                                        <p className="text-[10px] text-muted-foreground uppercase">Parcela: {record.installment}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={record.type === 'INCOME' ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}>
                                                    {record.type === 'INCOME' ? "Receita" : "Despesa"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={record.type === 'INCOME' ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                                {formatCurrency(record.amount)}
                                            </TableCell>
                                            <TableCell>
                                                {record.paidAt ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200 shadow-none">Pago em {format(new Date(record.paidAt), "dd/MM/yyyy")}</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 shadow-none">Pendente</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-blue-600"
                                                        title="Emitir Recibo"
                                                        onClick={() => setReceiptRecord(record)}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                            <DollarSign className="h-10 w-10 mx-auto mb-4 opacity-20" />
                            <p>Nenhum lançamento financeiro encontrado.</p>
                            <p className="text-xs mt-1">Registre honorários, custas ou reembolsos.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
