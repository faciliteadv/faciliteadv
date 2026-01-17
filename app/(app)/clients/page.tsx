import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ClientService } from "@/lib/services/client-service"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/SearchInput"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageCircle, Users } from "lucide-react"
import { ClientActionsMenu } from "@/components/clients/client-actions-menu"

export const dynamic = 'force-dynamic'

const clientStatusLabels: Record<string, string> = {
    ACTIVE: "Ativo",
    NEW_LEAD: "Novo Lead",
    NEGOTIATING: "Negociando",
    CONVERTED: "Convertido",
    INACTIVE: "Inativo"
}

interface PageProps {
    searchParams: Promise<{ search?: string }>
}

export default async function ClientsPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const params = await searchParams
    const search = params.search || undefined
    const userId = user.id
    const clients = await ClientService.getClients(userId, search)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h2>
                    <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e leads.</p>
                </div>
                <Link href="/clients/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <SearchInput placeholder="Buscar por nome ou CPF..." className="max-w-md" />
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-muted/50 border-border">
                            <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Telefone</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-muted/30 border-border transition-colors cursor-pointer" >
                                <TableCell>
                                    <div className="flex flex-col">
                                        <a href={`/clients/${client.id}`} className="font-medium text-foreground hover:underline">{client.name}</a>
                                        <span className="text-xs text-muted-foreground capitalize">{client.type?.toLowerCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {client.whatsapp ? (
                                        <a
                                            href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
                                        >
                                            <MessageCircle className="h-3 w-3" />
                                            {client.whatsapp}
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">{client.email || "-"}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        client.status === 'ACTIVE' ? "bg-green-500/10 text-green-700 border-green-200" :
                                            client.status === 'NEW_LEAD' ? "bg-blue-500/10 text-blue-700 border-blue-200" :
                                                "bg-muted text-muted-foreground border-border"
                                    }>
                                        {clientStatusLabels[client.status] || client.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <ClientActionsMenu clientId={client.id} clientName={client.name} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {clients.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Nenhum cliente encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-1">Tente uma busca diferente ou adicione um novo cliente.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
