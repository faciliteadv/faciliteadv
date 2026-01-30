"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Search, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient, updateClientAction } from "@/lib/actions/client-actions"
import { formatCPF, formatCNPJ, formatPhone as formatPhoneUtil } from "@/lib/utils/validation"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const COUNTRY_CODES = [
    { code: "+55", country: "BR", mask: "(99) 99999-9999" },
    { code: "+1", country: "US", mask: "(999) 999-9999" },
    { code: "+351", country: "PT", mask: "999 999 999" },
]

const BANKS = [
    { value: "001", label: "Banco do Brasil" },
    { value: "104", label: "Caixa Econômica Federal" },
    { value: "237", label: "Bradesco" },
    { value: "341", label: "Itaú" },
    { value: "033", label: "Santander" },
    { value: "260", label: "Nubank" },
    { value: "077", label: "Inter" },
    { value: "655", label: "Neon" },
    { value: "290", label: "PagBank" },
    { value: "380", label: "PicPay" },
    { value: "212", label: "Original" },
    { value: "079", label: "PicPay Bank" }, // Sometimes referred differently
    { value: "other", label: "Outro" }
]

const PIX_TYPES = [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Celular" },
    { value: "random", label: "Chave Aleatória" },
]

export interface ClientFormProps {
    initialData?: any
    isEditing?: boolean
}

// Helper to capitalize words
const toTitleCase = (str: string) => {
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

// Document formatting functions
const formatRG = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8, 9)}`
}

const formatCTPS = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 6) return cleaned
    return `${cleaned.slice(0, 6)}/${cleaned.slice(6, 11)}`
}

const formatPIS = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8)}`
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10, 11)}`
}

export function ClientForm({ initialData, isEditing = false }: ClientFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [fetchingCep, setFetchingCep] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // States
    const [clientType, setClientType] = useState<"PF" | "PJ">(initialData?.type || "PF")
    const [phoneCountry, setPhoneCountry] = useState("+55")
    const [whatsappCountry, setWhatsappCountry] = useState("+55")
    const [customBankName, setCustomBankName] = useState("")

    // Additional Contacts State
    const [additionalContacts, setAdditionalContacts] = useState<{ name: string, relation: string, phone: string }[]>([])

    // Main Form Data
    const [formData, setFormData] = useState({
        name: "",
        cpfCnpj: "",
        email: "",
        phone: "",
        whatsapp: "",
        rg: "",
        ctps: "",
        pis: "",
        govAccessPassword: "",
        fatherName: "",
        motherName: "",
        profession: "",
        civilStatus: "",
        acquisitionChannel: "",
        address: {
            street: "",
            number: "",
            neighborhood: "",
            city: "",
            state: "",
            zip: "",
            complement: ""
        },
        bankDetails: {
            bank: "",
            agency: "",
            account: "",
            pixKey: "",
            pixType: ""
        }
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    // Initialize data
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                cpfCnpj: initialData.cpfCnpj || "",
                email: initialData.email || "",
                phone: (initialData.contacts as any)?.phone || "",
                whatsapp: initialData.whatsapp || "",
                rg: initialData.rg || "",
                ctps: initialData.ctps || "",
                pis: initialData.pis || "",
                govAccessPassword: initialData.govAccessPassword || "",
                fatherName: initialData.fatherName || "",
                motherName: initialData.motherName || "",
                profession: initialData.profession || "",
                civilStatus: initialData.civilStatus || "",
                acquisitionChannel: initialData.acquisitionChannel || "",
                address: {
                    street: initialData.address?.street || "",
                    number: initialData.address?.number || "",
                    neighborhood: initialData.address?.neighborhood || "",
                    city: initialData.address?.city || "",
                    state: initialData.address?.state || "",
                    zip: initialData.address?.zip || "",
                    complement: initialData.address?.complement || ""
                },
                bankDetails: {
                    bank: (initialData.bankDetails as any)?.bank || "",
                    agency: (initialData.bankDetails as any)?.agency || "",
                    account: (initialData.bankDetails as any)?.account || "",
                    pixKey: (initialData.bankDetails as any)?.pixKey || "",
                    pixType: (initialData.bankDetails as any)?.pixType || ""
                }
            })
            // Load additional contacts
            const contacts: any[] = []
            if (initialData.messageContactName) {
                contacts.push({
                    name: initialData.messageContactName,
                    relation: initialData.messageContactRelation || "",
                    phone: ""
                })
            }
            if ((initialData.contacts as any)?.list) {
                contacts.push(...(initialData.contacts as any).list)
            }
            if (contacts.length === 0) {
                contacts.push({ name: "", relation: "", phone: "" })
            }
            setAdditionalContacts(contacts)

            // Load custom bank name if bank is not in standard list
            if ((initialData.bankDetails as any)?.bank) {
                const bankName = (initialData.bankDetails as any).bank
                const isStandardBank = BANKS.some(b => b.label === bankName)
                if (!isStandardBank) {
                    setCustomBankName(bankName)
                }
            }
        } else {
            setAdditionalContacts([{ name: "", relation: "", phone: "" }])
        }
    }, [initialData])

    // Formatters

    const validateField = (name: string, value: string) => {
        let error = ""
        if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = "Formato de email inválido."
        }
        if ((name === "phone" || name === "whatsapp") && value) {
            if (/[a-zA-Z]/.test(value)) error = "Sem letras."
            else if (value.replace(/\D/g, "").length < 8) error = "Curto demais."
        }
        if (name === "cpfCnpj") {
            const clean = value.replace(/\D/g, "")
            if (clientType === 'PF' && clean.length !== 11 && clean.length > 0) error = "CPF inválido."
            if (clientType === 'PJ' && clean.length !== 14 && clean.length > 0) error = "CNPJ inválido."
        }
        setErrors(prev => ({ ...prev, [name]: error }))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target

        // Masks
        if (name === "cpfCnpj") value = clientType === 'PF' ? formatCPF(value) : formatCNPJ(value)
        if (name === "whatsapp") value = formatPhoneUtil(value)
        if (name === "address.zip") value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')
        if (name === "rg") value = formatRG(value)
        if (name === "ctps") value = formatCTPS(value)
        if (name === "pis") value = formatPIS(value)

        validateField(name, value)

        if (name.startsWith("address.")) {
            const field = name.split(".")[1]
            setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }))

            // Auto fetch CEP if full
            if (name === "address.zip" && value.replace(/\D/g, "").length === 8) {
                // We will rely on the blur or user action, but since it's nice:
                // Let's trigger fetch if we wanted automatically. But the user asked for "Buscar endereço pelo CEP".
                // I will add a button or just do it inside this event with debouncing. 
                // A better approach is often an explicit search or onBlur. 
                // Let's call it explicitly if data is valid.
                fetchAddressByCEP(value)
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    // Additional Contacts Logic
    const handleContactChange = (index: number, field: string, value: string) => {
        const updated = [...additionalContacts]
        if (field === "phone") value = formatPhoneUtil(value)
        updated[index] = { ...updated[index], [field]: value }
        setAdditionalContacts(updated)
    }
    const addContact = () => setAdditionalContacts([...additionalContacts, { name: "", relation: "", phone: "" }])
    const removeContact = (idx: number) => setAdditionalContacts(additionalContacts.filter((_, i) => i !== idx))

    const fetchCompanyData = async () => {
        const cnpj = formData.cpfCnpj.replace(/\D/g, "")
        if (cnpj.length !== 14) return alert("CNPJ inválido")
        setFetching(true)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
            if (!response.ok) throw new Error("Erro API")
            const data = await response.json()
            setFormData(prev => ({
                ...prev,
                name: toTitleCase(data.razao_social || data.nome_fantasia || prev.name),
                email: data.email?.toLowerCase() || prev.email,
                address: {
                    street: toTitleCase(data.logradouro || prev.address.street),
                    number: data.numero || prev.address.number,
                    neighborhood: toTitleCase(data.bairro || prev.address.neighborhood),
                    city: toTitleCase(data.municipio || prev.address.city),
                    state: data.uf || prev.address.state,
                    zip: data.cep || prev.address.zip,
                    complement: data.complemento || prev.address.complement
                }
            }))
        } catch (e) { alert("Erro ao buscar CNPJ"); console.error(e) }
        finally { setFetching(false) }
    }

    const fetchCPFData = async () => {
        const cpf = formData.cpfCnpj.replace(/\D/g, "")
        if (cpf.length !== 11) return alert("CPF inválido")
        setFetching(true)
        try {
            const { fetchCPFData: fetchCPFAction } = await import("@/lib/actions/client-actions")
            const result = await fetchCPFAction(formData.cpfCnpj)

            if (!result.success) {
                throw new Error(result.error)
            }

            if (result.data?.name) {
                setFormData(prev => ({
                    ...prev,
                    name: result.data.name || prev.name,
                }))
            }

            toast({
                title: "CPF consultado",
                description: result.data?.name
                    ? `Nome: ${result.data.name}`
                    : (result.data?.message || "CPF válido"),
                type: "success"
            })
        } catch (e: any) {
            toast({
                title: "Erro ao buscar CPF",
                description: e.message || "Verifique o CPF e tente novamente",
                type: "error"
            })
            console.error(e)
        }
        finally { setFetching(false) }
    }

    const fetchAddressByCEP = async (cepValue: string) => {
        const cep = cepValue.replace(/\D/g, "")
        if (cep.length !== 8) return

        setFetchingCep(true)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
            if (!response.ok) throw new Error("Erro API CEP")
            const data = await response.json()
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    street: toTitleCase(data.street || prev.address.street),
                    neighborhood: toTitleCase(data.neighborhood || prev.address.neighborhood),
                    city: toTitleCase(data.city || prev.address.city),
                    state: data.state || prev.address.state,
                    zip: cepValue // Keep formatted
                }
            }))
        } catch (e) {
            console.error("CEP fetch error", e)
            // Silent fail or toast?
        } finally {
            setFetchingCep(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Frontend validation before submission
        const validationErrors: Record<string, string> = {}

        // Required fields
        if (!formData.name || formData.name.trim().length < 2) {
            validationErrors.name = "Nome deve ter pelo menos 2 caracteres"
        }

        if (!formData.cpfCnpj) {
            validationErrors.cpfCnpj = "CPF/CNPJ é obrigatório"
        } else {
            const clean = formData.cpfCnpj.replace(/\D/g, "")
            if (clientType === 'PF' && clean.length !== 11) {
                validationErrors.cpfCnpj = "CPF deve ter 11 dígitos"
            }
            if (clientType === 'PJ' && clean.length !== 14) {
                validationErrors.cpfCnpj = "CNPJ deve ter 14 dígitos"
            }
        }

        // Email validation (only if provided)
        if (formData.email && formData.email.trim() !== '') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                validationErrors.email = "Email inválido"
            }
        }

        // Show validation errors
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            const firstError = Object.values(validationErrors)[0]
            toast({
                title: "Campos inválidos",
                description: firstError,
                type: "error"
            })
            return
        }

        setLoading(true)

        // Prep data - convert empty strings to null
        const validContacts = additionalContacts.filter(c => c.name || c.phone)
        const primaryMsgContact = validContacts[0] || { name: "", relation: "", phone: "" }
        const otherContacts = validContacts.slice(1)

        // Clean payload - convert empty strings to null
        const cleanFormData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [
                key,
                typeof value === 'string' && value.trim() === '' ? null : value
            ])
        )

        const payload = {
            ...cleanFormData,
            type: clientType,
            messageContactName: primaryMsgContact.name || null,
            messageContactRelation: primaryMsgContact.relation || null,
            phone: primaryMsgContact.phone || null,
            contacts: {
                phone: primaryMsgContact.phone || null,
                list: otherContacts
            },
            bankDetails: {
                ...formData.bankDetails,
                bank: formData.bankDetails.bank === "Outro" && customBankName ? customBankName : formData.bankDetails.bank
            }
        }

        try {
            if (isEditing && initialData?.id) {
                await updateClientAction(initialData.id, payload)
                toast({ title: "Atualizado", description: "Cliente atualizado com sucesso.", type: "success" })
            } else {
                await createClient(payload)
                toast({ title: "Criado", description: "Cliente criado com sucesso.", type: "success" })
            }
            router.push("/clients")
            router.refresh()
        } catch (error: any) {
            console.error(error)

            // Parse Zod errors if present
            let errorMessage = error.message || "Erro ao salvar"
            if (error.issues && Array.isArray(error.issues)) {
                errorMessage = error.issues.map((issue: any) =>
                    `${issue.path.join('.')}: ${issue.message}`
                ).join(', ')
            }

            toast({ title: "Erro ao salvar", description: errorMessage, type: "error" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{isEditing ? "Editar Cliente" : "Dados do Cliente"}</CardTitle>
                        <Select value={clientType} onValueChange={(v: any) => setClientType(v)}>
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PF">Pessoa Física</SelectItem>
                                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Identification */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={errors.cpfCnpj ? "text-red-500" : ""}>
                                CPF/CNPJ <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    name="cpfCnpj"
                                    value={formData.cpfCnpj}
                                    onChange={handleInputChange}
                                    className={errors.cpfCnpj ? "border-red-500" : ""}
                                    maxLength={clientType === 'PF' ? 14 : 18}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={clientType === 'PJ' ? fetchCompanyData : fetchCPFData}
                                    disabled={fetching}
                                    title={clientType === 'PJ' ? "Buscar dados do CNPJ" : "Buscar dados do CPF"}
                                >
                                    {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.cpfCnpj && <p className="text-red-500 text-xs">{errors.cpfCnpj}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className={errors.name ? "text-red-500" : ""}>
                                Nome Completo / Razão Social <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                        </div>
                    </div>

                    <Separator />

                    {/* Main Contacts & Acquisition */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" value={formData.email} onChange={handleInputChange} className={errors.email ? "border-red-500" : ""} />
                            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                        </div>

                        {/* WhatsApp moved here */}
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <div className="flex gap-2">
                                <Select value={whatsappCountry} onValueChange={setWhatsappCountry}>
                                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {COUNTRY_CODES.map(c => <SelectItem key={c.code} value={c.code}>{c.country}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleInputChange}
                                    placeholder="(99) 99999-9999"
                                    className={errors.whatsapp ? "border-red-500 flex-1" : "flex-1"}
                                />
                            </div>
                        </div>

                        {/* Acquisition Channel moved here */}
                        <div className="space-y-2">
                            <Label>Canal de Aquisição</Label>
                            <Select value={formData.acquisitionChannel} onValueChange={(v) => setFormData(p => ({ ...p, acquisitionChannel: v }))}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADS">Tráfego Pago (Ads)</SelectItem>
                                    <SelectItem value="REFERRAL">Indicação</SelectItem>
                                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                    <SelectItem value="GOOGLE">Google Orgânico</SelectItem>
                                    <SelectItem value="OTHER">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Bank Details */}
                    <div className="space-y-2">
                        <Label className="font-semibold">Dados Bancários</Label>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label>Banco</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !formData.bankDetails.bank && "text-muted-foreground"
                                            )}
                                        >
                                            {formData.bankDetails.bank
                                                ? BANKS.find((b) => b.label === formData.bankDetails.bank)?.label || formData.bankDetails.bank
                                                : "Selecione o banco"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar banco..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhum banco encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {BANKS.map((bank) => (
                                                        <CommandItem
                                                            value={bank.label}
                                                            key={bank.value}
                                                            onPointerDown={(e) => e.preventDefault()}
                                                            onSelect={(currentValue) => {
                                                                setFormData(p => ({
                                                                    ...p,
                                                                    bankDetails: {
                                                                        ...p.bankDetails,
                                                                        bank: currentValue === "outro" ? "Outro" : currentValue
                                                                    }
                                                                }))
                                                                if (bank.value !== "other") {
                                                                    setCustomBankName("")
                                                                }
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.bankDetails.bank === bank.label ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {bank.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {formData.bankDetails.bank === "Outro" && (
                                    <Input
                                        className="mt-2"
                                        placeholder="Digite o nome do banco"
                                        value={customBankName}
                                        onChange={(e) => setCustomBankName(e.target.value)}
                                    />
                                )}
                            </div>
                            <div className="space-y-2"><Label>Agência</Label><Input value={formData.bankDetails.agency} onChange={e => setFormData(p => ({ ...p, bankDetails: { ...p.bankDetails, agency: e.target.value.replace(/\D/g, '') } }))} placeholder="0000" maxLength={6} /></div>
                            <div className="space-y-2"><Label>Conta</Label><Input value={formData.bankDetails.account} onChange={e => setFormData(p => ({ ...p, bankDetails: { ...p.bankDetails, account: e.target.value.replace(/[^0-9-]/g, '') } }))} placeholder="00000-0" maxLength={15} /></div>
                            <div className="space-y-2"><Label>Tipo PIX</Label>
                                <Select value={(formData.bankDetails as any).pixType || ""} onValueChange={(v) => setFormData(p => ({ ...p, bankDetails: { ...p.bankDetails, pixType: v } }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {PIX_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Chave PIX</Label><Input value={formData.bankDetails.pixKey} onChange={e => setFormData(p => ({ ...p, bankDetails: { ...p.bankDetails, pixKey: e.target.value } }))} placeholder="Chave..." /></div>
                        </div>
                    </div>

                    {/* PF Documents */}
                    {clientType === 'PF' && (
                        <>
                            <Separator />
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label>RG</Label><Input name="rg" value={formData.rg} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>CTPS</Label><Input name="ctps" value={formData.ctps} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>PIS</Label><Input name="pis" value={formData.pis} onChange={handleInputChange} /></div>
                                <div className="space-y-2">
                                    <Label>Senha GOV.BR</Label>
                                    <div className="relative">
                                        <Input
                                            name="govAccessPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={isEditing ? "(Oculto)" : ""}
                                            value={formData.govAccessPassword}
                                            onChange={handleInputChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nome da Mãe</Label><Input name="motherName" value={formData.motherName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Nome do Pai</Label><Input name="fatherName" value={formData.fatherName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Profissão</Label><Input name="profession" value={formData.profession} onChange={handleInputChange} /></div>
                                <div className="space-y-2">
                                    <Label>Estado Civil</Label>
                                    <Select value={formData.civilStatus} onValueChange={(v) => setFormData(p => ({ ...p, civilStatus: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                                            <SelectItem value="CASADO">Casado(a)</SelectItem>
                                            <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                                            <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
                                            <SelectItem value="UNIAO_ESTAVEL">União Estável</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Additional Contacts (Replacing old section) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-sm">Contatos Adicionais (Recado)</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addContact}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                        </div>
                        <div className="space-y-3">
                            {[...additionalContacts].sort((a, b) => a.name.localeCompare(b.name)).map((contact, idx) => (
                                <div key={idx} className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Nome</Label>
                                        <Input value={contact.name} onChange={e => handleContactChange(idx, 'name', e.target.value)} placeholder="Ex: Maria" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Vínculo</Label>
                                        <Input value={contact.relation} onChange={e => handleContactChange(idx, 'relation', e.target.value)} placeholder="Ex: Esposa" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Telefone</Label>
                                        <Input value={contact.phone} onChange={e => handleContactChange(idx, 'phone', e.target.value)} placeholder="(00) 0000-0000" />
                                    </div>
                                    {additionalContacts.length > 1 && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeContact(idx)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>CEP</Label>
                            <div className="relative">
                                <Input name="address.zip" value={formData.address.zip} onChange={handleInputChange} className={errors["address.zip"] ? "border-red-500" : ""} maxLength={9} />
                                {fetchingCep && <div className="absolute right-3 top-2.5"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2"><Label>Rua</Label><Input name="address.street" value={formData.address.street} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>Número</Label><Input name="address.number" value={formData.address.number} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>Bairro</Label><Input name="address.neighborhood" value={formData.address.neighborhood} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>Cidade</Label><Input name="address.city" value={formData.address.city} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>UF</Label><Input name="address.state" value={formData.address.state} onChange={handleInputChange} maxLength={2} /></div>
                        <div className="space-y-2"><Label>Comp.</Label><Input name="address.complement" value={formData.address.complement} onChange={handleInputChange} /></div>
                    </div>
                </CardContent>
                <div className="p-6 pt-0 flex justify-end">
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Atualizar Cliente" : "Salvar Cliente"}
                    </Button>
                </div>
            </Card>
        </form>
    )
}
