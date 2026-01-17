"use client"

import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit2, Trash2, Loader2 } from "lucide-react"
import { deleteClientAction } from "@/lib/actions/client-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ClientActionsMenuProps {
    clientId: string
    clientName: string
}

export function ClientActionsMenu({ clientId, clientName }: ClientActionsMenuProps) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir o cliente ${clientName}? Esta ação não pode ser desfeita.`)) {
            return
        }

        setLoading(true)
        try {
            await deleteClientAction(clientId)
            toast({
                title: "Cliente excluído",
                description: "O cliente foi removido com sucesso.",
                type: "success"
            })
        } catch (error) {
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir o cliente.",
                type: "error"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted hover:text-foreground h-8 w-8" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4 text-muted-foreground" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/clients/${clientId}`} className="flex items-center gap-2 cursor-pointer w-full">
                        <Eye className="h-4 w-4" />
                        Visualizar
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/clients/${clientId}/edit`} className="flex items-center gap-2 cursor-pointer w-full">
                        <Edit2 className="h-4 w-4" />
                        Editar
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
