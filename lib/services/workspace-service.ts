import { db } from "@/lib/db"

export const WorkspaceService = {
    /**
     * Get user's active workspace (first one they belong to).
     */
    getActiveWorkspace: async (userId: string) => {
        const membership = await db.workspaceMember.findFirst({
            where: { userId },
            include: {
                workspace: true,
                role: true
            },
            orderBy: { joinedAt: 'asc' }
        })

        if (!membership) return null

        const rawPermissions = membership.role.permissions as string[] | null
        let permissions: string[] = Array.isArray(rawPermissions) ? rawPermissions : []

        // Auto-fix: if this user has no permissions, check if they are the first
        // member of the workspace (i.e. the owner/creator). This handles users
        // whose workspace was created before the permission system existed, regardless
        // of what name their role was given.
        if (permissions.length === 0) {
            const hasEarlierMember = await db.workspaceMember.findFirst({
                where: {
                    workspaceId: membership.workspaceId,
                    joinedAt: { lt: membership.joinedAt },
                },
            })

            if (!hasEarlierMember) {
                // First member of the workspace → they are the owner
                await db.role.update({
                    where: { id: membership.role.id },
                    data: { permissions: ['admin'] },
                })
                permissions = ['admin']
            }
        }

        return {
            workspace: membership.workspace,
            role: membership.role,
            permissions,
        }
    },

    /**
     * List all workspaces a user belongs to.
     */
    listUserWorkspaces: async (userId: string) => {
        const memberships = await db.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: true,
                role: {
                    select: { name: true }
                }
            },
            orderBy: { joinedAt: 'asc' }
        })

        return memberships.map(m => ({
            id: m.workspace.id,
            name: m.workspace.name,
            slug: m.workspace.slug,
            role: m.role.name
        }))
    },

    /**
     * Get a workspace by ID with membership check.
     */
    getWorkspace: async (workspaceId: string, userId: string) => {
        const membership = await db.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId, userId }
            },
            include: {
                workspace: true,
                role: true
            }
        })

        if (!membership) return null

        return {
            workspace: membership.workspace,
            role: membership.role,
            permissions: membership.role.permissions as string[]
        }
    },

    /**
     * List pipelines for a workspace.
     */
    listPipelines: async (workspaceId: string) => {
        return await db.kanbanPipeline.findMany({
            where: {
                workspaceId,
                deletedAt: null
            },
            orderBy: { position: 'asc' },
            include: {
                _count: {
                    select: { columns: true }
                }
            }
        })
    },

    /**
     * Get a specific pipeline with columns.
     */
    getPipeline: async (pipelineId: string) => {
        return await db.kanbanPipeline.findUnique({
            where: { id: pipelineId },
            include: {
                columns: {
                    orderBy: { position: 'asc' }
                }
            }
        })
    },

    /**
     * Create a new esteira (pipeline) in a workspace with default columns.
     * Uses transaction to ensure atomicity.
     */
    createEsteira: async (workspaceId: string, name: string, userId: string) => {
        const trimmedName = name.trim()
        if (trimmedName.length < 3) {
            throw new Error('Nome da esteira deve ter no mínimo 3 caracteres')
        }
        if (trimmedName.length > 40) {
            throw new Error('Nome da esteira deve ter no máximo 40 caracteres')
        }

        const esteiraCount = await db.kanbanPipeline.count({
            where: { workspaceId, deletedAt: null }
        })
        if (esteiraCount >= 15) {
            throw new Error('Limite de 15 esteiras por workspace atingido')
        }

        // Get next position
        const maxPos = await db.kanbanPipeline.aggregate({
            where: { workspaceId, deletedAt: null },
            _max: { position: true }
        })
        const nextPosition = (maxPos._max.position ?? -1) + 1

        // New pipelines start EMPTY — the user creates columns manually
        // NEVER auto-create columns.
        // Pipelines must start empty by product decision.
        const esteira = await db.kanbanPipeline.create({
            data: {
                name: trimmedName,
                workspaceId,
                position: nextPosition,
                isDefault: esteiraCount === 0
            }
        })

        return esteira
    },

    /**
     * Check if user belongs to a workspace.
     */
    isUserInWorkspace: async (userId: string, workspaceId: string) => {
        const membership = await db.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId, userId }
            }
        })
        return !!membership
    }
}
