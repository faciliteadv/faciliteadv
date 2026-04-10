import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProcessService } from "@/lib/services/process-service"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/SearchInput"
import { Plus, Briefcase } from "lucide-react"
import Link from "next/link"
import { ProcessListItem } from "@/components/processes/process-list-item"
import { PageContainer } from "@/components/layout/page-container"
import { ProcessStatusFilter } from "@/components/processes/process-status-filter"

export const dynamic = "force-dynamic"

interface PageProps {
    searchParams: Promise<{ search?: string, status?: string }>
}

const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
    SUSPENDED: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
    SENTENCED: "bg-green-100 text-green-900 hover:bg-green-100/80 border-green-900",
    APPEAL: "bg-red-100 text-red-900 hover:bg-red-100/80 border-red-900",
    EXECUTION: "bg-green-100 text-green-600 hover:bg-green-100/80 border-green-400",
    EXTINCT_WITH_MERIT: "bg-blue-100 text-blue-900 hover:bg-blue-100/80 border-blue-900",
    EXTINCT_WITHOUT_MERIT: "bg-red-100 text-red-600 hover:bg-red-100/80 border-red-600",
    WITHDRAWAL: "bg-gray-100 text-gray-500 hover:bg-gray-100/80 border-gray-500",
    CONSTRUCTION: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200",
    ARCHIVED: "bg-gray-100 text-gray-600 hover:bg-gray-100/80 border-gray-300",
    SETTLEMENT: "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-purple-200",
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
    EXTINCT_WITH_JUDGMENT: "Extinto com Julgamento",
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
    DIGITAL: "Direito Digital",
}

const filterableStatuses = [
    "ACTIVE",
    "SENTENCED",
    "APPEAL",
    "EXECUTION",
    "SUSPENDED",
    "SETTLEMENT",
    "ARCHIVED",
    "EXTINCT",
    "EXTINCT_WITH_JUDGMENT",
    "EXTINCT_WITH_MERIT",
    "EXTINCT_WITHOUT_MERIT",
    "WITHDRAWAL",
    "CONSTRUCTION",
] as const

export default async function ProcessesPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const params = await searchParams
    const search = params.search || undefined
    const selectedStatuses = (params.status || "")
        .split(",")
        .map((status) => status.trim())
        .filter((status): status is typeof filterableStatuses[number] => filterableStatuses.includes(status as typeof filterableStatuses[number]))

    const [processes, statusCounts] = await Promise.all([
        ProcessService.listProcesses(user.id, search, selectedStatuses),
        ProcessService.listStatusCounts(user.id, search),
    ])

    const countsMap = new Map(statusCounts.map((item) => [item.status, item.count]))
    const filterOptions = filterableStatuses.map((status) => ({
        value: status,
        label: statusLabels[status] || status,
        count: countsMap.get(status) || 0,
    }))
    const totalMatchingSearch = statusCounts.reduce((sum, item) => sum + item.count, 0)
    const hasActiveFilters = Boolean(search) || selectedStatuses.length > 0

    return (
        <PageContainer>
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

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SearchInput placeholder="Buscar por número, pasta ou assunto..." className="max-w-md" />
                        <ProcessStatusFilter
                            options={filterOptions}
                            selectedValues={selectedStatuses}
                            totalCount={totalMatchingSearch}
                        />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Exibindo <span className="font-medium text-foreground">{processes.length}</span>
                        {selectedStatuses.length > 0 && (
                            <> de <span className="font-medium text-foreground">{totalMatchingSearch}</span></>
                        )} processo{processes.length === 1 ? "" : "s"}
                        {selectedStatuses.length > 0 ? " nas fases selecionadas" : ""}
                    </p>
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
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted bg-muted/5 p-12">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Briefcase className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {hasActiveFilters ? "Nenhum processo encontrado" : "Nenhum processo cadastrado"}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {hasActiveFilters
                                    ? "Ajuste a busca ou o filtro de fase para localizar outros processos."
                                    : 'Clique em "Novo Processo" para começar.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    )
}
