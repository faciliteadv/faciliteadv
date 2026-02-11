"use strict";

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { renamePipelineAction } from "@/lib/actions/workspace-actions"
import { Loader2 } from "lucide-react"

interface RenamePipelineDialogProps {
    pipelineId: string
    currentName: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function RenamePipelineDialog({
    pipelineId,
    currentName,
    isOpen,
    onOpenChange
}: RenamePipelineDialogProps) {
    const [name, setName] = useState(currentName)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() === currentName) {
            onOpenChange(false)
            return
        }

        setIsLoading(true)
        try {
            const result = await renamePipelineAction(pipelineId, name)
            if (result.error) {
                toast({
                    title: "Erro ao renomear",
                    description: result.error,
                    type: "error"
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: "Esteira renomeada com sucesso.",
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
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Renomear Esteira</DialogTitle>
                    <DialogDescription>
                        Digite o novo nome para a esteira.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave}>
                    <div className="py-4">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da esteira"
                            className="col-span-3"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
