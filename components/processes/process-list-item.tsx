"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Folder, ExternalLink, ChevronRight, Edit2, FileText } from "lucide-react"
import Link from "next/link"

interface ProcessListItemProps {
    process: any // Ideally typed with Prisma Process type
    statusColors: Record<string, string>
    statusLabels: Record<string, string>
    areaLabels: Record<string, string>
}

export function ProcessListItem({ process: proc, statusColors, statusLabels, areaLabels }: ProcessListItemProps) {
    return (
        <div
            className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
        >
            {/* Left Side: Folder Name & Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Folder className="h-4 w-4 text-primary fill-primary/10" />
                    <h3 className="font-bold text-lg text-foreground truncate">{proc.folderName || proc.client.name}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {proc.link ? (
                            <a
                                href={proc.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline hover:text-primary font-medium flex items-center gap-1 z-20 relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {proc.number} <ExternalLink className="h-3 w-3" />
                            </a>
                        ) : (
                            <span className="font-medium">{proc.number}</span>
                        )}
                    </span>
                    <span className="text-muted-foreground/30">•</span>
                    <span>{areaLabels[proc.area] || proc.area}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="truncate max-w-[200px]">{proc.actionType || proc.subject || "Sem assunto"}</span>
                </div>

                {proc.opponent && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                        <span className="font-medium">Parte Contrária:</span> {proc.opponentName || proc.opponent} ({
                            (() => {
                                const pos = proc.position?.toUpperCase()
                                if (pos === "AUTOR") return "Réu"
                                if (pos === "REU") return "Autor"
                                if (pos === "RECLAMANTE") return "Reclamada"
                                if (pos === "RECLAMADA") return "Reclamante"
                                if (pos === "REQUERENTE") return "Requerido"
                                if (pos === "REQUERIDO") return "Requerente"
                                return "Parte Contrária"
                            })()
                        })
                    </p>
                )}
            </div>

            {/* Right Side: Status & Actions */}
            <div className="flex items-center gap-3 shrink-0">
                {proc.district && (
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-xs font-medium text-foreground">{proc.district}</span>
                        <span className="text-[10px] text-muted-foreground">{proc.court}</span>
                    </div>
                )}

                <Badge variant="outline" className={`${statusColors[proc.status] || "bg-gray-100 text-gray-700"} border-0 font-medium px-2.5 py-0.5`}>
                    {statusLabels[proc.status] || proc.status}
                </Badge>

                <div className="flex items-center gap-1 z-20 relative">
                    <Link href={`/processes/${proc.id}/edit`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/processes/${proc.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
            <Link href={`/processes/${proc.id}`} className="absolute inset-0 rounded-xl ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10" />
        </div>
    )
}
