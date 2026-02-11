"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { renameWorkspaceAction } from "@/lib/actions/workspace-actions"
import { useToast } from "@/hooks/use-toast"

interface RenameWorkspaceDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    currentName: string
}

export function RenameWorkspaceDialog({
    isOpen,
    onOpenChange,
    workspaceId,
    currentName
}: RenameWorkspaceDialogProps) {
    const [name, setName] = useState(currentName)
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    const handleSave = async () => {
        const trimmed = name.trim()
        if (!trimmed) return

        setIsSaving(true)
        try {
            const result = await renameWorkspaceAction(workspaceId, trimmed)
            if (result.error) {
                toast({
                    title: "Erro",
                    description: result.error,
                    type: "error"
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: "Workspace renomeado com sucesso",
                    type: "success"
                })
                onOpenChange(false)
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro desconhecido",
                type: "error"
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Renomear Workspace</DialogTitle>
                    <DialogDescription>
                        Digite o novo nome para este workspace.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do Workspace"
                        disabled={isSaving}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
