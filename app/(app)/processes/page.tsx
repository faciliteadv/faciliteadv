import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProcessService } from "@/lib/services/process-service"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/SearchInput"
import { Badge } from "@/components/ui/badge"
import { Folder, Plus, ExternalLink, Briefcase, FileText, ChevronRight, Edit2 } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ProcessListItem } from "@/components/processes/process-list-item"

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{ search?: string }>
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

export default async function ProcessesPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const params = await searchParams
    const search = params.search || undefined
    const userId = user.id
    const processes = await ProcessService.listProcesses(userId, search)

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Processos</h2>
                    <p className="text-muted-foreground mt-1">Gerencie seus processos judiciais e extrajudiciais.</p>
                </div>
                <Link href="/processes/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Novo Processo
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <SearchInput placeholder="Buscar por número, pasta ou assunto..." className="max-w-md" />
            </div>

            <div className="space-y-4">
                {processes.map((proc) => (
                    <ProcessListItem
                        key={proc.id}
                        process={proc}
                        statusColors={statusColors}
                        statusLabels={statusLabels}
                        areaLabels={areaLabels}
                    />
                ))}

                {processes.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted rounded-xl bg-muted/5">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Nenhum processo cadastrado</h3>
                        <p className="text-muted-foreground text-sm mt-1">Clique em "Novo Processo" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
