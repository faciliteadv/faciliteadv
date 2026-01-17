"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Search } from "lucide-react"
import { createClient } from "@/lib/actions/client-actions"
import { useToast } from "@/hooks/use-toast"

const COUNTRY_CODES = [
    { code: "+55", country: "BR", mask: "(99) 99999-9999" },
    { code: "+1", country: "US", mask: "(999) 999-9999" },
    { code: "+351", country: "PT", mask: "999 999 999" },
]

export default function NewClientPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [clientType, setClientType] = useState<"PF" | "PJ">("PF")

    // Default country codes
    const [phoneCountry, setPhoneCountry] = useState("+55")
    const [whatsappCountry, setWhatsappCountry] = useState("+55")

    // Form States
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
        messageContactName: "",
        messageContactRelation: "",
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

    // Formatters
    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '') // Remove non-digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1') // Limit size
    }

    const formatCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const formatPhone = (value: string, countryCode: string) => {
        const clean = value.replace(/\D/g, "")
        // Simple formatting for BR, generic for others for now
        if (countryCode === "+55") {
            // (XX) XXXXX-XXXX
            // Limits to 11 digits
            if (clean.length > 11) return value // Don't format if too long/paste

            return clean
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d)(\d{4})$/, '$1-$2')
        }
        return clean
    }

    const formatCEP = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1')
    }

    const validateField = (name: string, value: string) => {
        let error = ""
        if (name === "email" && value) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                error = "Formato de email inválido. Ex: exemplo@email.com"
            }
        }
        if (name === "phone" || name === "whatsapp") {
            const clean = value.replace(/\D/g, "")
            // Check for letters check is redundant with formatters stripping them in onChange usually, 
            // but good if user pastes.
            if (value && /[a-zA-Z]/.test(value)) {
                error = "Telefone não deve conter letras."
            } else if (value && clean.length < 8) {
                error = "Número muito curto."
            }
        }
        if (name === "cpfCnpj") {
            const clean = value.replace(/\D/g, "")
            if (clientType === 'PF' && clean.length !== 11 && clean.length > 0) {
                error = "CPF deve ter 11 dígitos."
            }
            if (clientType === 'PJ' && clean.length !== 14 && clean.length > 0) {
                error = "CNPJ deve ter 14 dígitos."
            }
        }
        if (name === "rg" || name === "ctps" || name === "pis") {
            if (value && value.length < 5) error = "Documento parece incompleto/curto."
        }
        if (name === "address.zip") {
            const clean = value.replace(/\D/g, "")
            if (value && clean.length !== 8) error = "CEP deve ter 8 números."
        }
        setErrors(prev => ({ ...prev, [name]: error }))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target

        // Apply masks
        if (name === "cpfCnpj") {
            value = clientType === 'PF' ? formatCPF(value) : formatCNPJ(value)
        }
        if (name === "phone") {
            value = formatPhone(value, phoneCountry)
        }
        if (name === "whatsapp") {
            value = formatPhone(value, whatsappCountry)
        }
        if (name === "address.zip") {
            value = formatCEP(value)
        }

        validateField(name, value) // Live validation

        if (name.startsWith("address.")) {
            const field = name.split(".")[1]
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [field]: value }
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const fetchCompanyData = async () => {
        const cnpj = formData.cpfCnpj.replace(/\D/g, "")
        if (cnpj.length !== 14) {
            alert("CNPJ deve ter 14 dígitos para busca automática.")
            return
        }

        setFetching(true)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
            if (!response.ok) throw new Error("Erro ao buscar dados")

            const data = await response.json()

            setFormData(prev => ({
                ...prev,
                name: data.razao_social || data.nome_fantasia || prev.name,
                email: data.email || prev.email,
                phone: data.ddd_telefone_1 || prev.phone,
                // Map address
                address: {
                    street: data.logradouro || prev.address.street,
                    number: data.numero || prev.address.number,
                    neighborhood: data.bairro || prev.address.neighborhood,
                    city: data.municipio || prev.address.city,
                    state: data.uf || prev.address.state,
                    zip: data.cep || prev.address.zip,
                    complement: data.complemento || prev.address.complement
                }
            }))
        } catch (error) {
            console.error(error)
            alert("Não foi possível buscar os dados da empresa. Verifique o CNPJ.")
        } finally {
            setFetching(false)
        }
    }

    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Client-side validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast({
                title: "Email inválido",
                description: "Por favor, insira um endereço de email válido.",
                type: "error"
            })
            setLoading(false)
            return
        }

        if (clientType === 'PJ' && formData.cpfCnpj.replace(/\D/g, "").length < 14) {
            toast({
                title: "CNPJ inválido",
                description: "O CNPJ deve ter 14 dígitos.",
                type: "error"
            })
            setLoading(false)
            return
        }

        if (clientType === 'PF' && formData.cpfCnpj.replace(/\D/g, "").length < 11) {
            toast({
                title: "CPF inválido",
                description: "O CPF deve ter 11 dígitos.",
                type: "error"
            })
            setLoading(false)
            return
        }

        try {
            await createClient({
                ...formData,
                type: clientType,
            })

            toast({
                title: "Sucesso!",
                description: "Cliente cadastrado com sucesso.",
                type: "success"
            })

            router.push("/clients")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            let msg = "Erro desconhecido ao cadastrar cliente."
            if (error.message) msg = error.message

            toast({
                title: "Erro ao cadastrar",
                description: msg,
                type: "error"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Novo Cliente</h2>
                    <p className="text-muted-foreground">Cadastre um novo cliente ou lead.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Dados do Cliente</CardTitle>
                            <Select value={clientType} onValueChange={(v: string) => {
                                setClientType(v as "PF" | "PJ")
                                setFormData(prev => ({ ...prev, cpfCnpj: "" })) // Clear when switching
                            }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Tipo de Pessoa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PF">Pessoa Física</SelectItem>
                                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <CardDescription>Preencha as informações essenciais.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Principal Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CPF/CNPJ</Label>
                                <div className="flex gap-2">
                                    <Input
                                        name="cpfCnpj"
                                        value={formData.cpfCnpj}
                                        onChange={handleInputChange}
                                        placeholder={clientType === 'PF' ? "000.000.000-00" : "00.000.000/0000-00"}
                                        required
                                        className={errors.cpfCnpj ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        maxLength={clientType === 'PF' ? 14 : 18}
                                    />
                                    {clientType === 'PJ' && (
                                        <Button type="button" variant="outline" size="icon" onClick={fetchCompanyData} disabled={fetching}>
                                            {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                                {errors.cpfCnpj && <p className="text-xs text-red-500 font-medium">{errors.cpfCnpj}</p>}
                                <p className="text-xs text-muted-foreground">
                                    {clientType === 'PJ' ? "Clique na lupa para buscar dados automaticamente." : "Preenchimento manual com formatação automática."}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome Completo / Razão Social</Label>
                                <Input name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <Separator />

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                                />
                                {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone (para recado)</Label>
                                <div className="flex gap-2">
                                    <Select value={phoneCountry} onValueChange={setPhoneCountry}>
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COUNTRY_CODES.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder={phoneCountry === "+55" ? "(00) 0000-0000" : ""}
                                        className={errors.phone ? "border-red-500 focus-visible:ring-red-500 flex-1" : "flex-1"}
                                        maxLength={15}
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <div className="flex gap-2">
                                    <Select value={whatsappCountry} onValueChange={setWhatsappCountry}>
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COUNTRY_CODES.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        name="whatsapp"
                                        value={formData.whatsapp}
                                        onChange={handleInputChange}
                                        placeholder={whatsappCountry === "+55" ? "(00) 00000-0000" : ""}
                                        className={errors.whatsapp ? "border-red-500 focus-visible:ring-red-500 flex-1" : "flex-1"}
                                        maxLength={15}
                                    />
                                </div>
                                {errors.whatsapp && <p className="text-xs text-red-500 font-medium">{errors.whatsapp}</p>}
                            </div>
                        </div>

                        {/* Additional Docs for PF */}
                        {clientType === 'PF' && (
                            <>
                                <Separator />
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>RG</Label>
                                        <Input
                                            name="rg"
                                            value={formData.rg}
                                            onChange={handleInputChange}
                                            className={errors.rg ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {errors.rg && <p className="text-xs text-red-500 font-medium">{errors.rg}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CTPS</Label>
                                        <Input
                                            name="ctps"
                                            value={formData.ctps}
                                            onChange={handleInputChange}
                                            className={errors.ctps ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {errors.ctps && <p className="text-xs text-red-500 font-medium">{errors.ctps}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>PIS</Label>
                                        <Input
                                            name="pis"
                                            value={formData.pis}
                                            onChange={handleInputChange}
                                            className={errors.pis ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        />
                                        {errors.pis && <p className="text-xs text-red-500 font-medium">{errors.pis}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Senha GOV.BR</Label>
                                        <Input name="govAccessPassword" value={formData.govAccessPassword} onChange={handleInputChange} type="password" placeholder="Dados sensíveis criptografados" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Pai</Label>
                                        <Input name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nome da Mãe</Label>
                                        <Input name="motherName" value={formData.motherName} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />
                        <h3 className="font-medium text-sm">Contatos Adicionais & Origem</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Nome Contato Recado</Label>
                                <Input name="messageContactName" value={formData.messageContactName} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Vínculo (Pai, Mãe, etc)</Label>
                                <Input name="messageContactRelation" value={formData.messageContactRelation} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Canal de Aquisição</Label>
                                <Select value={formData.acquisitionChannel} onValueChange={(v: string) => setFormData(p => ({ ...p, acquisitionChannel: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
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
                        <h3 className="font-medium text-sm">Endereço</h3>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>CEP</Label>
                                <Input
                                    name="address.zip"
                                    value={formData.address.zip}
                                    onChange={handleInputChange}
                                    className={errors["address.zip"] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                    maxLength={9}
                                    placeholder="00000-000"
                                />
                                {errors["address.zip"] && <p className="text-xs text-red-500 font-medium">{errors["address.zip"]}</p>}
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Rua</Label>
                                <Input name="address.street" value={formData.address.street} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Número</Label>
                                <Input name="address.number" value={formData.address.number} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Bairro</Label>
                                <Input name="address.neighborhood" value={formData.address.neighborhood} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Cidade</Label>
                                <Input name="address.city" value={formData.address.city} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Estado (UF)</Label>
                                <Input name="address.state" value={formData.address.state} onChange={handleInputChange} maxLength={2} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Complemento</Label>
                                <Input name="address.complement" value={formData.address.complement} onChange={handleInputChange} />
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-6 pt-0 flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Cliente
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    )
}
