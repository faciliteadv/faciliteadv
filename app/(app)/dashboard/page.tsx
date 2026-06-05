import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageContainer } from "@/components/layout/page-container"
import { Users, Briefcase, CalendarCheck, Clock, Plus, UserPlus, FilePlus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

function getDaysUntil(date: Date, todayMs: number): number {
    return Math.ceil((new Date(date).setHours(0, 0, 0, 0) - todayMs) / 86400000)
}

function formatRelativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours < 24) return `há ${diffHours}h`
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7) return `há ${diffDays} dias`
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userId = user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
        clientCount,
        processCount,
        activeTaskCount,
        appointmentsToday,
        fatalDeadlineCount,
        upcomingDeadlines,
        recentProcesses,
        recentClients,
        recentTasks,
    ] = await Promise.all([
        db.client.count({ where: { userId, deletedAt: null } }),
        db.process.count({ where: { userId, deletedAt: null, status: 'ACTIVE' } }),
        db.taskCard.count({ where: { userId, phase: { not: 'PROTOCOLLED' } } }),
        db.appointment.count({ where: { userId, startAt: { gte: today, lt: tomorrow } } }),
        db.taskCard.count({ where: { userId, fatalDate: { not: null }, phase: { not: 'PROTOCOLLED' } } }),
        db.taskCard.findMany({
            where: { userId, fatalDate: { gte: today }, phase: { not: 'PROTOCOLLED' }, isArchived: false },
            select: {
                id: true,
                title: true,
                fatalDate: true,
                client: { select: { name: true } },
                process: { select: { number: true, folderName: true } },
            },
            orderBy: { fatalDate: 'asc' },
            take: 5,
        }),
        db.process.findMany({
            where: { userId, deletedAt: null },
            select: { id: true, number: true, folderName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
        }),
        db.client.findMany({
            where: { userId, deletedAt: null },
            select: { id: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
        }),
        db.taskCard.findMany({
            where: { userId, isArchived: false },
            select: { id: true, title: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
        }),
    ])

    const recentActivity = [
        ...recentProcesses.map(p => ({
            type: 'process' as const,
            id: p.id,
            label: p.folderName || p.number || 'Processo',
            createdAt: p.createdAt,
            href: `/processes/${p.id}`,
        })),
        ...recentClients.map(c => ({
            type: 'client' as const,
            id: c.id,
            label: c.name,
            createdAt: c.createdAt,
            href: `/clients/${c.id}`,
        })),
        ...recentTasks.map(t => ({
            type: 'task' as const,
            id: t.id,
            label: t.title,
            createdAt: t.createdAt,
            href: '/kanban',
        })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6)

    return (
        <PageContainer>
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

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Activity */}
                    <Card className="col-span-4 border border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Atividade Recente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length === 0 ? (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                    Nenhuma atividade recente.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivity.map((item) => {
                                        const icons = {
                                            process: <Briefcase className="h-4 w-4 text-chart-1" />,
                                            client: <Users className="h-4 w-4 text-chart-2" />,
                                            task: <CalendarCheck className="h-4 w-4 text-chart-3" />,
                                        }
                                        const labels = {
                                            process: 'Processo',
                                            client: 'Cliente',
                                            task: 'Tarefa',
                                        }
                                        return (
                                            <Link key={`${item.type}-${item.id}`} href={item.href}>
                                                <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="rounded-full bg-muted p-1.5 shrink-0">
                                                            {icons[item.type]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                                                            <p className="text-xs text-muted-foreground">{labels[item.type]} adicionado</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground shrink-0 ml-3">
                                                        {formatRelativeTime(item.createdAt)}
                                                    </span>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Deadlines */}
                    <Card className="col-span-3 border border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Próximos Prazos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingDeadlines.length === 0 ? (
                                <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                                    <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
                                    Nenhum prazo fatal próximo.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingDeadlines.map((task) => {
                                        const days = getDaysUntil(task.fatalDate!, todayMs)
                                        const dotColor = days <= 3 ? 'bg-destructive' : days <= 7 ? 'bg-yellow-500' : 'bg-chart-1'
                                        const dateLabel = days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' :
                                            new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(task.fatalDate!))
                                        const subtitle = task.process?.folderName || task.process?.number || task.client?.name
                                        return (
                                            <Link key={task.id} href="/kanban">
                                                <div className="flex items-start justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                                                            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className={`text-xs font-medium ${days <= 3 ? 'text-destructive' : days <= 7 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                                                            {dateLabel}
                                                        </span>
                                                        {days <= 3 && (
                                                            <AlertCircle className="h-3 w-3 text-destructive mt-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    )

}
