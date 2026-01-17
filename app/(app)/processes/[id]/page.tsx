import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
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
    Folder,
    Calendar,
    CalendarClock
} from "lucide-react"
import Link from "next/link"
import { CopyButton } from "@/components/ui/copy-button"

interface PageProps {
    params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    ARCHIVED: "bg-red-100 text-red-700 border-red-200",
    EXTINCT: "bg-red-100 text-red-700 border-red-200",
    SUSPENDED: "bg-orange-100 text-orange-700 border-orange-200",
    APPEAL: "bg-blue-100 text-blue-700 border-blue-200",
    SETTLEMENT: "bg-purple-100 text-purple-700 border-purple-200",
    CONSTRUCTION: "bg-gray-100 text-gray-700 border-gray-200",
    EXTINCT_WITH_JUDGMENT: "bg-gray-900 text-white border-gray-900"
}

const statusLabels: Record<string, string> = {
    ACTIVE: "Ativo",
    ARCHIVED: "Arquivado",
    EXTINCT: "Extinto",
    SUSPENDED: "Suspenso",
    APPEAL: "Recurso",
    SETTLEMENT: "Acordo",
    CONSTRUCTION: "Construção",
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

export default async function ProcessDetailPage({ params }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { id } = await params
    const process = await db.process.findUnique({
        where: { id, userId: user.id },
        include: { client: true }
    })

    if (!process) {
        notFound()
    }

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
                                <DetailRow label="Assunto" value={process.subject} />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <DetailRow label="Comarca" value={process.district} icon={<MapPin className="h-3 w-3" />} />
                                <DetailRow label="Vara" value={process.court} icon={<Building2 className="h-3 w-3" />} />
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <DetailRow label="Cliente (Nosso Cliente)" value={process.client.name} />
                                    <div className="mt-1"><CopyButton value={process.client.name} label="Nome do Cliente" /></div>
                                </div>
                                <DetailRow label="Posição do Cliente" value={process.position} />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <DetailRow label="Parte Contrária" value={process.opponent} />
                                    {process.opponent && <div className="mt-1"><CopyButton value={process.opponent} label="Nome da Parte Contrária" /></div>}
                                </div>
                                <DetailRow label="Posição da Parte Contrária" value="-" /> {/* Logic handling for opponent position is redundant if we show explicitly in dropdown text, but can be inferred if needed */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agenda Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="h-4 w-4" />
                                Agenda do Processo
                            </CardTitle>
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
                                <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado para este processo.</p>
                            )}
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

                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Próximos Prazos</h3>
                                <p className="text-xs text-muted-foreground">Gerencie prazos na aba Kanban ou Agenda.</p>
                                <Button variant="outline" size="sm" className="mt-2" asChild>
                                    <Link href={`/agenda`}>Ir para Agenda</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
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
