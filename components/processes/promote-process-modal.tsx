"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PromoteProcessSchema, type PromoteProcessInput } from "@/lib/validations/schemas"
import { promoteCaseToProcess } from "@/lib/actions/process-actions"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Scale, Loader2, Link as LinkIcon } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { useQuery } from "@tanstack/react-query"
import { getCourts } from "@/lib/actions/process-actions"

interface PromoteProcessModalProps {
    processId: string
    currentDistrict?: string | null
}

export function PromoteProcessModal({ processId, currentDistrict }: PromoteProcessModalProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    // Query for Courts (Varas)
    const { data: courts = [] } = useQuery({
        queryKey: ['courts'],
        queryFn: async () => await getCourts()
    })

    const courtOptions = courts.map(c => ({ label: c, value: c }))

    const form = useForm<PromoteProcessInput>({
        resolver: zodResolver(PromoteProcessSchema),
        defaultValues: {
            number: "",
            court: "",
            link: "",
            district: currentDistrict || "",
        },
    })

    function onSubmit(data: PromoteProcessInput) {
        startTransition(async () => {
            const result = await promoteCaseToProcess(processId, data)

            if (result.success) {
                toast({
                    title: "Sucesso!",
                    description: result.message,
                    type: "success"
                })
                setOpen(false)
            } else {
                toast({
                    title: "Erro ao promover",
                    description: result.error,
                    type: "error"
                })
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                >
                    <Scale className="h-4 w-4" />
                    Converter em Processo Judicial
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-primary" />
                        Converter em Processo Judicial
                    </DialogTitle>
                    <DialogDescription>
                        As informações do caso serão preservadas e este registro será promovido para o módulo judicial.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número do Processo <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="0000000-00.0000.0.00.0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="court"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Vara / Tribunal <span className="text-red-500">*</span></FormLabel>
                                        <Combobox
                                            options={courtOptions}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Selecione ou digite..."
                                            showAddCustom={true}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="link"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Link do Processo (Tribunal)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" placeholder="https://esaj.tjsp.jus.br/..." {...field} value={field.value || ''} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Convertendo...
                                    </>
                                ) : (
                                    "Confirmar Conversão"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
