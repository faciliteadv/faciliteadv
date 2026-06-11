import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { hasPermission } from '@/lib/permissions'

async function getAuthContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) return null

    return { userId: user.id, workspace: wsData.workspace, permissions: wsData.permissions as string[] }
}

// DELETE /api/workspace/members/[userId]/visibility/[targetId]
// [targetId] is the WorkspaceMember.id of the target (not userId)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string; targetId: string }> }
) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { userId, targetId } = await params

    const viewer = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId } },
    })
    if (!viewer) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

    const deleted = await db.memberVisibilityGrant.deleteMany({
        where: { viewerId: viewer.id, targetId },
    })

    if (deleted.count === 0) {
        return NextResponse.json({ error: 'Grant não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
