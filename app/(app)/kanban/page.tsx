import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { KanbanService } from "@/lib/services/kanban-service"
import { CRMService } from "@/lib/services/crm-service"
import { KanbanWrapper } from "@/components/kanban/kanban-wrapper"
import { db } from "@/lib/db"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { getKanbanColumns } from "@/lib/actions/column-actions"

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Ensure user exists in our database (auto-create if needed)
    await ensureUserExists()

    const [tasks, processes, cases, inssCases, taskColumns, caseColumns, inssColumns] = await Promise.all([
        KanbanService.getBoard(user.id),
        db.process.findMany({
            where: { userId: user.id, deletedAt: null, status: 'ACTIVE' },
            select: { id: true, number: true, folderName: true }
        }),
        CRMService.getCases(user.id),
        CRMService.getINSSCases(user.id),
        getKanbanColumns('tasks'),
        getKanbanColumns('cases'),
        getKanbanColumns('inss')
    ])

    return (
        <KanbanWrapper
            initialTasks={tasks}
            processes={processes}
            cases={cases}
            inssCases={inssCases}
            taskColumns={taskColumns}
            caseColumns={caseColumns}
            inssColumns={inssColumns}
        />
    )
}
