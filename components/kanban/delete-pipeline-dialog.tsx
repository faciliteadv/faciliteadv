"use strict";

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deletePipelineAction } from "@/lib/actions/workspace-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface DeletePipelineDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pipelineId: string
    pipelineName: string
}

export function DeletePipelineDialog({ open, onOpenChange, pipelineId, pipelineName }: DeletePipelineDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    async function handleDelete() {
        setIsLoading(true)
        try {
            const result = await deletePipelineAction(pipelineId)
            if (result.error) {
                toast({
                    title: "Erro ao excluir",
                    description: result.error,
                    type: "error"
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: "Esteira excluída com sucesso.",
                    type: "success"
                })
                onOpenChange(false)
            }
        } catch (error) {
            toast({
                title: "Erro inesperado",
                description: "Tente novamente mais tarde.",
                type: "error"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir "{pipelineName}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a esteira
                        e todas as listas e tarefas contidas nela.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading} onClick={() => onOpenChange(false)}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isLoading ? "Excluindo..." : "Sim, excluir"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
