import { redirect } from "next/navigation"
import { KanbanWrapper } from "@/components/kanban/kanban-wrapper"
import { db } from "@/lib/db"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { KanbanService } from "@/lib/services/kanban-service"
import { requirePermission } from "@/lib/auth/require-permission"
import { hasPermission } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export default async function KanbanPage({
    searchParams
}: {
    searchParams: Promise<{ pipeline?: string }>
}) {
    // Permission check: kanban:read, kanban:own OR kanban:write — any of these grants access
    const { user, permissions } = await requirePermission('kanban:read', 'kanban:own', 'kanban:write')
    const canWrite = hasPermission(permissions, 'kanban:write') || hasPermission(permissions, 'kanban:own')

    await ensureUserExists()

    const params = await searchParams

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) redirect('/onboarding')

    const workspaceId = wsData.workspace.id
    const pipelines = await WorkspaceService.listPipelines(workspaceId)

    let activePipelineId = params.pipeline || null

    if (activePipelineId && !pipelines.some(p => p.id === activePipelineId)) {
        activePipelineId = null
    }

    if (!activePipelineId && pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0]
        activePipelineId = defaultPipeline.id
    }

    const [rawTasks, processes, columns, workspaceMembers, clients] = await Promise.all([
        activePipelineId ? KanbanService.getTasksByPipeline(activePipelineId, user.id) : Promise.resolve([]),
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
        db.workspaceMember.findMany({
            where: { workspaceId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { user: { name: 'asc' } }
        }),
        db.client.findMany({ where: { userId: user.id }, select: { id: true, name: true } })
    ])

    const users = workspaceMembers.map(m => m.user)

    const initialTasks = rawTasks.map((t: any) => ({
        ...t,
        columnId: t.columnId || '',
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
            canWrite={canWrite}
        />
    )
}
