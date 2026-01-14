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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Processos</h2>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Novo Processo
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <SearchInput placeholder="Buscar por número ou pasta..." />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {processes.map((proc: any) => (
                    <div key={proc.id} className="group flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <Folder className="h-4 w-4 text-blue-500" />
                                    <span>{proc.area}</span>
                                    <span className="text-slate-300">/</span>
                                    <span>{proc.client.name}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-mono text-lg font-semibold text-slate-900 truncate" title={proc.number}>
                                    {proc.number}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                    {proc.subject || "Sem assunto definido"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                {proc.status}
                            </Badge>

                            {proc.courtLink && (
                                <a
                                    href={proc.courtLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Tribunal <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}

                {processes.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-10 border rounded-lg border-dashed bg-slate-50">
                        <Briefcase className="h-10 w-10 text-slate-300 mb-2" />
                        <p className="text-slate-500">Nenhum processo encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
