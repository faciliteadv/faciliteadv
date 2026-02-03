'use client'

import React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Trash2 } from "lucide-react"

interface DeleteDialogProps {
    isOpen: boolean
    title: string
    description: React.ReactNode
    confirmLabel?: string
    isDeleting: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DeleteDialog({
    isOpen,
    title,
    description,
    confirmLabel = "Excluir",
    isDeleting,
    onClose,
    onConfirm
}: DeleteDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
            <AlertDialogContent className="sm:max-w-[425px] border-l-4 border-l-red-500 gap-6">
                <AlertDialogHeader className="gap-2">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <div className="p-2 bg-red-50 rounded-full">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Zona de Perigo</span>
                    </div>

                    <AlertDialogTitle className="text-xl font-bold text-slate-900">
                        {title}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="text-slate-500 text-base leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel
                        disabled={isDeleting}
                        className="mt-0 hover:bg-slate-100 text-slate-700 font-medium"
                    >
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-red-200"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Excluindo...</span>
                            </div>
                        ) : (
                            confirmLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
