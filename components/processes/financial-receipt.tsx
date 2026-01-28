"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import { Printer, X } from "lucide-react"

interface FinancialReceiptProps {
    record: any
    onClose: () => void
}

export function FinancialReceipt({ record, onClose }: FinancialReceiptProps) {
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        const printContent = printRef.current
        if (!printContent) return

        const windowUrl = 'about:blank'
        const uniqueName = new Date().getTime()
        const windowName = 'Print' + uniqueName
        const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0')

        if (!printWindow) return

        printWindow.document.write(`
            <html>
                <head>
                    <title>Recibo - FaciliteAdv</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .receipt-container { border: 2px solid #eee; padding: 40px; max-width: 800px; margin: 0 auto; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
                        .logo { height: 60px; }
                        .title { font-size: 24px; font-weight: bold; color: #1e40af; }
                        .record-info { margin-bottom: 30px; line-height: 1.6; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dotted #ccc; padding-bottom: 5px; }
                        .label { font-weight: bold; color: #666; }
                        .footer { margin-top: 60px; text-align: center; }
                        .signature-line { margin-top: 40px; border-top: 1px solid #333; width: 300px; margin-left: auto; margin-right: auto; padding-top: 10px; }
                        .date-location { margin-top: 20px; font-style: italic; color: #888; }
                        @media print {
                            body { padding: 0; }
                            .receipt-container { border: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <div>
                                <span class="title">RECIBO DE PAGAMENTO</span>
                            </div>
                            <img src="/FaciliteLogo2.PNG" class="logo" />
                        </div>
                        
                        <div class="record-info">
                            <p>Recebemos de <strong>${record.client?.name || 'Cliente'}</strong> a importância de:</p>
                            <h2 style="text-align: center; background: #f8fafc; padding: 20px; border-radius: 8px; color: #1e40af;">
                                ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(record.amount))}
                            </h2>
                            <p>Referente a: <strong>${record.description || 'Honorários/Serviços Advocatícios'}</strong></p>
                        </div>

                        <div class="details">
                            <div class="row">
                                <span class="label">Parcela:</span>
                                <span>${record.installment || '1/1'}</span>
                            </div>
                            <div class="row">
                                <span class="label">Forma de Pagamento:</span>
                                <span>${record.paymentMethod || 'Não informado'}</span>
                            </div>
                            <div class="row">
                                <span class="label">Data de Vencimento:</span>
                                <span>${format(new Date(record.dueDate), "dd/MM/yyyy")}</span>
                            </div>
                            ${record.paidAt ? `
                            <div class="row">
                                <span class="label">Data de Pagamento:</span>
                                <span>${format(new Date(record.paidAt), "dd/MM/yyyy")}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="footer">
                            <p class="date-location">Documento emitido em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            
                            <div class="signature-line">
                                Assinatura do Responsável
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Visualizar Recibo</DialogTitle>
                </DialogHeader>

                <div ref={printRef} className="p-6 border rounded-lg bg-white space-y-4 text-sm">
                    <div className="flex justify-between items-start border-b pb-4">
                        <div>
                            <h3 className="font-bold text-lg text-blue-800">RECIBO</h3>
                        </div>
                        <img src="/FaciliteLogo2.PNG" alt="Logo" className="h-10 object-contain" />
                    </div>

                    <div className="space-y-3">
                        <p>Recebemos de <strong>{record.client?.name || 'Cliente'}</strong></p>
                        <div className="bg-slate-50 p-3 rounded text-center font-bold text-xl text-blue-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(record.amount))}
                        </div>
                        <p>Referente a: {record.description || 'Serviços advocatícios'}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-4">
                            <div><strong>Parcela:</strong> {record.installment || '1/1'}</div>
                            <div><strong>Forma:</strong> {record.paymentMethod || 'Pix'}</div>
                            <div><strong>Vencimento:</strong> {format(new Date(record.dueDate), "dd/MM/yyyy")}</div>
                            {record.paidAt && <div><strong>Pago em:</strong> {format(new Date(record.paidAt), "dd/MM/yyyy")}</div>}
                        </div>
                    </div>

                    <div className="pt-10 text-center border-t">
                        <div className="w-48 border-t border-black mx-auto mt-4 pt-1 text-[10px]">
                            FACILITE ADV - ASSINATURA
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
                    <Button onClick={handlePrint} className="flex-1 gap-2">
                        <Printer className="h-4 w-4" /> Imprimir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
