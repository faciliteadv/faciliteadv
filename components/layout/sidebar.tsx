"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Users, FileText, DollarSign, Settings, LayoutDashboard, Scale, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WorkspaceSelector } from "@/components/workspace/workspace-selector"

interface SidebarProps {
    workspaces?: { id: string; name: string; slug: string; role?: string }[]
    activeWorkspaceId?: string
    permissions?: string[]
}

const ALL_NAV_ITEMS = [
    { href: "/dashboard", icon: Home, label: "Dashboard", requiredPerms: null as string[] | null },
    { href: "/clients", icon: Users, label: "Clientes", requiredPerms: ['clients:read'] },
    { href: "/processes", icon: FileText, label: "Processos", requiredPerms: ['processes:read'] },
    { href: "/kanban", icon: LayoutDashboard, label: "Kanban", requiredPerms: ['kanban:read', 'kanban:own', 'kanban:write'] },
    { href: "/financial", icon: DollarSign, label: "Financeiro", requiredPerms: ['financial:read'] },
]

export function Sidebar({ workspaces = [], activeWorkspaceId = "", permissions = [] }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const onToggle = () => setCollapsed(!collapsed)

    const isAdmin = permissions.includes('admin')

    const navItems = ALL_NAV_ITEMS.filter(item => {
        if (!item.requiredPerms) return true
        if (isAdmin) return true
        return item.requiredPerms.some(p => permissions.includes(p))
    })

    return (
        <aside className={cn(
            "bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border transition-all duration-300 ease-in-out relative",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className={cn(
                "p-4 border-b border-sidebar-border flex items-center justify-between gap-2",
                collapsed && "px-2 justify-center flex-col gap-4"
            )}>
                {workspaces.length > 0 ? (
                    <div className="flex-1 min-w-0">
                        <WorkspaceSelector
                            workspaces={workspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            collapsed={collapsed}
                        />
                    </div>
                ) : (
                    !collapsed && (
                        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap px-2 py-2">
                            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                                <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">FaciliteADV</h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Premium</p>
                            </div>
                        </div>
                    )
                )}
                {collapsed && workspaces.length === 0 && (
                    <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mb-0">
                        <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                    </div>
                )}


                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className={cn(
                        "text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0",
                        collapsed && "mt-2" // spacing in vertical layout
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
