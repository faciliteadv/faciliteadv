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
    Calendar
} from "lucide-react"
import Link from "next/link"

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
    CONSTRUCTION: "bg-gray-100 text-gray-700 border-gray-200"
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
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
                        </p>
                    </div>
                </div>
                <Link href={`/processes/${id}/edit`}>
                    <Button className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Editar Processo
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                Detalhes Jurídicos
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
                                        <a
                                            href={process.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-2 text-sm font-medium"
                                        >
                                            Acessar sistema do tribunal <ExternalLink className="h-4 w-4" />
                                        </a>
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
                                <DetailRow label="Cliente (Nosso Cliente)" value={process.client.name} />
                                <DetailRow label="Posição do Cliente" value={process.position === "AUTOR" ? "Autor" : "Réu"} />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <DetailRow label="Parte Contrária" value={process.opponent} />
                                <DetailRow label="Posição da Parte Contrária" value={process.position === "AUTOR" ? "Réu" : "Autor"} />
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

                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">Próximos Prazos</h3>
                                <p className="text-xs text-muted-foreground">Nenhum prazo agendado para este processo.</p>
                                <Button variant="outline" size="sm" className="mt-2">Agendar Prazo</Button>
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
