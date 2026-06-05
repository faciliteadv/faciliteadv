import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { hasPermission, type Permission } from '@/lib/permissions'

async function getAuthContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) return null

    return { userId: user.id, workspace: wsData.workspace, permissions: wsData.permissions as string[] }
}

// PATCH /api/workspace/members/[userId] — update member permissions
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { permissions } = body as { permissions: Permission[] }

    const membership = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId } },
        include: { role: true },
    })

    if (!membership) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Cannot change owner's permissions
    if ((membership.role.permissions as string[]).includes('admin') && userId !== ctx.userId) {
        return NextResponse.json({ error: 'Não é possível alterar permissões do gestor' }, { status: 400 })
    }

    await db.role.update({
        where: { id: membership.roleId },
        data: { permissions },
    })

    return NextResponse.json({ success: true })
}

// DELETE /api/workspace/members/[userId] — remove member from workspace
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { userId } = await params

    if (userId === ctx.userId) {
        return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    const membership = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId } },
    })

    if (!membership) {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    await db.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId } },
    })

    // Delete the per-member role
    await db.role.deleteMany({
        where: { id: membership.roleId, isSystem: false },
    })

    return NextResponse.json({ success: true })
}
