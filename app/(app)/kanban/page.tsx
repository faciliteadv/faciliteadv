import { redirect } from "next/navigation"
import { KanbanWrapper } from "@/components/kanban/kanban-wrapper"
import { db } from "@/lib/db"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { KanbanService } from "@/lib/services/kanban-service"
import { requirePermission } from "@/lib/auth/require-permission"
import { hasPermission } from "@/lib/permissions"
import { getVisibleMemberIds } from "@/lib/services/visibility-service"

export const dynamic = 'force-dynamic'

export default async function KanbanPage({
    searchParams
}: {
    searchParams: Promise<{ pipeline?: string }>
}) {
    // Permission check: kanban:read, kanban:own OR kanban:write — any of these grants access
    const { user, permissions } = await requirePermission('kanban:read', 'kanban:own', 'kanban:write')
    const canWrite = hasPermission(permissions, 'kanban:write') || hasPermission(permissions, 'kanban:own')

    // kanban:own (without kanban:read/write/admin) → user sees only their own cards
    const ownOnly =
        !hasPermission(permissions, 'admin') &&
        !hasPermission(permissions, 'kanban:read') &&
        !hasPermission(permissions, 'kanban:write') &&
        hasPermission(permissions, 'kanban:own')

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

    // Visibility-scoped: only members this user can see
    const visibleMemberIds = await getVisibleMemberIds(user.id, workspaceId)
    const visibilityWhere = {
        userId: { in: visibleMemberIds },
        OR: [{ workspaceId }, { workspaceId: null }] as [{ workspaceId: string }, { workspaceId: null }],
    }

    const [rawTasks, processes, columns, workspaceMembers, clients] = await Promise.all([
        activePipelineId ? KanbanService.getTasksByPipeline(activePipelineId, user.id, ownOnly) : Promise.resolve([]),

        // Load the 150 most recently updated processes (prevents loading hundreds on large offices)
        db.process.findMany({
            where: { deletedAt: null, ...visibilityWhere },
            select: { id: true, number: true, folderName: true, type: true },
            orderBy: { updatedAt: 'desc' },
            take: 150,
        }),

        activePipelineId
            ? db.kanbanColumn.findMany({
                where: { pipelineId: activePipelineId },
                orderBy: { position: 'asc' }
            })
            : Promise.resolve([]),

        // Only load members visible to this user
        db.workspaceMember.findMany({
            where: { workspaceId, userId: { in: visibleMemberIds } },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { user: { name: 'asc' } }
        }),

        // Load the 150 most recently updated clients
        db.client.findMany({
            where: { deletedAt: null, ...visibilityWhere },
            select: { id: true, name: true },
            orderBy: { updatedAt: 'desc' },
            take: 150,
        }),
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
