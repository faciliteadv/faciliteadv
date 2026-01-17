"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface CopyButtonProps {
    value: string
    label?: string
}

export function CopyButton({ value, label }: CopyButtonProps) {
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            toast({ title: "Copiado!", description: `${label || "Texto"} copiado para a área de transferência.` })
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast({ title: "Erro ao copiar", type: "error" })
        }
    }

    return (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} type="button">
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </Button>
    )
}
