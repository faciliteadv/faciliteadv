import Link from "next/link"
import { Home, Users, FileText, Calendar, DollarSign, Settings, LayoutDashboard } from "lucide-react"

export function Sidebar() {
    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold tracking-tight text-blue-400">FaciliteADV</h1>
                <p className="text-xs text-slate-400 mt-1">Facilite sua advocacia</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                </Link>

                <Link href="/clients" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <Users className="w-5 h-5" />
                    <span>Clientes</span>
                </Link>

                <Link href="/processes" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <FileText className="w-5 h-5" />
                    <span>Processos</span>
                </Link>

                <Link href="/agenda" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <Calendar className="w-5 h-5" />
                    <span>Agenda</span>
                </Link>

                <Link href="/kanban" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Kanban</span>
                </Link>

                <Link href="/financial" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <DollarSign className="w-5 h-5" />
                    <span>Financeiro</span>
                </Link>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                    <span>Configurações</span>
                </Link>
            </div>
        </aside>
    )
}
