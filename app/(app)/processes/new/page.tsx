"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeft, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { createProcess, getClientsForSelect, getUniqueSubjects } from "@/lib/actions/process-actions"
import { cn } from "@/lib/utils"

export default function NewProcessPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<{ id: string, name: string }[]>([])
    const [subjects, setSubjects] = useState<string[]>([])

    // Combobox states
    const [openClient, setOpenClient] = useState(false)

    // Form
    const [formData, setFormData] = useState({
        number: "",
        area: "",
        subject: "",
        folderName: "",
        clientId: "",
        status: "ACTIVE"
    })

    useEffect(() => {
        getClientsForSelect().then(setClients).catch(console.error)
        getUniqueSubjects().then(setSubjects).catch(console.error)
    }, [])

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createProcess(formData)
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
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto pb-10">
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
                        {/* Client Searchable Combobox */}
                        <div className="space-y-2 flex flex-col">
                            <Label>Cliente</Label>
                            <Popover open={openClient} onOpenChange={setOpenClient}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openClient}
                                        className="w-full justify-between"
                                    >
                                        {formData.clientId
                                            ? clients.find((client) => client.id === formData.clientId)?.name
                                            : "Selecione o cliente..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar cliente..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {clients.map((client) => (
                                                    <CommandItem
                                                        key={client.id}
                                                        value={client.name}
                                                        onSelect={() => {
                                                            handleChange("clientId", client.id)
                                                            setOpenClient(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.clientId === client.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {client.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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
                                <Select value={formData.area} onValueChange={(v: string) => handleChange("area", v)}>
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
                                <Label>Assunto Principal</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => handleChange("subject", e.target.value)}
                                    placeholder="Ex: Danos Morais"
                                    list="subjects-list"
                                />
                                <datalist id="subjects-list">
                                    {subjects.map(s => <option key={s} value={s} />)}
                                </datalist>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Digite ou selecione da lista.
                                </p>
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
