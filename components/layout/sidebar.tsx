"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Users, FileText, Calendar, DollarSign, Settings, LayoutDashboard, Scale, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const onToggle = () => setCollapsed(!collapsed)

    const navItems = [
        { href: "/dashboard", icon: Home, label: "Dashboard" },
        { href: "/clients", icon: Users, label: "Clientes" },
        { href: "/processes", icon: FileText, label: "Processos" },
        { href: "/agenda", icon: Calendar, label: "Agenda" },
        { href: "/kanban", icon: LayoutDashboard, label: "Prazos e Casos" },
        { href: "/financial", icon: DollarSign, label: "Financeiro" },
    ]

    return (
        <aside className={cn(
            "bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border transition-all duration-300 ease-in-out relative",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className={cn(
                "p-6 border-b border-sidebar-border flex items-center justify-between",
                collapsed && "px-4 justify-center"
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                            <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">FaciliteADV</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Premium</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mb-0">
                        <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className={cn(
                        "text-sidebar-foreground/50 hover:text-sidebar-foreground",
                        !collapsed && "ml-2"
                    )}
                >
                    <PanelLeft className="w-5 h-5" />
                </Button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all group",
                            collapsed && "px-2 justify-center"
                        )}
                    >
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                        {!collapsed && <span className="font-medium whitespace-nowrap transition-opacity duration-300">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <Link href="/settings" className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all group",
                    collapsed && "px-2 justify-center"
                )}>
                    <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform shrink-0" />
                    {!collapsed && <span className="font-medium whitespace-nowrap transition-opacity duration-300">Configurações</span>}
                </Link>
            </div>
        </aside>
    )
}
