"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Combobox } from "@/components/ui/combobox"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2, UserPlus, Scale, Briefcase } from "lucide-react"
import { createProcess, updateProcessAction, getClientsForSelect, getActionTypes, createActionType, getUsersForResponsibleSelect, getCourts, getDistricts, createCourt, createDistrict } from "@/lib/actions/process-actions"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { RegisterOpponentModal } from "./register-opponent-modal"

const ACTION_TYPES_PRESETS = [
    "Reclamação trabalhista", "Mandado de segurança", "Consignação em pagamento", "Guarda", "Alimentos", "Regulamentação de visitas",
    "Divórcio", "Divórcio c/c guarda", "Divórcio c/c guarda e alimentos", "Divórcio c/c guarda e visitas", "Divórcio c/c guarda, alimentos e visitas",
    "Divórcio c/c alimentos", "Divórcio c/c visitas", "Inventário", "Usucapião", "Imissão de posse", "Alvará judicial"
]

const COURT_OPTIONS = [
    "1ª Vara", "2ª Vara", "3ª Vara", "4ª Vara", "5ª Vara", "6ª Vara", "7ª Vara", "8ª Vara", "9ª Vara",
    "10ª Vara", "Juizado Especial"
]

const DISTRICT_OPTIONS = [
    "Santos/SP", "São Vicente/SP", "Praia Grande/SP", "Guarujá/SP", "Cubatão/SP", "Bertioga/SP", "Mongaguá/SP",
    "Itanhaém/SP", "Peruíbe/SP", "São Paulo/SP"
]


const PROCESS_UI_CONFIG = {
    STATUS: {
        ACTIVE: { label: "Em andamento", color: "bg-blue-400" },
        SUSPENDED: { label: "Suspenso", color: "bg-red-300" },
        SENTENCED: { label: "Sentenciado", color: "bg-green-900" },
        APPEAL: { label: "Em recurso", color: "bg-red-900" },
        EXECUTION: { label: "Em execução", color: "bg-green-400" },
        EXTINCT_WITH_MERIT: { label: "Extinto com resolução de mérito", color: "bg-blue-900" },
        EXTINCT_WITHOUT_MERIT: { label: "Extinto sem resolução de mérito", color: "bg-red-600" },
        WITHDRAWAL: { label: "Desistência do processo pelo cliente", color: "bg-gray-500" },
        CONSTRUCTION: { label: "Construção", color: "bg-gray-400" },
        ARCHIVED: { label: "Arquivado", color: "bg-gray-600" },
        SETTLEMENT: { label: "Acordo", color: "bg-purple-500" },
    },
    AREA: {
        TRABALHISTA: { label: "Trabalhista" },
        CIVIL: { label: "Cível" },
        FAMILIA: { label: "Família e Sucessões" },
    },
    POSITION: {
        AUTOR: { label: "Autor" },
        REU: { label: "Réu" },
        RECLAMANTE: { label: "Reclamante" },
        RECLAMADA: { label: "Reclamada" },
        REQUERENTE: { label: "Requerente" },
        REQUERIDO: { label: "Requerido" },
        REPRESENTANTE: { label: "Representante Legal" },
        TERCEIRO: { label: "Terceiro Interessado" },
        OUTRO: { label: "Outro" }
    }
}

interface ProcessFormProps {
    initialData?: any
    isEditing?: boolean
    initialClientId?: string
    initialType?: string
    currentUserId?: string
}

export function ProcessForm({ initialData, isEditing = false, initialClientId, initialType, currentUserId }: ProcessFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<{ id: string, name: string, cpfCnpj?: string | null }[]>([])
    const [users, setUsers] = useState<{ id: string, name: string | null, email: string }[]>([])
    const [actionTypes, setActionTypes] = useState<string[]>([])
    const [courts, setCourts] = useState<string[]>([])
    const [districts, setDistricts] = useState<string[]>([])
    const [customActionType, setCustomActionType] = useState("")

    // UI States
    const [registerOpponentOpen, setRegisterOpponentOpen] = useState(false)
    const [formErrors, setFormErrors] = useState<string[]>([])

    // Form Data
    const [formData, setFormData] = useState({
        number: "",
        type: ((initialType === 'CASE' || initialType === 'PROCESS') ? initialType : "PROCESS") as "CASE" | "PROCESS",
        area: "",
        actionType: "",
        folderName: "",
        clientId: initialClientId || "",
        status: "ACTIVE",
        position: "", // Primary Client Position
        opponent: "", // Primary Opponent ID
        opponentPosition: "", // Primary Opponent Position
        district: "",
        court: "",
        link: "",
        claimValue: "",
        responsibleLawyerId: currentUserId || ""
    })
    const [searchTerm, setSearchTerm] = useState("")

    // Additional Parties
    const [authors, setAuthors] = useState<{ clientId: string, position: string }[]>([])
    const [opponents, setOpponents] = useState<{ clientId: string, position: string }[]>([])


    // --- Loading Initial Data ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [c, u, a, ct, dt] = await Promise.all([
                    getClientsForSelect(),
                    getUsersForResponsibleSelect(),
                    getActionTypes(),
                    getCourts(),
                    getDistricts()
                ])
                setClients(c as any)
                setUsers(u)
                const combinedTypes = Array.from(new Set([...ACTION_TYPES_PRESETS, ...(a as string[])])).sort()
                setActionTypes(combinedTypes)
                // Use fallback constants if database is empty
                setCourts(ct.length > 0 ? ct : COURT_OPTIONS)
                setDistricts(dt.length > 0 ? dt : DISTRICT_OPTIONS)
            } catch (error) {
                console.error("Failed to load select data", error)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        if (initialData) {
            const normalize = (val: string | null | undefined, configKey: keyof typeof PROCESS_UI_CONFIG) => {
                if (!val) return ""
                const upperVal = val.toUpperCase()
                const config = PROCESS_UI_CONFIG[configKey] as any
                const match = Object.keys(config).find(k => k.toUpperCase() === upperVal)
                return match || val
            }

            setFormData(prev => ({
                ...prev,
                number: initialData.number || "", // Handle null number
                type: initialData.type || "PROCESS",
                area: initialData.area,
                actionType: initialData.actionType || "",
                folderName: initialData.folderName || "",
                clientId: initialData.clientId || "",
                status: normalize(initialData.status, "STATUS") || "ACTIVE",
                position: normalize(initialData.position, "POSITION"),
                opponent: initialData.opponent || "",
                opponentPosition: normalize(initialData.opponentPosition, "POSITION"),
                district: initialData.district || "",
                court: initialData.court || "",
                link: initialData.link || "",
                claimValue: initialData.claimValue?.toString() || "",
                responsibleLawyerId: initialData.responsibleLawyerId || ""
            }))


            // Load additional parties if they exist
            // (Assumes initialData includes these relations)
            if (initialData.authors) {
                setAuthors(initialData.authors.map((a: any) => ({ clientId: a.clientId, position: a.position })))
            }
            if (initialData.opponents) {
                setOpponents(initialData.opponents.map((o: any) => ({ clientId: o.clientId, position: o.position })))
            }
        }
    }, [initialData])

    // --- Auto-Fill Logic ---
    useEffect(() => {
        // Auto-Folder Name
        if (!isEditing && formData.clientId) {
            const cName = clients.find(c => c.id === formData.clientId)?.name?.split(" ").slice(0, 2).join(" ") || ""
            const oName = clients.find(c => c.id === formData.opponent)?.name?.split(" ").slice(0, 2).join(" ") || ""
            if (cName) {
                setFormData(prev => ({ ...prev, folderName: oName ? `${cName} vs ${oName}` : cName }))
            }
        }
    }, [formData.clientId, formData.opponent, clients, isEditing])

    // Auto-Fill Opponent Position
    useEffect(() => {
        if (formData.position) {
            const antonyms: Record<string, string> = {
                "AUTOR": "REU",
                "REU": "AUTOR",
                "RECLAMANTE": "RECLAMADA",
                "RECLAMADA": "RECLAMANTE",
                "REQUERENTE": "REQUERIDO",
                "REQUERIDO": "REQUERENTE"
            }
            const antonym = antonyms[formData.position]
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
        setOpponents([...opponents, { clientId: "", position: "" }])
    }

    const handleRemoveOpponent = (index: number) => {
        setOpponents(opponents.filter((_, i) => i !== index))
    }

    const handleOpponentChange = (index: number, field: "clientId" | "position", value: string) => {
        const newOpponents = [...opponents]
        newOpponents[index][field] = value
        setOpponents(newOpponents)
    }

    const handleOpponentCreated = (newClient: { id: string, name: string }) => {
        // Instantaneous selection in parent
        setFormData(prev => ({ ...prev, opponent: newClient.id, opponentPosition: "REU" }))
        // Fast re-fetch
        getClientsForSelect().then(setClients)
        router.refresh()
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
        if (formData.type === 'PROCESS' && !formData.number.trim()) errors.push("Número do processo é obrigatório")
        if (!formData.clientId) errors.push("Cliente é obrigatório")
        if (!formData.area) errors.push("Área de atuação é obrigatória")

        if (errors.length > 0) {
            setFormErrors(errors)
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha todos os campos obrigatórios antes de salvar.",
                type: "error"
            })
            return
        }

        setLoading(true)

        // Handle Custom Action Type creation if needed
        const finalActionType = formData.actionType
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

        // Handle Custom Court/District persistence
        if (formData.court && !courts.includes(formData.court)) {
            try { await createCourt(formData.court) } catch (err) { console.warn("Could not save custom court", err) }
        }
        if (formData.district && !districts.includes(formData.district)) {
            try { await createDistrict(formData.district) } catch (err) { console.warn("Could not save custom district", err) }
        }

        try {
            const payload = {
                ...formData,
                claimValue: formData.claimValue, // The sanitizer will handle parsing the string "R$ 1.500,00"
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
            toast({ title: "Erro ao salvar", description: error.message || "Ocorreu um erro inesperado.", type: "error" })
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

            {/* Process Type Selection - Only on Creation */}
            {!isEditing && (
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Tipo de Cadastro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: "PROCESS" }))}
                                className={cn(
                                    "relative flex items-center gap-4 p-6 border rounded-xl transition-all text-left group hover:shadow-md",
                                    formData.type === "PROCESS"
                                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600"
                                        : "border-slate-200 hover:border-blue-300 bg-white"
                                )}
                            >
                                <div className={cn(
                                    "p-3 rounded-full transition-colors",
                                    formData.type === "PROCESS" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                                )}>
                                    <Scale className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn("font-semibold mb-1", formData.type === "PROCESS" ? "text-blue-900" : "text-slate-900")}>Processo Judicial</h3>
                                    <p className="text-sm text-slate-500 leading-snug">
                                        Controle de processos com numeração oficial, andamentos e publicações.
                                    </p>
                                </div>
                                {formData.type === "PROCESS" && (
                                    <div className="absolute top-4 right-4">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: "CASE" }))}
                                className={cn(
                                    "relative flex items-center gap-4 p-6 border rounded-xl transition-all text-left group hover:shadow-md",
                                    formData.type === "CASE"
                                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600"
                                        : "border-slate-200 hover:border-emerald-300 bg-white"
                                )}
                            >
                                <div className={cn(
                                    "p-3 rounded-full transition-colors",
                                    formData.type === "CASE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                )}>
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn("font-semibold mb-1", formData.type === "CASE" ? "text-emerald-900" : "text-slate-900")}>Caso / Consultivo</h3>
                                    <p className="text-sm text-slate-500 leading-snug">
                                        Gestão de demandas internas, consultorias e administrativo (sem numeração obrigatória).
                                    </p>
                                </div>
                                {formData.type === "CASE" && (
                                    <div className="absolute top-4 right-4">
                                        <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>{isEditing ? "Editar Processo" : "Dados Principais"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Row 1 */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome da pasta</Label>
                            <Input
                                value={formData.folderName}
                                onChange={(e) => handleChange("folderName", e.target.value)}
                                className="bg-gray-100 text-black border-none"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Status do processo</Label>
                            <Combobox
                                value={formData.status}
                                onValueChange={(v) => handleChange("status", v)}
                                options={Object.entries(PROCESS_UI_CONFIG.STATUS).map(([key, config]) => ({ value: key, label: config.label }))}
                                placeholder="Selecione..."
                                showAddCustom={false}
                                renderItem={(op) => {
                                    const config = (PROCESS_UI_CONFIG.STATUS as any)[op.value]
                                    return (
                                        <div className="flex items-center gap-2">
                                            {config?.color && <div className={cn("h-2 w-2 rounded-full", config.color)} />}
                                            <span>{op.label}</span>
                                        </div>
                                    )
                                }}
                            />
                        </div>
                    </div>

                    {/* Row 2: Client */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label className={cn(formErrors.includes("Cliente é obrigatório") && "text-destructive")}>Cliente *</Label>
                            <Combobox
                                value={formData.clientId}
                                onValueChange={(v) => {
                                    handleChange("clientId", v)
                                    if (v) setFormErrors(prev => prev.filter(e => e !== "Cliente é obrigatório"))
                                }}
                                options={clients.map(c => ({ value: c.id, label: c.name, search: `${c.name} ${c.cpfCnpj || ""}` }))}
                                placeholder="Selecione..."
                                searchPlaceholder="Buscar cliente por nome ou CPF..."
                                className={cn(!formData.clientId && formErrors.includes("Cliente é obrigatório") && "border-destructive ring-destructive")}
                                fallbackLabel={initialData?.client?.name}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Posição do Cliente no Processo</Label>
                            <Combobox
                                value={formData.position}
                                onValueChange={(v) => handleChange("position", v)}
                                options={Object.entries(PROCESS_UI_CONFIG.POSITION).map(([key, config]) => ({ value: key, label: config.label }))}
                                placeholder="Selecione..."
                                showAddCustom={false}
                            />
                        </div>
                    </div>

                    {/* Additional Authors */}
                    <div className="space-y-2">
                        <Button type="button" variant="ghost" className="text-blue-600 hover:text-blue-700 pl-0 hover:bg-transparent" onClick={handleAddAuthor}>
                            <Plus className="h-4 w-4 mr-1 bg-blue-600 text-white rounded-full p-0.5" /> Parte autora ou representante
                        </Button>
                        {authors.map((author, index) => (
                            <div key={`author-${index}`} className="grid md:grid-cols-2 gap-4 items-end bg-gray-50 p-2 rounded-md border border-gray-100">
                                <div className="space-y-1">
                                    <Combobox
                                        value={author.clientId}
                                        onValueChange={(v) => handleAuthorChange(index, "clientId", v)}
                                        options={clients.map(c => ({ value: c.id, label: c.name, search: `${c.name} ${c.cpfCnpj || ""}` }))}
                                        placeholder="Selecione..."
                                        searchPlaceholder="Buscar por nome ou CPF..."
                                        customEmpty={(search) => (
                                            <div className="p-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full text-xs"
                                                    onPointerDown={(e) => e.preventDefault()}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setRegisterOpponentOpen(true);
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-3 w-3" /> Cadastrar "{search}"
                                                </Button>
                                            </div>
                                        )}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1 flex gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-gray-300">Posição</Label>
                                        <Combobox
                                            value={author.position}
                                            onValueChange={(v) => handleAuthorChange(index, "position", v)}
                                            options={Object.entries(PROCESS_UI_CONFIG.POSITION).map(([key, config]) => ({ value: key, label: config.label }))}
                                            placeholder="Selecione..."
                                            showAddCustom={false}
                                            className="h-8"
                                        />
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
                            <Label>Parte Contrária</Label>
                            <Combobox
                                value={formData.opponent}
                                onValueChange={(v) => handleChange("opponent", v)}
                                options={clients.map(c => ({ value: c.id, label: c.name, search: `${c.name} ${c.cpfCnpj || ""}` }))}
                                placeholder="Selecione ou busque..."
                                searchPlaceholder="Buscar por nome ou CPF..."
                                fallbackLabel={initialData?.opponentName}
                                customEmpty={(search) => (
                                    <div className="p-4 flex flex-col items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Nenhum encontrado em Clientes.</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onPointerDown={(e) => e.preventDefault()}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRegisterOpponentClick(e);
                                            }}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Cadastrar "{search}" como Cliente
                                        </Button>
                                    </div>
                                )}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Posição da Parte Contrária no Processo</Label>
                            <Combobox
                                value={formData.opponentPosition}
                                onValueChange={(v) => handleChange("opponentPosition", v)}
                                options={Object.entries(PROCESS_UI_CONFIG.POSITION).map(([key, config]) => ({ value: key, label: config.label }))}
                                placeholder="Selecione..."
                                showAddCustom={false}
                            />
                        </div>
                    </div>

                    {/* Additional Opponents */}
                    <div className="space-y-2">
                        <Button type="button" variant="ghost" className="text-blue-600 hover:text-blue-700 pl-0 hover:bg-transparent" onClick={handleAddOpponent}>
                            <Plus className="h-4 w-4 mr-1 bg-blue-600 text-white rounded-full p-0.5" /> Parte contrária ou interessado
                        </Button>
                        {opponents.map((opp, index) => (
                            <div key={`opponent-${index}`} className="grid md:grid-cols-2 gap-4 items-end bg-gray-50 p-2 rounded-md border border-gray-100">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Nome</Label>
                                    <Combobox
                                        value={opp.clientId}
                                        onValueChange={(v) => handleOpponentChange(index, "clientId", v)}
                                        options={clients.map(c => ({ value: c.id, label: c.name, search: `${c.name} ${c.cpfCnpj || ""}` }))}
                                        placeholder="Selecione..."
                                        searchPlaceholder="Buscar por nome ou CPF..."
                                        customEmpty={(search) => (
                                            <div className="p-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full text-xs"
                                                    onPointerDown={(e) => e.preventDefault()}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setRegisterOpponentOpen(true);
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-3 w-3" /> Cadastrar "{search}"
                                                </Button>
                                            </div>
                                        )}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1 flex gap-2">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Posição</Label>
                                        <Combobox
                                            value={opp.position}
                                            onValueChange={(v) => handleOpponentChange(index, "position", v)}
                                            options={Object.entries(PROCESS_UI_CONFIG.POSITION).map(([key, config]) => ({ value: key, label: config.label }))}
                                            placeholder="Selecione..."
                                            showAddCustom={false}
                                            className="h-8"
                                        />
                                    </div>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveOpponent(index)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Row 4: Details */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Number - Conditional */}
                        {formData.type === 'PROCESS' && (
                            <div className="space-y-2">
                                <Label htmlFor="number" className={cn(formErrors.includes("Número do processo é obrigatório") && "text-destructive")}>Número do Processo <span className="text-destructive">*</span></Label>
                                <Input
                                    id="number"
                                    placeholder="0000000-00.0000.0.00.0000"
                                    value={formData.number}
                                    onChange={(e) => {
                                        setFormData({ ...formData, number: e.target.value })
                                        if (e.target.value.trim()) setFormErrors(prev => prev.filter(e => e !== "Número do processo é obrigatório"))
                                    }}
                                    className={cn("bg-gray-100 text-black border-none focus-visible:ring-1", !formData.number && formErrors.includes("Número do processo é obrigatório") && "ring-1 ring-destructive")}
                                />
                            </div>
                        )}
                        <div className="space-y-2 flex flex-col">
                            <Label className={cn(formErrors.includes("Área de atuação é obrigatória") && "text-destructive")}>Área de atuação *</Label>
                            <Combobox
                                value={formData.area}
                                onValueChange={(v) => {
                                    handleChange("area", v)
                                    if (v) setFormErrors(prev => prev.filter(e => e !== "Área de atuação é obrigatória"))
                                }}
                                options={Object.entries(PROCESS_UI_CONFIG.AREA).map(([key, config]) => ({ value: key, label: config.label }))}
                                placeholder="Selecione ou digite..."
                                showAddCustom={true}
                                searchPlaceholder="Buscar ou adicionar área..."
                                className={cn(!formData.area && formErrors.includes("Área de atuação é obrigatória") && "border-destructive ring-destructive")}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Tipo de ação</Label>
                            <Combobox
                                value={formData.actionType}
                                onValueChange={(v) => handleChange("actionType", v)}
                                options={actionTypes.map(t => ({ value: t, label: t }))}
                                placeholder="Selecione ou digite..."
                                searchPlaceholder="Buscar ou criar tipo..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor da Causa</Label>
                            <MoneyInput
                                value={formData.claimValue}
                                onValueChange={(v) => handleChange("claimValue", v)}
                                className="bg-gray-100 text-black border-none"
                            />
                        </div>
                    </div>

                    {/* Row 5: Link, Court */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Link do processo</Label>
                            <Input
                                value={formData.link}
                                onChange={(e) => handleChange("link", e.target.value)}
                                className="bg-gray-100 text-black border-none"
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Vara</Label>
                            <Combobox
                                value={formData.court}
                                onValueChange={(v) => handleChange("court", v)}
                                options={courts.map(c => ({ value: c, label: c }))}
                                placeholder="Selecione..."
                                showAddCustom={true}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Comarca</Label>
                            <Combobox
                                value={formData.district}
                                onValueChange={(v) => handleChange("district", v)}
                                options={districts.map(d => ({ value: d, label: d }))}
                                placeholder="Selecione..."
                                showAddCustom={true}
                            />
                        </div>
                    </div>

                    {/* Row 6: Responsible */}
                    <div className="space-y-2 flex flex-col">
                        <Label>Advogado Responsável</Label>
                        <Combobox
                            value={formData.responsibleLawyerId}
                            onValueChange={(v) => handleChange("responsibleLawyerId", v)}
                            options={users.map(u => ({ value: u.id, label: u.name || u.email }))}
                            placeholder="Selecione..."
                            searchPlaceholder="Buscar advogado..."
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="w-full md:w-[200px]" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Processo
                        </Button>
                    </div>
                </CardContent >
            </Card >
        </form >
    )
}
