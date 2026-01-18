"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface RegisterOpponentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (name: string) => void
}

export function RegisterOpponentModal({ open, onOpenChange, onSuccess }: RegisterOpponentModalProps) {
    const [loading, setLoading] = useState(false)
    const [fetchingCep, setFetchingCep] = useState(false)

    // Basic Info
    const [type, setType] = useState<"PF" | "PJ">("PF")
    const [name, setName] = useState("")
    const [doc, setDoc] = useState("")

    // Address
    const [address, setAddress] = useState({
        zip: "",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        complement: ""
    })

    const handleCepBlur = async () => {
        const cep = address.zip.replace(/\D/g, "")
        if (cep.length !== 8) return

        setFetchingCep(true)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
            if (!response.ok) {
                // If 404 or other error, just ignore or show mild warning, don't crash
                console.warn("CEP API error:", response.statusText)
                return
            }
            const data = await response.json()
            setAddress(prev => ({
                ...prev,
                street: data.street || prev.street,
                neighborhood: data.neighborhood || prev.neighborhood,
                city: data.city || prev.city,
                state: data.state || prev.state
            }))
        } catch (e) {
            console.error("Failed to fetch CEP:", e)
            // Do not disturb user with alerts for this, manual entry is fine
        } finally {
            setFetchingCep(false)
        }
    }

    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        // Basic Frontend Validation
        const cleanDoc = doc.replace(/\D/g, "")
        if (type === "PF" && cleanDoc.length !== 11) {
            toast({ title: "CPF inválido", description: "O CPF deve ter 11 dígitos.", type: "error" })
            return
        }
        if (type === "PJ" && cleanDoc.length !== 14) {
            toast({ title: "CNPJ inválido", description: "O CNPJ deve ter 14 dígitos.", type: "error" })
            return
        }

        setLoading(true)
        try {
            const { createClient } = await import("@/lib/actions/client-actions")

            await createClient({
                name,
                type,
                cpfCnpj: doc,
                address,
                acquisitionChannel: "OPPONENT",
                status: "NEW_LEAD"
            })

            toast({ title: "Parte cadastrada com sucesso", type: "success" })
            onSuccess(name)
            onOpenChange(false)

            // Reset
            setName("")
            setDoc("")
            setAddress({ zip: "", street: "", number: "", neighborhood: "", city: "", state: "", complement: "" })
        } catch (error: any) {
            console.error("Submit Error:", error)

            // Try to parse Zod errors from server action if they come in a specific format
            let errorMessage = error.message
            if (Array.isArray(error.issues)) {
                errorMessage = error.issues.map((i: any) => i.message).join(", ")
            } else if (error.message && error.message.includes("too_small")) {
                errorMessage = "Verifique o tamanho dos campos (ex: CPF/CNPJ)"
            }

            toast({ title: "Erro ao cadastrar", description: errorMessage, type: "error" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cadastrar Parte Contrária</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={(v) => setType(v as "PF" | "PJ")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PF">Pessoa Física</SelectItem>
                                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{type === "PF" ? "CPF" : "CNPJ"}</Label>
                            <Input
                                value={doc}
                                onChange={e => setDoc(e.target.value)}
                                placeholder={type === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nome Completo / Razão Social</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Digite o nome..."
                            required
                        />
                    </div>

                    <div className="space-y-2 border-t pt-4 mt-4">
                        <Label className="font-semibold">Endereço</Label>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2 relative">
                            <Label>CEP</Label>
                            <div className="relative">
                                <Input
                                    value={address.zip}
                                    onChange={e => setAddress({ ...address, zip: e.target.value })}
                                    onBlur={handleCepBlur}
                                    placeholder="00000-000"
                                />
                                {fetchingCep && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />}
                            </div>
                        </div>
                        <div className="col-span-3 space-y-2">
                            <Label>Rua</Label>
                            <Input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Número</Label>
                            <Input value={address.number} onChange={e => setAddress({ ...address, number: e.target.value })} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Bairro</Label>
                            <Input value={address.neighborhood} onChange={e => setAddress({ ...address, neighborhood: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>UF</Label>
                            <Input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Complemento</Label>
                            <Input value={address.complement} onChange={e => setAddress({ ...address, complement: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cadastrar e Selecionar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
