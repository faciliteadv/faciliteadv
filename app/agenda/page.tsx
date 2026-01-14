import { AgendaService } from "@/lib/services/agenda-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userId = user.id
    const appointments = await AgendaService.getAppointments(userId)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agenda</h2>
                    <p className="text-slate-500">Seus próximos compromissos e prazos</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" /> Visualizar Mês
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Novo Compromisso
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                {appointments.map((apt) => (
                    <Card key={apt.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg text-slate-900">{apt.title}</span>
                                    <Badge variant="secondary" className={
                                        apt.type === 'HEARING' ? "bg-red-100 text-red-700" :
                                            apt.type === 'DEADLINE' ? "bg-orange-100 text-orange-700" :
                                                "bg-blue-100 text-blue-700"
                                    }>
                                        {apt.type === 'HEARING' ? 'Audiência' : apt.type === 'DEADLINE' ? 'Prazo' : 'Reunião'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    {apt.client?.name && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {apt.client.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 min-w-[150px]">
                                <div className="flex items-center gap-2 font-medium text-slate-700">
                                    <CalendarIcon className="h-4 w-4" />
                                    {format(apt.startAt, "dd 'de' MMMM", { locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Clock className="h-4 w-4" />
                                    {format(apt.startAt, "HH:mm")} - {format(apt.endAt, "HH:mm")}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {appointments.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Nenhum compromisso agendado.
                    </div>
                )}
            </div>
        </div>
    )
}
