"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, MoreHorizontal, Pencil, Trash2, Plus, Scale, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { RenameWorkspaceDialog } from "./rename-workspace-dialog"
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog"

interface Workspace {
    id: string
    name: string
    slug: string
    role?: string
}

interface WorkspaceSelectorProps {
    workspaces: Workspace[]
    activeWorkspaceId: string
    collapsed?: boolean
}

export function WorkspaceSelector({ workspaces, activeWorkspaceId, collapsed }: WorkspaceSelectorProps) {
    const [isRenameOpen, setIsRenameOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    // Verify active workspace exists in list, otherwise first
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0]

    if (!activeWorkspace) return null

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div
                        role="button"
                        className={cn(
                            "flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer group select-none outline-none",
                            collapsed ? "justify-center" : "justify-between"
                        )}
                    >
                        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0 shadow-sm border border-sidebar-border/10">
                                <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                            </div>
                            {!collapsed && (
                                <div className="flex flex-col text-left transition-all">
                                    <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground truncate max-w-[120px]">
                                        {activeWorkspace.name}
                                    </h1>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Premium</p>
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <ChevronsUpDown className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-64 z-[9999]"
                    align="start"
                    side={collapsed ? "right" : "bottom"}
                    sideOffset={8}
                >
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
                        Workspaces
                    </DropdownMenuLabel>

                    {workspaces.map((workspace) => (
                        <DropdownMenuItem
                            key={workspace.id}
                            className="flex items-center justify-between p-2 cursor-pointer focus:bg-accent focus:text-accent-foreground"
                        // In real app: onClick={() => switchWorkspace(workspace.id)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 border border-primary/20">
                                    <Building2 className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className={cn(
                                    "text-sm font-medium",
                                    workspace.id === activeWorkspace.id ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {workspace.name}
                                </span>
                            </div>
                            {workspace.id === activeWorkspace.id && (
                                <Check className="w-4 h-4 text-primary" />
                            )}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="gap-2 p-2 cursor-pointer text-muted-foreground hover:text-foreground">
                        <div className="flex items-center justify-center w-6 h-6 rounded border border-dashed border-border">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">Criar Workspace</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
                        Gerenciar "{activeWorkspace.name}"
                    </DropdownMenuLabel>

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsRenameOpen(true)
                            }}
                            className="gap-2 cursor-pointer"
                        >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                            <span>Renomear workspace</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsDeleteOpen(true)
                            }}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Excluir workspace</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <RenameWorkspaceDialog
                isOpen={isRenameOpen}
                onOpenChange={setIsRenameOpen}
                workspaceId={activeWorkspace.id}
                currentName={activeWorkspace.name}
            />

            <DeleteWorkspaceDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                workspaceId={activeWorkspace.id}
                workspaceName={activeWorkspace.name}
            />
        </>
    )
}
