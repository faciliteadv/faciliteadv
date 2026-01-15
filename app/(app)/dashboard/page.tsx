import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarCheck, Clock } from "lucide-react"
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
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
                <p className="text-slate-500 mt-1">Bem-vindo de volta! Aqui está o resumo do seu escritório.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{processCount}</div>
                        <p className="text-xs text-muted-foreground">processos em andamento</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clientCount}</div>
                        <p className="text-xs text-muted-foreground">clientes cadastrados</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTaskCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {fatalDeadlineCount > 0 ? `${fatalDeadlineCount} com prazo fatal` : 'nenhum prazo fatal'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compromissos Hoje</CardTitle>
                        <Clock className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointmentsToday}</div>
                        <p className="text-xs text-muted-foreground">agendados para hoje</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
