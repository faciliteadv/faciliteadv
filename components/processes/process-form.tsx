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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { createProcess, updateProcessAction, getClientsForSelect, getUniqueSubjects } from "@/lib/actions/process-actions"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ProcessFormProps {
    initialData?: any
    isEditing?: boolean
}

export function ProcessForm({ initialData, isEditing = false }: ProcessFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<{ id: string, name: string }[]>([])
    const [subjects, setSubjects] = useState<string[]>([])

    const [openClient, setOpenClient] = useState(false)

    const [formData, setFormData] = useState({
        number: "",
        area: "",
        subject: "",
        folderName: "",
        clientId: "",
        status: "ACTIVE",
        opponent: "",
        position: "",
        district: "",
        court: "",
        link: ""
    })

    // Auto-Folder Name Logic state
    const [clientName, setClientName] = useState("")

    useEffect(() => {
        getClientsForSelect().then(setClients).catch(console.error)
        getUniqueSubjects().then(setSubjects).catch(console.error)
    }, [])

    useEffect(() => {
        if (initialData) {
            setFormData({
                number: initialData.number || "",
                area: initialData.area || "",
                subject: initialData.subject || "",
                folderName: initialData.folderName || "",
                clientId: initialData.clientId || "",
                status: initialData.status || "ACTIVE",
                opponent: initialData.opponent || "",
                position: initialData.position || "",
                district: initialData.district || "",
                court: initialData.court || "",
                link: initialData.link || ""
            })
            // Set initial client name for logic (handled by fetch usually, but we have client list)
            // If editing, we need the client name to display if not in list yet?
            // Actually getClientsForSelect returns all relevant clients.
        }
    }, [initialData])

    // Update auto-folder name
    // Logic: "FirstName LastName" vs "Opponent"
    // Only if folderName is not manually edited? Hard to track. 
    // We will update it if folderName is empty OR if user hasn't touched it. for now, let's just update if it matches previous pattern or is empty.
    useEffect(() => {
        if (isEditing) return; // Don't auto-change on edit unless requested.

        const cName = clients.find(c => c.id === formData.clientId)?.name?.split(" ").slice(0, 2).join(" ") || ""
        const oName = formData.opponent

        if (cName) {
            const autoName = oName ? `${cName} vs ${oName}` : cName
            // Simple heuristic: set it.
            setFormData(prev => ({ ...prev, folderName: autoName }))
        }
    }, [formData.clientId, formData.opponent, clients, isEditing])

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isEditing && initialData?.id) {
                await updateProcessAction(initialData.id, formData)
                toast({ title: "Processo atualizado", type: "success" })
            } else {
                await createProcess(formData)
                toast({ title: "Processo criado", type: "success" })
            }
            router.push("/processes")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast({ title: "Erro ao salvar", type: "error" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? "Editar Processo" : "Dados do Processo"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Row 1: Client & Status */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label>Cliente</Label>
                            <Popover open={openClient} onOpenChange={setOpenClient}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openClient}
                                        className="w-full justify-between"
                                        disabled={isEditing} // Usually changing client on edit is rare/complex
                                    >
                                        {formData.clientId
                                            ? clients.find((client) => client.id === formData.clientId)?.name || "Cliente (Carregando...)"
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
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span>Ativo</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="SUSPENDED">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                                            <span>Suspenso</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="APPEAL">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>Recurso</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="SETTLEMENT">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                                            <span>Acordo</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="CONSTRUCTION">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                                            <span>Construção</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ARCHIVED">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                            <span>Arquivado</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EXTINCT">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-700" />
                                            <span>Extinto</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EXTINCT_WITH_JUDGMENT">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-black" />
                                            <span>Extinto com Julgamento</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Number & Position */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Número do Processo</Label>
                            <Input
                                placeholder="0000000-00.0000.0.00.0000"
                                value={formData.number}
                                onChange={(e) => handleChange("number", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Posição do Cliente</Label>
                            <Select value={formData.position} onValueChange={(v) => handleChange("position", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a posição..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AUTOR">Autor</SelectItem>
                                    <SelectItem value="REU">Réu</SelectItem>
                                    <SelectItem value="OUTRO">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 3: Folder Name (Auto) & Opponent */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome da Pasta (Automático)</Label>
                            <Input
                                value={formData.folderName}
                                onChange={(e) => handleChange("folderName", e.target.value)}
                                placeholder="Gerado automaticamente..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Parte Contrária (Réu/Autor)</Label>
                            <Input
                                value={formData.opponent}
                                onChange={(e) => handleChange("opponent", e.target.value)}
                                placeholder="Nome da outra parte"
                            />
                        </div>
                    </div>

                    {/* Row 4: Area & Subject */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Área de Atuação</Label>
                            <Select value={formData.area} onValueChange={(v) => handleChange("area", v)}>
                                <SelectTrigger><SelectValue placeholder="Selecione a área..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                                    <SelectItem value="CIVIL">Cível</SelectItem>
                                    <SelectItem value="FAMILIA">Família e Sucessões</SelectItem>
                                    <SelectItem value="EMPRESARIAL">Empresarial</SelectItem>
                                    <SelectItem value="TRIBUTARIO">Tributário</SelectItem>
                                    <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                                    <SelectItem value="PREVIDENCIARIO">Previdenciário</SelectItem>
                                    <SelectItem value="INSS_ADMIN">INSS Administrativo</SelectItem>
                                    <SelectItem value="DIGITAL">Direito Digital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Assunto (Específico)</Label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => handleChange("subject", e.target.value)}
                                placeholder="Ex: Danos Morais"
                                list="subjects-list"
                            />
                            <datalist id="subjects-list">
                                {subjects.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                    </div>

                    {/* Row 5: District & Court & Link */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Comarca (Cidade)</Label>
                            <Input value={formData.district} onChange={(e) => handleChange("district", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Vara</Label>
                            <Input value={formData.court} onChange={(e) => handleChange("court", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Link do Processo (URL)</Label>
                            <Input value={formData.link} onChange={(e) => handleChange("link", e.target.value)} placeholder="https://..." />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Salvar Alterações" : "Cadastrar Processo"}
                    </Button>
                </CardContent>
            </Card>
        </form>
    )
}
