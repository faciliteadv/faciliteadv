import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"

/**
 * Returns the userId[] that the given viewer is allowed to see data from.
 *
 * Rules (evaluated in order):
 *  1. admin permission OR visibilityScope=ALL → all members in workspace
 *  2. visibilityScope=AREA + no area assigned → all members (legacy/no segmentation)
 *  3. visibilityScope=AREA + area assigned → same-area members + explicit grants
 *  4. visibilityScope=SELF → own userId + explicit grants only
 */
export async function getVisibleMemberIds(
    viewerUserId: string,
    workspaceId: string,
): Promise<string[]> {
    const viewer = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: viewerUserId } },
        select: {
            areaId: true,
            visibilityScope: true,
            role: { select: { permissions: true } },
            visibilityGrantsGiven: {
                select: { target: { select: { userId: true } } },
            },
        },
    })

    if (!viewer) return [viewerUserId]

    const permissions = viewer.role.permissions as string[]
    const grantedUserIds = viewer.visibilityGrantsGiven.map(g => g.target.userId)

    // Admin or ALL scope: can see everyone
    if (hasPermission(permissions, 'admin') || viewer.visibilityScope === 'ALL') {
        const all = await db.workspaceMember.findMany({
            where: { workspaceId },
            select: { userId: true },
        })
        return all.map(r => r.userId)
    }

    // SELF scope: only own data + explicitly granted
    if (viewer.visibilityScope === 'SELF') {
        return [...new Set([viewerUserId, ...grantedUserIds])]
    }

    // AREA scope (default)
    if (!viewer.areaId) {
        // No area → legacy behaviour: see entire workspace
        const all = await db.workspaceMember.findMany({
            where: { workspaceId },
            select: { userId: true },
        })
        return all.map(r => r.userId)
    }

    // Has area → see same-area members + explicit grants
    const sameArea = await db.workspaceMember.findMany({
        where: { workspaceId, areaId: viewer.areaId },
        select: { userId: true },
    })

    return [...new Set([...sameArea.map(m => m.userId), ...grantedUserIds])]
}

/**
 * Returns the userId[] whose kanban cards a user with kanban:own is allowed to see.
 * Rule: own userId + members with an explicit MemberVisibilityGrant.
 *
 * Deliberately does NOT use visibilityScope/area — those govern data-level access
 * (clients, processes). Kanban:own uses only explicit grants configured per member.
 */
export async function getKanbanOwnFilterIds(
    viewerUserId: string,
    workspaceId: string,
): Promise<string[]> {
    const member = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: viewerUserId } },
        select: {
            visibilityGrantsGiven: {
                select: { target: { select: { userId: true } } },
            },
        },
    })
    const grantedIds = member?.visibilityGrantsGiven.map(g => g.target.userId) ?? []
    return [viewerUserId, ...grantedIds]
}

/**
 * Build a Prisma WHERE fragment that scopes a query to data visible to the viewer.
 * Works for Process and Client which have both workspaceId and userId fields.
 */
export async function buildVisibilityWhere(
    viewerUserId: string,
    workspaceId: string,
): Promise<{
    userId: { in: string[] }
    OR: [{ workspaceId: string }, { workspaceId: null }]
}> {
    const visibleIds = await getVisibleMemberIds(viewerUserId, workspaceId)
    return {
        userId: { in: visibleIds },
        OR: [{ workspaceId }, { workspaceId: null }],
    }
}
