import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { KanbanWrapper } from "@/components/kanban/kanban-wrapper"
import { db } from "@/lib/db"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { KanbanService } from "@/lib/services/kanban-service"

export const dynamic = 'force-dynamic'

export default async function KanbanPage({
    searchParams
}: {
    searchParams: Promise<{ pipeline?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    await ensureUserExists()

    // Await searchParams (Next.js 16 makes it a Promise)
    const params = await searchParams

    // 1. Get workspace
    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) redirect('/onboarding')

    const workspaceId = wsData.workspace.id

    // 2. Get pipelines for this workspace
    const pipelines = await WorkspaceService.listPipelines(workspaceId)

    // 3. Determine active pipeline (from URL or default)
    let activePipelineId = params.pipeline || null

    // Validate if requested pipeline exists
    if (activePipelineId && !pipelines.some(p => p.id === activePipelineId)) {
        activePipelineId = null
    }

    if (!activePipelineId && pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0]
        activePipelineId = defaultPipeline.id
    }

    // 4. Load data in parallel
    const [rawTasks, processes, columns, users, clients] = await Promise.all([
        activePipelineId ? KanbanService.getTasksByPipeline(activePipelineId) : Promise.resolve([]),
        db.process.findMany({
            where: { userId: user.id, deletedAt: null },
            select: { id: true, number: true, folderName: true, type: true }
        }),
        activePipelineId
            ? db.kanbanColumn.findMany({
                where: { pipelineId: activePipelineId },
                orderBy: { position: 'asc' }
            })
            : Promise.resolve([]),
        db.user.findMany({ select: { id: true, name: true, email: true } }),
        db.client.findMany({ where: { userId: user.id }, select: { id: true, name: true } })
    ])

    // Serialize dates and ensure type safety
    const initialTasks = rawTasks.map((t: any) => ({
        ...t,
        columnId: t.columnId || '', // Ensure non-null for client
        position: t.position ?? 0,
        createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
        updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
        completedAt: t.completedAt?.toISOString?.() ?? t.completedAt ?? null,
        fatalDate: t.fatalDate?.toISOString?.() ?? t.fatalDate ?? null,
        endDate: t.endDate?.toISOString?.() ?? t.endDate ?? null,
        publicationDate: t.publicationDate?.toISOString?.() ?? t.publicationDate ?? null,
        protocolDate: t.protocolDate?.toISOString?.() ?? t.protocolDate ?? null,
    }))

    return (
        <KanbanWrapper
            initialTasks={initialTasks as any}
            initialColumns={columns}
            pipelines={pipelines as any}
            activePipelineId={activePipelineId}
            processes={processes}
            users={users}
            clients={clients}
        />
    )
}
