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
import { Check, ChevronsUpDown, Loader2, Plus, Trash2, UserPlus } from "lucide-react"
import { createProcess, updateProcessAction, getClientsForSelect, getActionTypes, createActionType, getUsersForResponsibleSelect } from "@/lib/actions/process-actions"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { RegisterOpponentModal } from "./register-opponent-modal"

const COURT_OPTIONS = [
    "1ª Vara", "2ª Vara", "3ª Vara", "4ª Vara", "5ª Vara", "6ª Vara", "7ª Vara", "8ª Vara", "9ª Vara", "10ª Vara", "Juizado Especial"
]

const DISTRICT_OPTIONS = [
    "Santos/SP", "São Vicente/SP", "Praia Grande/SP", "Guarujá/SP", "Cubatão/SP", "Bertioga/SP", "Mongaguá/SP", "Itanhaém/SP", "Peruíbe/SP", "São Paulo/SP"
]

const ACTION_TYPES_PRESETS = [
    "Reclamação trabalhista", "Mandado de segurança", "Consignação em pagamento", "Guarda", "Alimentos", "Regulamentação de visitas",
    "Divórcio", "Divórcio c/c guarda", "Divórcio c/c guarda e alimentos", "Divórcio c/c guarda e visitas", "Divórcio c/c guarda, alimentos e visitas",
    "Divórcio c/c alimentos", "Divórcio c/c visitas", "Inventário", "Usucapião", "Imissão de posse", "Alvará judicial"
]

const POSITION_ANTONYMS: Record<string, string> = {
    "AUTOR": "Réu",
    "REU": "Autor",
    "RECLAMANTE": "Reclamada",
    "RECLAMADA": "Reclamante",
    "REQUERENTE": "Requerido",
    "REQUERIDO": "Requerente"
}

// Map frontend values to readable names if needed, or use directly
const POSITIONS = [
    { value: "AUTOR", label: "Autor" },
    { value: "REU", label: "Réu" },
    { value: "RECLAMANTE", label: "Reclamante" },
    { value: "RECLAMADA", label: "Reclamada" },
    { value: "REQUERENTE", label: "Requerente" },
    { value: "REQUERIDO", label: "Requerido" },
    { value: "REPRESENTANTE", label: "Representante Legal" },
    { value: "TERCEIRO", label: "Terceiro Interessado" },
    { value: "OUTRO", label: "Outro" }
]

interface ProcessFormProps {
    initialData?: any
    isEditing?: boolean
}

export function ProcessForm({ initialData, isEditing = false }: ProcessFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<{ id: string, name: string }[]>([])
    const [users, setUsers] = useState<{ id: string, name: string | null, email: string }[]>([])
    const [actionTypes, setActionTypes] = useState<string[]>([])
    const [customActionType, setCustomActionType] = useState("")

    // UI States
    const [registerOpponentOpen, setRegisterOpponentOpen] = useState(false)
    const [formErrors, setFormErrors] = useState<string[]>([])

    // Form Data
    const [formData, setFormData] = useState({
        number: "",
        area: "",
        actionType: "",
        folderName: "",
        clientId: "",
        status: "",
        position: "", // Primary Client Position
        opponent: "", // Primary Opponent Name
        opponentPosition: "", // Primary Opponent Position
        district: "",
        court: "",
        link: "",
        responsibleLawyerId: ""
    })
    const [searchTerm, setSearchTerm] = useState("")

    // Additional Parties
    const [authors, setAuthors] = useState<{ clientId: string, position: string }[]>([])
    const [opponents, setOpponents] = useState<{ name: string, position: string }[]>([])

    // Status Labels
    const statusLabels: Record<string, string> = {
        ACTIVE: "Ativo", SUSPENDED: "Suspenso", APPEAL: "Recurso", SETTLEMENT: "Acordo",
        CONSTRUCTION: "Construção", ARCHIVED: "Arquivado", EXTINCT: "Extinto",
        EXTINCT_WITH_JUDGMENT: "Extinto com Julgamento"
    }

    // --- Loading Initial Data ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [c, u, a] = await Promise.all([
                    getClientsForSelect(),
                    getUsersForResponsibleSelect(),
                    getActionTypes()
                ])
                setClients(c)
                setUsers(u)
                const combinedTypes = Array.from(new Set([...ACTION_TYPES_PRESETS, ...a])).sort()
                setActionTypes(combinedTypes)
            } catch (error) {
                console.error("Failed to load select data", error)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        if (initialData) {
            setFormData({
                number: initialData.number || "",
                area: initialData.area || "",
                actionType: initialData.actionType || initialData.subject || "", // Fallback to subject if old record
                folderName: initialData.folderName || "",
                clientId: initialData.clientId || "",
                status: initialData.status || "ACTIVE",
                position: initialData.position || "",
                opponent: initialData.opponent || "",
                opponentPosition: "", // Needs calculation or db fetch if stored separately. 
                // Currently 'position' in DB is mostly for client. Opponent position wasn't explicitly stored in main table before.
                // We will infer or leave empty.
                district: initialData.district || "",
                court: initialData.court || "",
                link: initialData.link || "",
                responsibleLawyerId: initialData.responsibleLawyerId || ""
            })

            // Infer opponent position based on client position if possible
            if (initialData.position && !initialData.opponentPosition) {
                // Logic to reverse map if needed, but for now Antonyms map uses Form Value -> Display Text
                // The DB stored "AUTOR" or "REU". 
                // If client is "AUTOR", opponent is implied "REU". 
                // We will set opponentPosition state derived from that if editing.
                const ant = POSITION_ANTONYMS[initialData.position]
                // We need the KEY for the Select (e.g. "REU"). 
                // The map above values are "Réu".
                // Reverse lookup:
                const key = Object.keys(POSITION_ANTONYMS).find(k => POSITION_ANTONYMS[k] === ant)
                // ACTUALLY, the prompt asked to FILL automatically. 
                // "Sempre com seu antônimo, tipo: Autor - Réu". 
                // stored position is UPPERCASE enum usually.
            }

            // Load additional parties if they exist
            // (Assumes initialData includes these relations)
            if (initialData.authors) {
                setAuthors(initialData.authors.map((a: any) => ({ clientId: a.clientId, position: a.position })))
            }
            if (initialData.opponents) {
                setOpponents(initialData.opponents.map((o: any) => ({ name: o.name, position: o.position })))
            }
        }
    }, [initialData])

    // --- Auto-Fill Logic ---
    useEffect(() => {
        // Auto-Folder Name
        if (!isEditing && formData.clientId) {
            const cName = clients.find(c => c.id === formData.clientId)?.name?.split(" ").slice(0, 2).join(" ") || ""
            const oName = formData.opponent
            if (cName) {
                setFormData(prev => ({ ...prev, folderName: oName ? `${cName} vs ${oName}` : cName }))
            }
        }
    }, [formData.clientId, formData.opponent, clients, isEditing])

    // Auto-Fill Opponent Position
    useEffect(() => {
        if (formData.position) {
            const antonym = POSITION_ANTONYMS[formData.position]
            if (antonym) {
                setFormData(prev => ({ ...prev, opponentPosition: antonym }))
            }
        }
    }, [formData.position])

    // --- Handlers ---
    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleAddAuthor = () => {
        setAuthors([...authors, { clientId: "", position: "" }])
    }

    const handleRemoveAuthor = (index: number) => {
        setAuthors(authors.filter((_, i) => i !== index))
    }

    const handleAuthorChange = (index: number, field: "clientId" | "position", value: string) => {
        const newAuthors = [...authors]
        newAuthors[index][field] = value
        setAuthors(newAuthors)
    }

    const handleAddOpponent = () => {
        setOpponents([...opponents, { name: "", position: "" }])
    }

    const handleRemoveOpponent = (index: number) => {
        setOpponents(opponents.filter((_, i) => i !== index))
    }

    const handleOpponentChange = (index: number, field: "name" | "position", value: string) => {
        const newOpponents = [...opponents]
        newOpponents[index][field] = value
        setOpponents(newOpponents)
    }

    const handleOpponentCreated = (name: string) => {
        // Refresh clients list if possible, or just add temporarily to selection if it was a client?
        // Actually, we want to allow selecting this new person as the opponent.
        // We will assume simpler: Just set the name.
        if (!formData.opponent) {
            handleChange("opponent", name)
        } else {
            // Add to list
            setOpponents([...opponents, { name, position: "REU" }])
        }
        // Force refresh clients as we just created one
        // getClientsForSelect().then(setClients) // Optional: optimize later
    }

    const handleRegisterOpponentClick = (e: React.MouseEvent) => {
        e.preventDefault()
        setRegisterOpponentOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormErrors([])

        // Validation
        const errors = []
        if (!formData.number) errors.push("Número do processo é obrigatório")
        if (!formData.clientId) errors.push("Cliente é obrigatório")
        if (errors.length > 0) {
            setFormErrors(errors)
            toast({ title: "Campos obrigatórios", description: "Verifique os campos em vermelho.", type: "error" })
            return
        }

        setLoading(true)

        // Handle Custom Action Type creation if needed
        let finalActionType = formData.actionType
        if (finalActionType && !actionTypes.includes(finalActionType)) {
            try {
                // Determine if it's a new custom type or just a value.
                // We'll just pass it, the backend can handle creating it if we want, 
                // OR we create it here explicitly.
                // For simplicity, let's create it.
                await createActionType(finalActionType)
            } catch (err) {
                console.warn("Could not save custom action type", err)
            }
        }

        try {
            const payload = {
                ...formData,
                authors,
                opponents
            }

            if (isEditing && initialData?.id) {
                await updateProcessAction(initialData.id, payload)
                toast({ title: "Processo atualizado", type: "success" })
            } else {
                await createProcess(payload)
                toast({ title: "Processo criado", type: "success" })
            }
            router.push("/processes")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast({ title: "Erro ao salvar", description: error.message, type: "error" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <RegisterOpponentModal
                open={registerOpponentOpen}
                onOpenChange={setRegisterOpponentOpen}
                onSuccess={handleOpponentCreated}
            />

            <Card className="bg-[#0f4c75] text-white border-none shadow-xl"> {/* Custom dark blue theme similar to image */}
                <CardHeader>
                    <CardTitle className="text-white">{isEditing ? "Editar Processo" : "Editar Processo / Novo"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Row 1 */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Nome da pasta</Label>
                            <Input
                                value={formData.folderName}
                                onChange={(e) => handleChange("folderName", e.target.value)}
                                className="bg-gray-100 text-black border-none"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Status do processo</Label>
                            <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full",
                                                    key === "ACTIVE" ? "bg-green-500" :
                                                        key === "SUSPENDED" ? "bg-orange-500" :
                                                            key === "APPEAL" ? "bg-blue-500" :
                                                                key === "SETTLEMENT" ? "bg-purple-500" :
                                                                    key === "CONSTRUCTION" ? "bg-gray-400" :
                                                                        key === "ARCHIVED" ? "bg-red-500" :
                                                                            key === "EXTINCT" ? "bg-red-700" :
                                                                                key === "EXTINCT_WITH_JUDGMENT" ? "bg-black" :
                                                                                    "bg-gray-500"
                                                )} />
                                                <span>{label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Client */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label className={cn("text-white", formErrors.includes("Cliente é obrigatório") && "text-red-400")}>Cliente *</Label>
                            <Combobox
                                value={formData.clientId}
                                onValueChange={(v) => handleChange("clientId", v)}
                                options={clients.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Selecione..."
                                searchPlaceholder="Buscar cliente..."
                                className={cn(!formData.clientId && formErrors.includes("Cliente é obrigatório") && "border-2 border-red-500")}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Posição do Cliente no Processo</Label>
                            <Select value={formData.position} onValueChange={(v) => handleChange("position", v)}>
                                <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {POSITIONS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Additional Authors */}
                    <div className="space-y-2">
                        <Button type="button" variant="ghost" className="text-white hover:text-gray-200 pl-0 hover:bg-transparent" onClick={handleAddAuthor}>
                            <Plus className="h-4 w-4 mr-1 bg-white text-[#0f4c75] rounded-full p-0.5" /> Parte autora ou representante
                        </Button>
                        {authors.map((author, index) => (
                            <div key={index} className="grid md:grid-cols-2 gap-4 items-end bg-white/5 p-2 rounded-md">
                                <div className="space-y-1">
                                    <Combobox
                                        value={author.clientId}
                                        onValueChange={(v) => handleAuthorChange(index, "clientId", v)}
                                        options={clients.map(c => ({ value: c.id, label: c.name }))}
                                        placeholder="Selecione..."
                                        searchPlaceholder="Buscar cliente..."
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1 flex gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-gray-300">Posição</Label>
                                        <Select value={author.position} onValueChange={(v) => handleAuthorChange(index, "position", v)}>
                                            <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200 h-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {POSITIONS.map(p => (
                                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveAuthor(index)} className="h-8 w-8 text-red-300 hover:text-red-100 hover:bg-red-500/20">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Row 3: Opponent */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 relative flex flex-col">
                            <Label className="text-white">Parte Contrária</Label>
                            <Combobox
                                value={formData.opponent}
                                onValueChange={(v) => handleChange("opponent", v)}
                                options={clients.map(c => ({ value: c.name, label: c.name }))}
                                placeholder="Selecione ou busque..."
                                searchPlaceholder="Buscar nome..."
                                customEmpty={(search) => (
                                    <div className="p-4 flex flex-col items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Nenhum encontrado.</span>
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRegisterOpponentClick(e);
                                            }}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Cadastrar "{search}"
                                        </Button>
                                    </div>
                                )}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Posição da Parte Contrária no Processo</Label>
                            <Select value={formData.opponentPosition} onValueChange={(v) => handleChange("opponentPosition", v)}>
                                <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200">
                                    <SelectValue placeholder={formData.position ? (POSITION_ANTONYMS[formData.position] || "Selecione...") : "Selecione..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {POSITIONS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Additional Opponents */}
                    <div className="space-y-2">
                        <Button type="button" variant="ghost" className="text-white hover:text-gray-200 pl-0 hover:bg-transparent" onClick={handleAddOpponent}>
                            <Plus className="h-4 w-4 mr-1 bg-white text-[#0f4c75] rounded-full p-0.5" /> Parte contrária ou interessado
                        </Button>
                        {opponents.map((opp, index) => (
                            <div key={index} className="grid md:grid-cols-2 gap-4 items-end bg-white/5 p-2 rounded-md">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-300">Nome</Label>
                                    <Input
                                        value={opp.name}
                                        onChange={(e) => handleOpponentChange(index, "name", e.target.value)}
                                        className="bg-gray-100 text-black border-none h-8"
                                    />
                                </div>
                                <div className="space-y-1 flex gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-gray-300">Posição</Label>
                                        <Select value={opp.position} onValueChange={(v) => handleOpponentChange(index, "position", v)}>
                                            <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200 h-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {POSITIONS.map(p => (
                                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveOpponent(index)} className="h-8 w-8 text-red-300 hover:text-red-100 hover:bg-red-500/20">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Row 4: Details */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className={cn("text-white", formErrors.includes("Número do processo é obrigatório") && "text-red-400")}>Número do processo *</Label>
                            <Input
                                value={formData.number}
                                onChange={(e) => handleChange("number", e.target.value)}
                                className={cn("bg-gray-100 text-black border-none", !formData.number && formErrors.includes("Número do processo é obrigatório") && "border-2 border-red-500")}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Área de atuação</Label>
                            <Select value={formData.area} onValueChange={(v) => handleChange("area", v)}>
                                <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRABALHISTA">Trabalhista</SelectItem>
                                    <SelectItem value="CIVIL">Cível</SelectItem>
                                    <SelectItem value="FAMILIA">Família e Sucessões</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Tipo de ação</Label>
                            <Combobox
                                value={formData.actionType}
                                onValueChange={(v) => handleChange("actionType", v)}
                                options={actionTypes.map(t => ({ value: t, label: t }))}
                                placeholder="Selecione ou digite..."
                                searchPlaceholder="Buscar ou criar tipo..."
                            />
                        </div>
                    </div>

                    {/* Row 5: Link, Court */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Link do processo</Label>
                            <Input
                                value={formData.link}
                                onChange={(e) => handleChange("link", e.target.value)}
                                className="bg-gray-100 text-black border-none"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Vara</Label>
                            <Select value={formData.court} onValueChange={(v) => handleChange("court", v)}>
                                <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {COURT_OPTIONS.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-white">Comarca</Label>
                            <Select value={formData.district} onValueChange={(v) => handleChange("district", v)}>
                                <SelectTrigger className="bg-gray-100 text-black border-none hover:bg-gray-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISTRICT_OPTIONS.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 6: Responsible */}
                    <div className="space-y-2 flex flex-col">
                        <Label className="text-white">Advogado Responsável</Label>
                        <Combobox
                            value={formData.responsibleLawyerId}
                            onValueChange={(v) => handleChange("responsibleLawyerId", v)}
                            options={users.map(u => ({ value: u.id, label: u.name || u.email }))}
                            placeholder="Selecione..."
                            searchPlaceholder="Buscar advogado..."
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="w-[200px] bg-white text-[#0f4c75] hover:bg-gray-100 font-bold" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </div>
                </CardContent >
            </Card >
        </form >
    )
}

interface ComboboxProps {
    value: string
    onValueChange: (val: string) => void
    options: { value: string, label: string }[]
    placeholder?: string
    searchPlaceholder?: string
    className?: string
    renderItem?: (option: { value: string, label: string }) => React.ReactNode
    showAddCustom?: boolean
    customEmpty?: (search: string) => React.ReactNode
}

function Combobox({
    value,
    onValueChange,
    options,
    placeholder,
    searchPlaceholder,
    className,
    renderItem,
    showAddCustom = true,
    customEmpty
}: ComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const selectedOption = options.find((op) => op.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-gray-100 text-black border-none hover:bg-gray-200", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedOption ? (
                            renderItem ? renderItem(selectedOption) : <span>{selectedOption.label}</span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder || "Selecione..."}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder={searchPlaceholder || "Buscar..."}
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {customEmpty ? customEmpty(searchTerm) : (
                                showAddCustom && searchTerm ? (
                                    <div className="p-2 flex flex-col gap-2">
                                        <span className="text-sm text-muted-foreground text-center">Nenhum resultado encontrado.</span>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => {
                                                onValueChange(searchTerm)
                                                setOpen(false)
                                                setSearchTerm("")
                                            }}
                                        >
                                            Usar "{searchTerm}"
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4 text-sm text-center text-muted-foreground">Nenhum resultado encontrado.</div>
                                )
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((op) => (
                                <CommandItem
                                    key={op.value}
                                    value={op.label}
                                    onSelect={() => {
                                        onValueChange(op.value)
                                        setOpen(false)
                                        setSearchTerm("")
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === op.value ? "opacity-100" : "opacity-0")} />
                                    <div className="flex-1">
                                        {renderItem ? renderItem(op) : op.label}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
