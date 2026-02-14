"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Scale, Briefcase, FileText } from "lucide-react"

interface PostClientCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientId: string
    clientName: string
}

export function PostClientCreateDialog({ open, onOpenChange, clientId, clientName }: PostClientCreateDialogProps) {
    const router = useRouter()

    const handleAction = (type: 'CASE' | 'PROCESS') => {
        onOpenChange(false)
        router.push(`/processes/new?clientId=${clientId}&type=${type}`)
    }

    const handleClose = () => {
        onOpenChange(false)
        router.push("/clients")
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl text-center">Cliente cadastrado com sucesso! 🎉</DialogTitle>
                    <DialogDescription className="text-center">
                        O que você deseja cadastrar para <strong>{clientName}</strong> agora?
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-6">
                    <Button
                        variant="outline"
                        className="h-32 flex flex-col gap-3 hover:border-blue-500 hover:bg-blue-50 border-2 transition-all group"
                        onClick={() => handleAction('PROCESS')}
                    >
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Scale className="h-6 w-6 text-blue-700" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-blue-900 text-lg">Processo Judicial</span>
                            <span className="text-xs text-slate-500">Ações, Execuções, etc.</span>
                        </div>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-32 flex flex-col gap-3 hover:border-emerald-500 hover:bg-emerald-50 border-2 transition-all group"
                        onClick={() => handleAction('CASE')}
                    >
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                            <Briefcase className="h-6 w-6 text-emerald-700" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-emerald-900 text-lg">Caso / Consultivo</span>
                            <span className="text-xs text-slate-500">Contratos, Consultas...</span>
                        </div>
                    </Button>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto text-slate-500 hover:text-slate-800">
                        Pular esta etapa e ir para lista de clientes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
