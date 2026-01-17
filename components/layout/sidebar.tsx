import Link from "next/link"
import { Home, Users, FileText, Calendar, DollarSign, Settings, LayoutDashboard, Scale } from "lucide-react"

export function Sidebar() {
    return (
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border">
            <div className="p-6 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                        <Scale className="w-5 h-5 text-sidebar-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">FaciliteADV</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Premium</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <Home className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span className="font-medium">Dashboard</span>
                </Link>

                <Link href="/clients" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <Users className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span className="font-medium">Clientes</span>
                </Link>

                <Link href="/processes" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <FileText className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span className="font-medium">Processos</span>
                </Link>

                <Link href="/agenda" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <Calendar className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span className="font-medium">Agenda</span>
                </Link>

                <Link href="/kanban" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <LayoutDashboard className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span className="font-medium">Prazos e Casos</span>
                </Link>

                <Link href="/financial" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <DollarSign className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    <span className="font-medium">Financeiro</span>
                </Link>
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group">
                    <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    <span className="font-medium">Configurações</span>
                </Link>
            </div>
        </aside>
    )
}
