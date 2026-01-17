"use client"

import { useToast } from "@/hooks/use-toast"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function Toaster() {
    const { toasts, dismiss } = useToast()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed bottom-0 right-0 z-[100] flex flex-col p-4 gap-2 w-full max-w-sm">
            {toasts.map((toast) => {
                const Icon = toast.type === 'success' ? CheckCircle :
                    toast.type === 'error' ? AlertCircle :
                        toast.type === 'warning' ? AlertTriangle : Info

                const colorClass = toast.type === 'success' ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-200" :
                    toast.type === 'error' ? "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200" :
                        toast.type === 'warning' ? "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200" :
                            "border-border bg-background text-foreground"

                return (
                    <div
                        key={toast.id}
                        className={cn(
                            "group relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
                            colorClass
                        )}
                    >
                        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
                            {toast.description && (
                                <div className="text-sm opacity-90 mt-1">{toast.description}</div>
                            )}
                        </div>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
