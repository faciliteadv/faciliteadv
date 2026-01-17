"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createProcess, getClientsForSelect } from "@/lib/actions/process-actions"

export default function NewProcessPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<{ id: string, name: string }[]>([])

    // Form
    const [formData, setFormData] = useState({
        number: "",
        area: "",
        subject: "",
        otherSubject: "",
        folderName: "",
        clientId: "",
        civelArea: "CIVEL", // Default sub-area
        status: "ACTIVE"
    })

    useEffect(() => {
        // Fetch clients on mount
        getClientsForSelect().then(setClients).catch(console.error)
    }, [])

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createProcess({
                ...formData,
                subject: formData.area === 'OUTROS' ? formData.otherSubject : formData.subject
            })
            router.push("/processes")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Erro ao criar processo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Novo Processo</h2>
                    <p className="text-muted-foreground">Cadastre um novo processo jurídico.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Processo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Select onValueChange={(v: string) => handleChange("clientId", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Número do Processo (CNJ)</Label>
                            <Input
                                value={formData.number}
                                onChange={(e) => handleChange("number", e.target.value)}
                                placeholder="0000000-00.0000.8.26.0000"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Área</Label>
                                <Select onValueChange={(v: string) => handleChange("area", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CIVIL">Cível</SelectItem>
                                        <SelectItem value="CRIMINAL">Criminal</SelectItem>
                                        <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                                        <SelectItem value="FAMILIA">Família</SelectItem>
                                        <SelectItem value="PREVIDENCIARIO">Previdenciário</SelectItem>
                                        <SelectItem value="OUTROS">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assunto</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => handleChange("subject", e.target.value)}
                                    placeholder="Ex: Danos Morais"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Pasta (Drive/Física)</Label>
                            <Input
                                value={formData.folderName}
                                onChange={(e) => handleChange("folderName", e.target.value)}
                                placeholder="Nome da pasta do cliente"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cadastrar Processo
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
