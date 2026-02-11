"use strict";

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RenamePipelineDialog } from "./rename-pipeline-dialog"
import { DeletePipelineDialog } from "./delete-pipeline-dialog"
import { cn } from "@/lib/utils"

interface PipelineActionsMenuProps {
    pipelineId: string
    pipelineName: string
    isActive: boolean
}

export function PipelineActionsMenu({ pipelineId, pipelineName, isActive }: PipelineActionsMenuProps) {
    const [isRenameOpen, setIsRenameOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-sm ml-1",
                            isActive ? "hover:bg-blue-500 text-blue-100" : "hover:bg-slate-200 text-slate-400"
                        )}
                        onClick={(e) => { e.stopPropagation() }}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setIsRenameOpen(true)
                    }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsDeleteOpen(true)
                        }}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <RenamePipelineDialog
                isOpen={isRenameOpen}
                onOpenChange={setIsRenameOpen}
                pipelineId={pipelineId}
                currentName={pipelineName}
            />

            <DeletePipelineDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                pipelineId={pipelineId}
                pipelineName={pipelineName}
            />
        </>
    )
}
