import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ProcessService } from "@/lib/services/process-service"
import { getFinancialRecordsByProcessId } from "@/lib/actions/process-actions"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Edit2,
    ExternalLink,
    Scale,
    FileText,
    MapPin,
    Building2,
    User2,
    Calendar,
    CalendarClock,
    DollarSign,
    ListTodo,
    Plus,
    Folder
} from "lucide-react"
import Link from "next/link"
import { CopyButton } from "@/components/ui/copy-button"
import { ProcessFinancialTab } from "@/components/processes/process-financial-tab"

interface PageProps {
    params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
    SUSPENDED: "bg-red-100 text-red-700 border-red-200",
    SENTENCED: "bg-green-100 text-green-900 border-green-900",
    APPEAL: "bg-red-100 text-red-900 border-red-900",
    EXECUTION: "bg-green-100 text-green-600 border-green-400",
    EXTINCT_WITH_MERIT: "bg-blue-100 text-blue-900 border-blue-900",
    EXTINCT_WITHOUT_MERIT: "bg-red-100 text-red-600 border-red-600",
    WITHDRAWAL: "bg-gray-100 text-gray-500 border-gray-500",
    CONSTRUCTION: "bg-gray-100 text-gray-700 border-gray-200",
    ARCHIVED: "bg-gray-100 text-gray-600 border-gray-300",
    SETTLEMENT: "bg-purple-100 text-purple-700 border-purple-200",
}

const statusLabels: Record<string, string> = {
    ACTIVE: "Em andamento",
    SUSPENDED: "Suspenso",
    SENTENCED: "Sentenciado",
    APPEAL: "Em recurso",
    EXECUTION: "Em execução",
    EXTINCT_WITH_MERIT: "Extinto com resolução de mérito",
    EXTINCT_WITHOUT_MERIT: "Extinto sem resolução de mérito",
    WITHDRAWAL: "Desistência do processo pelo cliente",
    CONSTRUCTION: "Construção",
    ARCHIVED: "Arquivado",
    SETTLEMENT: "Acordo",
    EXTINCT: "Extinto",
    EXTINCT_WITH_JUDGMENT: "Extinto com Julgamento"
}

const areaLabels: Record<string, string> = {
    TRABALHISTA: "Trabalhista",
    CIVIL: "Cível",
    FAMILIA: "Família e Sucessões",
    EMPRESARIAL: "Empresarial",
    TRIBUTARIO: "Tributário",
    ADMINISTRATIVO: "Administrativo",
    PREVIDENCIARIO: "Previdenciário",
    INSS_ADMIN: "INSS Administrativo",
    DIGITAL: "Direito Digital"
}

const positionLabels: Record<string, string> = {
    AUTOR: "Autor",
    REU: "Réu",
    RECLAMANTE: "Reclamante",
    RECLAMADA: "Reclamada",
    REQUERENTE: "Requerente",
    REQUERIDO: "Requerido",
    REPRESENTANTE: "Representante Legal",
    TERCEIRO: "Terceiro Interessado",
    OUTRO: "Outro"
}

function getOppositePosition(position?: string) {
    if (!position) return "-"
    const pos = position.toUpperCase()
    if (pos === "AUTOR") return "Réu"
    if (pos === "REU") return "Autor"
    if (pos === "RECLAMANTE") return "Reclamada"
    if (pos === "RECLAMADA") return "Reclamante"
    if (pos === "REQUERENTE") return "Requerido"
    if (pos === "REQUERIDO") return "Requerente"
    return positionLabels[pos] || position
}

export default async function ProcessDetailPage({ params }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { id } = await params
    const process = await ProcessService.getById(user.id, id) as any

    if (!process) {
        notFound()
    }

    const financialRecords = await getFinancialRecordsByProcessId(id)

    // Fetch appointments (Agenda)
    const appointments = await db.appointment.findMany({
        where: { processId: id, userId: user.id },
        orderBy: { startAt: 'asc' }
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/processes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {process.folderName || "Processo"}
                            </h1>
                            <Badge variant="outline" className={`${statusColors[process.status] || "bg-gray-100 text-gray-700"} border-0 font-medium`}>
                                {statusLabels[process.status] || process.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {process.number}
                            <CopyButton value={process.number} label="Número do Processo" />
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/processes/${id}/edit`}>
                        <Button className="gap-2">
                            <Edit2 className="h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none gap-2">
                    <TabsTrigger value="info" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <FileText className="mr-2 h-4 w-4" />
                        Informações
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Agenda e Prazos
                    </TabsTrigger>
                </TabsList>

                {/* TAB: INFO */}
                <TabsContent value="info" className="pt-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Scale className="h-4 w-4" />
                                        Detalhes do Processo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow label="Área de Atuação" value={areaLabels[process.area] || process.area} />
                                        <DetailRow label="Tipo de ação" value={process.actionType} />
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow label="Comarca" value={process.district} icon={<MapPin className="h-3 w-3" />} />
                                        <DetailRow label="Vara" value={process.court} icon={<Building2 className="h-3 w-3" />} />
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailRow
                                            label="Valor da Causa"
                                            value={process.claimValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(process.claimValue)) : "-"}
                                        />
                                    </div>
                                    {process.link && (
                                        <>
                                            <Separator />
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground font-medium uppercase">Link do Processo</span>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={process.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline flex items-center gap-2 text-sm font-medium"
                                                    >
                                                        Acessar sistema do tribunal <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                    <CopyButton value={process.link} label="Link" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <User2 className="h-4 w-4" />
                                        Partes do Processo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <DetailRow label="Cliente principal" value={process.client.name} />
                                                <div className="mt-1"><CopyButton value={process.client.name} label="Nome do Cliente" /></div>
                                            </div>
                                            <DetailRow label="Posição" value={positionLabels[process.position?.toUpperCase() || ""] || process.position} />
                                        </div>

                                        {process.authors && process.authors.length > 0 && (
                                            <div className="pl-4 border-l-2 border-blue-50 space-y-3">
                                                <p className="text-[10px] font-bold uppercase text-blue-400">Outras partes autoras / representantes</p>
                                                {process.authors.map((author: any) => (
                                                    <div key={author.id} className="grid grid-cols-2 gap-4">
                                                        <div className="mt-1"><CopyButton value={author.client?.name || ""} label="Nome" /></div>
                                                        <p className="text-sm text-muted-foreground">{author.position ? (positionLabels[author.position.toUpperCase()] || author.position) : "-"}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <DetailRow label="Parte Contrária principal" value={process.opponentName || process.opponent} />
                                                {process.opponent && <div className="mt-1"><CopyButton value={process.opponentName || process.opponent || ""} label="Nome da Parte Contrária" /></div>}
                                            </div>
                                            <DetailRow
                                                label="Posição"
                                                value={getOppositePosition(process.position)}
                                            />
                                        </div>

                                        {process.opponents && process.opponents.length > 0 && (
                                            <div className="pl-4 border-l-2 border-red-50 space-y-3">
                                                <p className="text-[10px] font-bold uppercase text-red-300">Outras partes contrárias / interessados</p>
                                                {process.opponents.map((opp: any) => (
                                                    <div key={opp.id} className="grid grid-cols-2 gap-4">
                                                        <div className="mt-1"><CopyButton value={opp.name} label="Nome" /></div>
                                                        <p className="text-sm text-muted-foreground">{opp.position ? (positionLabels[opp.position.toUpperCase()] || opp.position) : "-"}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Folder className="h-4 w-4" />
                                        Arquivos e Controle
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <DetailRow label="Nome da Pasta" value={process.folderName} />
                                    <DetailRow label="Data de Criação" value={new Date(process.createdAt).toLocaleDateString('pt-BR')} />
                                    <DetailRow label="Última Atualização" value={new Date(process.updatedAt).toLocaleDateString('pt-BR')} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB: FINANCIAL */}
                <TabsContent value="financial" className="pt-6">
                    <ProcessFinancialTab
                        processId={id}
                        initialRecords={JSON.parse(JSON.stringify(financialRecords))}
                        clientId={process.clientId}
                    />
                </TabsContent>

                {/* TAB: AGENDA & PRAZOS */}
                <TabsContent value="agenda" className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Agenda Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4" />
                                    Compromissos da Agenda
                                </CardTitle>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Novo Evento
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {appointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {appointments.map(apt => (
                                            <div key={apt.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-sm">{apt.title}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(apt.startAt).toLocaleString('pt-BR')}</p>
                                                    {apt.description && <p className="text-xs text-slate-500 mt-1">{apt.description}</p>}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px]">{apt.type}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        <p>Nenhum agendamento para este processo.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Prazos/Tarefas Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <ListTodo className="h-4 w-4" />
                                    Prazos e Tarefas
                                </CardTitle>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Novo Prazo
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {process.tasks && process.tasks.length > 0 ? (
                                    <div className="space-y-4">
                                        {process.tasks.map((task: any) => (
                                            <div key={task.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-sm">{task.title}</p>
                                                    {task.fatalDate && (
                                                        <p className="text-xs text-red-600 font-medium">Prazo Fatal: {new Date(task.fatalDate).toLocaleDateString('pt-BR')}</p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground">Status: {task.phase}</p>
                                                </div>
                                                <Badge variant="outline" className="text-[10px]">{task.type}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        <p>Nenhuma tarefa ou prazo vinculado.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function DetailRow({ label, value, icon }: { label: string, value?: string | null, icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                {icon}
                {label}
            </span>
            <span className="text-sm font-medium text-foreground">{value || "-"}</span>
        </div>
    )
}
