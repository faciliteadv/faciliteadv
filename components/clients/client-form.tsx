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

const COUNTRY_CODES = [
    { code: "+55", country: "BR", mask: "(99) 99999-9999" },
    { code: "+1", country: "US", mask: "(999) 999-9999" },
    { code: "+351", country: "PT", mask: "999 999 999" },
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
        acquisitionChannel: "",
        address: {
            street: "",
            number: "",
            neighborhood: "",
            city: "",
            state: "",
            zip: "",
            complement: ""
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
                acquisitionChannel: initialData.acquisitionChannel || "",
                address: {
                    street: initialData.address?.street || "",
                    number: initialData.address?.number || "",
                    neighborhood: initialData.address?.neighborhood || "",
                    city: initialData.address?.city || "",
                    state: initialData.address?.state || "",
                    zip: initialData.address?.zip || "",
                    complement: initialData.address?.complement || ""
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
        } else {
            setAdditionalContacts([{ name: "", relation: "", phone: "" }])
        }
    }, [initialData])

    // Formatters
    const formatCPF = (value: string) => {
        return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
    }
    const formatCNPJ = (value: string) => {
        return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
    }
    const formatPhone = (value: string, countryCode: string) => {
        const clean = value.replace(/\D/g, "")
        if (countryCode === "+55" && clean.length <= 11) {
            return clean.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2')
        }
        return clean
    }
    const formatCEP = (value: string) => {
        return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')
    }

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
        if (name === "whatsapp") value = formatPhone(value, whatsappCountry)
        if (name === "address.zip") value = formatCEP(value)

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
        if (field === "phone") value = formatPhone(value, "+55") // Default BR for now
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
        setLoading(true)

        // Prep data
        const validContacts = additionalContacts.filter(c => c.name || c.phone)
        const primaryMsgContact = validContacts[0] || { name: "", relation: "", phone: "" }
        const otherContacts = validContacts.slice(1)

        const payload = {
            ...formData,
            type: clientType,
            messageContactName: primaryMsgContact.name,
            messageContactRelation: primaryMsgContact.relation,
            phone: primaryMsgContact.phone,
            contacts: {
                phone: primaryMsgContact.phone,
                list: otherContacts
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
            toast({ title: "Erro", description: error.message || "Erro ao salvar", type: "error" })
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
                            <Label>CPF/CNPJ</Label>
                            <div className="flex gap-2">
                                <Input
                                    name="cpfCnpj"
                                    value={formData.cpfCnpj}
                                    onChange={handleInputChange}
                                    className={errors.cpfCnpj ? "border-red-500" : ""}
                                />
                                {clientType === 'PJ' && (
                                    <Button type="button" variant="outline" size="icon" onClick={fetchCompanyData} disabled={fetching}>
                                        {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                            {errors.cpfCnpj && <p className="text-red-500 text-xs">{errors.cpfCnpj}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Nome Completo / Razão Social</Label>
                            <Input name="name" value={formData.name} onChange={handleInputChange} required />
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
                            {additionalContacts.map((contact, idx) => (
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
