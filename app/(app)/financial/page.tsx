import { requirePermission } from "@/lib/auth/require-permission"
import { hasPermission } from "@/lib/permissions"
import { FinancialService } from "@/lib/services/financial-service"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingUp, AlertTriangle, Check } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { db } from "@/lib/db"
import { FinancialNewButton } from "@/components/financial/financial-new-button"

export const dynamic = 'force-dynamic'

export default async function FinancialPage() {
    const { user, wsData, permissions } = await requirePermission('financial:read')
    const workspaceId = wsData.workspace.id
    const canWrite = hasPermission(permissions, 'financial:write')

    const [records, summary, clients] = await Promise.all([
        FinancialService.listRecords(workspaceId),
        FinancialService.getSummary(workspaceId),
        db.client.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { workspaceId },
                    { userId: user.id, workspaceId: null },
                ]
            },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
    ])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
    }

    return (
        <PageContainer>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Financeiro</h2>
                    {canWrite && <FinancialNewButton clients={clients} />}
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-yellow-100 p-3">
                                <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pendente</p>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalPending)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-green-100 p-3">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Recebido</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalReceived)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-red-100 p-3">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Vencido</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Processo</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record) => {
                                const isOverdue = !record.paidAt && new Date(record.dueDate) < new Date()
                                return (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.client?.name}</TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {record.description || record.type}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-slate-500">
                                            {record.process?.number || "-"}
                                        </TableCell>
                                        <TableCell className={isOverdue ? "text-red-600 font-medium" : ""}>
                                            {formatDate(record.dueDate)}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(Number(record.amount))}
                                        </TableCell>
                                        <TableCell>
                                            {record.paidAt ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                                    <Check className="h-3 w-3 mr-1" /> Pago
                                                </Badge>
                                            ) : isOverdue ? (
                                                <Badge variant="destructive">Vencido</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    Pendente
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {records.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                        Nenhum lançamento financeiro encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </PageContainer>
    )
}
