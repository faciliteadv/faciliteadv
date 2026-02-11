"use client"

import { useState } from "react"
import { createEsteiraAction } from "@/lib/actions/workspace-actions"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EsteiraModalProps {
    isOpen: boolean
    onClose: () => void
    onEsteiraCreated: (esteira: { id: string; name: string }) => void
}

export function EsteiraModal({ isOpen, onClose, onEsteiraCreated }: EsteiraModalProps) {
    const [name, setName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        const trimmedName = name.trim()

        if (!trimmedName) {
            setError("Nome é obrigatório")
            return
        }

        if (trimmedName.length < 3) {
            setError("Nome deve ter no mínimo 3 caracteres")
            return
        }

        if (trimmedName.length > 40) {
            setError("Nome deve ter no máximo 40 caracteres")
            return
        }

        setIsCreating(true)
        setError(null)

        try {
            const result = await createEsteiraAction(trimmedName)

            if (result.error) {
                setError(result.error)
                return
            }

            // Success
            if (result.esteira) {
                onEsteiraCreated(result.esteira)
            }
            handleClose()
        } catch (err) {
            setError("Erro ao criar esteira")
        } finally {
            setIsCreating(false)
        }
    }

    const handleClose = () => {
        setName("")
        setError(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[400px] z-[9999]">
                <DialogHeader>
                    <DialogTitle>Nova Esteira de Produção</DialogTitle>
                    <DialogDescription>
                        Crie uma nova esteira para organizar suas tarefas.
                        Colunas padrão serão criadas automaticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="esteira-name">Nome da Esteira</Label>
                        <Input
                            id="esteira-name"
                            placeholder="Ex: Trabalhista, Criminal, Família..."
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                setError(null)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isCreating) {
                                    handleCreate()
                                }
                            }}
                            maxLength={40}
                            autoFocus
                            disabled={isCreating}
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Serão criadas as listas: A Fazer, Em Andamento, Aguardando, Concluído
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isCreating}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating || !name.trim()}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            "Criar Esteira"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
