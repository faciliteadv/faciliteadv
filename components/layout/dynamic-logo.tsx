"use client"

import { cn } from "@/lib/utils"
import { Scale } from "lucide-react"
import { useEffect, useState } from "react"

interface DynamicLogoProps {
    isCollapsed: boolean
}

export function DynamicLogo({ isCollapsed }: DynamicLogoProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="relative flex items-center gap-2 overflow-hidden h-8 w-full transition-all duration-300">
            {/* Logo Full (Expanded Sidebar) */}
            <div className={cn(
                "absolute inset-0 flex items-center gap-2 transition-all duration-500 ease-in-out",
                isCollapsed ? "opacity-0 scale-95 pointer-events-none translate-x-[-20%]" : "opacity-100 scale-100 translate-x-0"
            )}>
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">FaciliteADV</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Premium</p>
                </div>
            </div>

            {/* Logo Collapsed (Mini Sidebar) */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out",
                isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}>
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                    <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                </div>
            </div>
        </div>
    )
}
