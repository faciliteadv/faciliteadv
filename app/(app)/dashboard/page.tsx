import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarCheck, Clock, Plus, UserPlus, FilePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userId = user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Parallel Fetching for Stats - all real data
    const [clientCount, processCount, activeTaskCount, appointmentsToday] = await Promise.all([
        db.client.count({ where: { userId, deletedAt: null } }),
        db.process.count({ where: { userId, deletedAt: null, status: 'ACTIVE' } }),
        db.taskCard.count({ where: { userId, phase: { not: 'PROTOCOLLED' } } }),
        db.appointment.count({
            where: {
                userId,
                startAt: { gte: today, lt: tomorrow }
            }
        })
    ])

    // Get fatal deadlines count
    const fatalDeadlineCount = await db.taskCard.count({
        where: {
            userId,
            fatalDate: { not: null },
            phase: { not: 'PROTOCOLLED' }
        }
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h2>
                <p className="text-muted-foreground mt-1">Bem-vindo de volta! Aqui está o resumo do seu escritório.</p>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-4 py-4 overflow-x-auto">
                <Link href="/kanban">
                    <Button variant="outline" className="border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600">
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                    </Button>
                </Link>
                <Link href="/clients/new">
                    <Button variant="outline" className="border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600">
                        <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
                    </Button>
                </Link>
                <Link href="/processes/new">
                    <Button variant="outline" className="border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600">
                        <FilePlus className="mr-2 h-4 w-4" /> Novo Processo
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/processes">
                    <Card className="border-l-4 border-l-chart-1 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Processos Ativos</CardTitle>
                            <Briefcase className="h-4 w-4 text-chart-1" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{processCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">processos em andamento</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/clients">
                    <Card className="border-l-4 border-l-chart-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
                            <Users className="h-4 w-4 text-chart-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{clientCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">clientes cadastrados</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/kanban">
                    <Card className="border-l-4 border-l-chart-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas Pendentes</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-chart-3" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{activeTaskCount}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                {fatalDeadlineCount > 0 ? (
                                    <span className="text-destructive font-medium">{fatalDeadlineCount} com prazo fatal</span>
                                ) : (
                                    'nenhum prazo fatal'
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/agenda">
                    <Card className="border-l-4 border-l-chart-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-slate-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Compromissos Hoje</CardTitle>
                            <Clock className="h-4 w-4 text-chart-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{appointmentsToday}</div>
                            <p className="text-xs text-muted-foreground mt-1">agendados para hoje</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Activity Section Placeholder */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-lg bg-muted/20">
                            Gráfico de Atividade (Em breve)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border border-border shadow-sm">
                    <CardHeader>
                        <CardTitle>Próximos Prazos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-chart-1" />
                                        <span className="text-sm font-medium">Prazo Processual {i + 1}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Amanhã</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
