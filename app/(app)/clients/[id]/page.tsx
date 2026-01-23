
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ClientService } from "@/lib/services/client-service"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, FileText, Briefcase, DollarSign, Calendar, Edit, Folder, Plus, ChevronRight, Edit2 } from "lucide-react"
import Link from "next/link"
import { ProcessListItem } from "@/components/processes/process-list-item"
import { CopyButton } from "@/components/ui/copy-button"

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
    ARCHIVED: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
    EXTINCT: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
    SUSPENDED: "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200",
    APPEAL: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
    SETTLEMENT: "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-purple-200",
    CONSTRUCTION: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
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

const acquisitionChannelLabels: Record<string, string> = {
    ADS: "Tráfego Pago (Ads)",
    REFERRAL: "Indicação",
    INSTAGRAM: "Instagram",
    GOOGLE: "Google Orgânico",
    OTHER: "Outros"
}

export default async function ClientByTypePage({ params }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { id } = await params
    const client = await ClientService.getById(user.id, id)

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-semibold">Cliente não encontrado</h2>
                <Link href="/clients">
                    <Button variant="link">Voltar para a lista</Button>
                </Link>
            </div>
        )
    }

    // Safely cast address
    const address = client.address as any || {}
    const bankDetails = (client as any).bankDetails || {}

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
                            <CopyButton value={client.name} label="Nome do cliente" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                                {client.status === 'NEW_LEAD' ? 'Novo Lead' : client.status === 'ACTIVE' ? 'Ativo' : client.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground capitalize">• {client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                            {client.acquisitionChannel && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {acquisitionChannelLabels[client.acquisitionChannel] || client.acquisitionChannel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {client.whatsapp && (
                        <a
                            href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp Web
                            </Button>
                        </a>
                    )}
                    <Link href={`/clients/${id}/edit`}>
                        <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none gap-2">
                    <TabsTrigger value="info" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <FileText className="mr-2 h-4 w-4" />
                        Dados Cadastrais
                    </TabsTrigger>
                    <TabsTrigger value="processes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Processos
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border rounded-t-lg px-4 py-2">
                        <Calendar className="mr-2 h-4 w-4" />
                        Atividades
                    </TabsTrigger>
                </TabsList>

                {/* TAB: INFO */}
                <TabsContent value="info" className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Contato e Documentos */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground text-xs font-semibold">Informações Principais</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Row label="Email" value={client.email} />
                                <Row label="CPF/CNPJ" value={client.cpfCnpj} />
                                <Row label="WhatsApp" value={client.whatsapp} />
                                <Separator />
                                <Row label="RG" value={client.rg} />
                                <Row label="CTPS" value={client.ctps} />
                                <Row label="PIS" value={client.pis} />
                            </CardContent>
                        </Card>

                        {/* Endereço */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground text-xs font-semibold">Endereço Completo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm">
                                    <p className="font-medium text-foreground">
                                        {address.street ? `${address.street}, ${address.number}` : "Endereço não cadastrado"}
                                    </p>
                                    {address.complement && <p className="text-muted-foreground">{address.complement}</p>}
                                    {address.neighborhood && (
                                        <p className="text-muted-foreground">
                                            {address.neighborhood} - {address.city}/{address.state}
                                        </p>
                                    )}
                                    {address.zip && <p className="text-muted-foreground">CEP: {address.zip}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Filiação e Dados Sensíveis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground text-xs font-semibold">Dados Adicionais</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Row label="Nome do Pai" value={client.fatherName} />
                                <Row label="Nome da Mãe" value={client.motherName} />
                                <Separator />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Senha GOV.BR</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                            {client.govAccessPassword || "Não cadastrada"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contato de Recado */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground text-xs font-semibold">Contato para Recado</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Row label="Nome" value={client.messageContactName} />
                                <Row label="Vínculo" value={client.messageContactRelation} />
                                <Row label="Telefone" value={(client.contacts as any)?.phone} />
                            </CardContent>
                        </Card>

                        {/* Dados Bancários */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground text-xs font-semibold">Dados Bancários</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Row label="Banco" value={bankDetails.bank} />
                                <Row label="Agência" value={bankDetails.agency} />
                                <Row label="Conta" value={bankDetails.account} />
                                <Separator />
                                <Row label="Tipo PIX" value={bankDetails.pixType?.toUpperCase()} />
                                <Row label="Chave PIX" value={bankDetails.pixKey} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: PROCESSES */}
                <TabsContent value="processes" className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground truncate">Processos Vinculados</h3>
                        <Link href="/processes/new">
                            <Button size="sm" variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" /> Novo Processo
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {client.processes && client.processes.length > 0 ? (
                            client.processes.map((p: any) => (
                                <ProcessListItem
                                    key={p.id}
                                    process={p}
                                    statusColors={statusColors}
                                    statusLabels={statusLabels}
                                    areaLabels={areaLabels}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted rounded-xl bg-muted/5">
                                <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium text-foreground">Nenhum processo vinculado</h3>
                                <p className="text-sm text-muted-foreground mt-1">Este cliente ainda não possui processos cadastrados.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* TAB: FINANCIAL */}
                <TabsContent value="financial" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Funcionalidade em desenvolvimento.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: ACTIVITIES */}
                <TabsContent value="activities" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tarefas Internas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {client.tasks && client.tasks.length > 0 ? (
                                <ul className="space-y-2">
                                    {client.tasks.map((t: any) => (
                                        <li key={t.id} className="p-3 border rounded-lg flex items-center justify-between">
                                            <span className="text-sm font-medium">{t.title}</span>
                                            <Badge variant="outline">{t.phase}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma tarefa pendente.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function Row({ label, value }: { label: string, value?: string | null }) {
    if (!value) return null
    return (
        <div className="flex flex-col group relative">
            <span className="text-xs text-muted-foreground font-medium uppercase">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{value}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton value={value} label={label} />
                </div>
            </div>
        </div>
    )
}
