import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { KanbanService } from "@/lib/services/kanban-service"
import { KanbanWrapper } from "@/components/kanban/kanban-wrapper"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [tasks, processes] = await Promise.all([
        KanbanService.getBoard(user.id),
        db.process.findMany({
            where: { userId: user.id, deletedAt: null, status: 'ACTIVE' },
            select: { id: true, number: true, folderName: true }
        })
    ])

    return <KanbanWrapper initialTasks={tasks} processes={processes} />
}
