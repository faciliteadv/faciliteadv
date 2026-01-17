
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ClientService } from "@/lib/services/client-service"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, FileText, Briefcase, DollarSign, Calendar, Edit } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {client.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground capitalize">• {client.type}</span>
                            {client.acquisitionChannel && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {client.acquisitionChannel}
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
                                <Row label="Nome" value={client.messageContactName} />
                                <Row label="Vínculo" value={client.messageContactRelation} />
                                <Row label="Telefone" value={(client.contacts as any)?.phone} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: PROCESSES */}
                <TabsContent value="processes" className="pt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Processos Vinculados</CardTitle>
                                <Link href="/processes/new">
                                    <Button size="sm" variant="outline">Novo Processo</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {client.processes && client.processes.length > 0 ? (
                                <ul className="space-y-2">
                                    {client.processes.map((p: any) => (
                                        <li key={p.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">{p.number}</p>
                                                <p className="text-xs text-muted-foreground">{p.area} • {p.status}</p>
                                            </div>
                                            <Link href={`/processes/${p.id}`}>
                                                <Button variant="ghost" size="sm">Ver</Button>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">Nenhum processo vinculado.</div>
                            )}
                        </CardContent>
                    </Card>
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
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase">{label}</span>
            <span className="text-sm text-foreground">{value}</span>
        </div>
    )
}
