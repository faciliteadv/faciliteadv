import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ClientService } from "@/lib/services/client-service"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/SearchInput"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreHorizontal, MessageCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h2>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <SearchInput placeholder="Buscar por nome ou CPF..." />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF/CNPJ</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client: any) => (
                            <TableRow key={client.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{client.name}</span>
                                        <span className="text-xs text-slate-500">{client.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{client.cpfCnpj || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs">{client.email}</span>
                                        {client.whatsapp && (
                                            <a
                                                href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
                                            >
                                                <MessageCircle className="h-3 w-3" />
                                                WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        client.status === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-200" :
                                            client.status === 'NEW_LEAD' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                "bg-slate-50 text-slate-700"
                                    }>
                                        {client.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
