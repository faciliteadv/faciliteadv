import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { KanbanService } from "@/lib/services/kanban-service"
import { KanbanBoard } from "@/components/kanban/board"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userId = user.id
    const tasks = await KanbanService.getBoard(userId)

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quadros de Atividades</h2>
                    <p className="text-slate-500">Gestão visual de prazos e tarefas internas</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard initialTasks={tasks} />
            </div>
        </div>
    )
}
