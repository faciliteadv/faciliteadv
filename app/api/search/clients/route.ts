import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { getVisibleMemberIds } from '@/lib/services/visibility-service'

/**
 * GET /api/search/clients?q=<query>&take=<n>
 * Returns clients visible to the current user, optionally filtered by search term.
 * Used for lazy-loading in dropdowns instead of pre-loading all clients.
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })

    const workspaceId = wsData.workspace.id
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const take = Math.min(parseInt(searchParams.get('take') || '50', 10), 200)

    const visibleIds = await getVisibleMemberIds(user.id, workspaceId)
    const visibilityWhere = {
        userId: { in: visibleIds },
        OR: [{ workspaceId }, { workspaceId: null }] as [{ workspaceId: string }, { workspaceId: null }],
    }

    const clients = await db.client.findMany({
        where: {
            deletedAt: null,
            ...visibilityWhere,
            ...(q
                ? { name: { contains: q, mode: 'insensitive' as const } }
                : {}),
        },
        select: { id: true, name: true },
        orderBy: { updatedAt: 'desc' },
        take,
    })

    return NextResponse.json(clients)
}
