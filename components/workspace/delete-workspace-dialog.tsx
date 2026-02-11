"use client"

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
import { Loader2 } from "lucide-react"
import { deleteWorkspaceAction } from "@/lib/actions/workspace-actions"
import { useToast } from "@/hooks/use-toast"

interface DeleteWorkspaceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    workspaceName: string
}

export function DeleteWorkspaceDialog({
    open,
    onOpenChange,
    workspaceId,
    workspaceName
}: DeleteWorkspaceDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteWorkspaceAction(workspaceId)
            if (result.error) {
                toast({
                    title: "Erro",
                    description: result.error,
                    type: "error"
                })
            } else {
                toast({
                    title: "Workspace excluído",
                    description: "Você será redirecionado.",
                    type: "success"
                })
                // Optional: redirect or refresh handled by action revalidate
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro desconhecido",
                type: "error"
            })
        } finally {
            setIsDeleting(false)
            onOpenChange(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">Excluir Workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o workspace
                        <span className="font-bold text-foreground"> {workspaceName} </span>
                        e todos os seus dados (processos, esteiras, clientes).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sim, excluir workspace
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
