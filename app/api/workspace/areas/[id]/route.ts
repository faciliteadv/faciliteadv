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

// PATCH /api/workspace/areas/[id] — rename an area
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const name = (body.name as string | undefined)?.trim()

    if (!name || name.length < 2) {
        return NextResponse.json({ error: 'Nome deve ter no mínimo 2 caracteres' }, { status: 400 })
    }

    const area = await db.workspaceArea.findFirst({
        where: { id, workspaceId: ctx.workspace.id },
    })
    if (!area) return NextResponse.json({ error: 'Área não encontrada' }, { status: 404 })

    const updated = await db.workspaceArea.update({
        where: { id },
        data: { name },
    })

    return NextResponse.json({ id: updated.id, name: updated.name })
}

// DELETE /api/workspace/areas/[id] — delete an area (members become arealess)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params

    const area = await db.workspaceArea.findFirst({
        where: { id, workspaceId: ctx.workspace.id },
    })
    if (!area) return NextResponse.json({ error: 'Área não encontrada' }, { status: 404 })

    // Detach members before deleting (set areaId to null)
    await db.workspaceMember.updateMany({
        where: { workspaceId: ctx.workspace.id, areaId: id },
        data: { areaId: null },
    })

    await db.workspaceArea.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
