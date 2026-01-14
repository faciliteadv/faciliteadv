import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Briefcase, CalendarCheck } from "lucide-react"
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

  // Parallel Fetching for Stats
  const [clientCount, processCount, activeTaskCount] = await Promise.all([
    db.client.count({ where: { userId, deletedAt: null } }),
    db.process.count({ where: { userId, deletedAt: null, status: 'ACTIVE' } }),
    db.taskCard.count({ where: { userId, phase: { not: 'PROTOCOLLED' } } })
  ])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processCount}</div>
            <p className="text-xs text-muted-foreground">+2% esse mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
            <p className="text-xs text-muted-foreground">+4 novos essa semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CalendarCheck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTaskCount}</div>
            <p className="text-xs text-muted-foreground">3 prazos fatais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade Geral</CardTitle>
            <Activity className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Ações hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Recent Activity / Agenda Widget here if needed */}
    </div>
  )
}
