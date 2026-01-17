"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteProcessAction } from "@/lib/actions/process-actions"
import { useToast } from "@/hooks/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProcessActionsProps {
    processId: string
    children?: React.ReactNode
}

export function ProcessActions({ processId, children }: ProcessActionsProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const { toast } = useToast()

    const handleDelete = () => {
        setOpen(false)

        startTransition(async () => {
            try {
                await deleteProcessAction(processId)
                toast({ title: "Processo excluído", type: "success" })
                // Redirect handled by server action
            } catch (error) {
                // If it wasn't a redirect (which throws error), it's a real error
                // However, NEXT_REDIRECT error is caught by Next, so we catch real errors here
                toast({ title: "Erro ao excluir", type: "error" })
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {children ? children : (
                    <Button variant="destructive" size="sm" className="gap-2">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Excluir Processo
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o processo e todos os seus dados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isPending ? "Excluindo..." : "Confirmar Exclusão"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
