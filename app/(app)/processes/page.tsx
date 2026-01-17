import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProcessService } from "@/lib/services/process-service"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/SearchInput"
import { Badge } from "@/components/ui/badge"
import { Folder, Plus, ExternalLink, Briefcase } from "lucide-react"

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{ search?: string }>
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Processos</h2>
                    <p className="text-muted-foreground mt-1">Gerencie seus processos judiciais e extrajudiciais.</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Novo Processo
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <SearchInput placeholder="Buscar por número ou pasta..." className="max-w-md" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processes.map((proc) => (
                    <div key={proc.id} className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                        <Folder className="h-3.5 w-3.5" />
                                    </div>
                                    <span>{proc.area}</span>
                                    <span className="text-muted-foreground/30">/</span>
                                    <span>{proc.client.name}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-mono text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={proc.number}>
                                    {proc.number}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {proc.subject || "Sem assunto definido"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium">
                                {proc.status}
                            </Badge>

                            {proc.courtLink && (
                                <a
                                    href={proc.courtLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Tribunal <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {processes.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted rounded-xl bg-muted/5">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Nenhum processo encontrado</h3>
                        <p className="text-muted-foreground text-sm mt-1">Comece criando seu primeiro processo ou ajuste os filtros.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
