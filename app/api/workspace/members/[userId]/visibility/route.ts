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

// GET /api/workspace/members/[userId]/visibility — list grants given to this member
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { userId } = await params

    const viewer = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId } },
    })
    if (!viewer) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

    const grants = await db.memberVisibilityGrant.findMany({
        where: { viewerId: viewer.id },
        include: {
            target: {
                select: { id: true, userId: true, user: { select: { name: true, email: true } } },
            },
        },
    })

    return NextResponse.json(
        grants.map(g => ({
            id: g.id,
            targetMemberId: g.targetId,
            targetUserId: g.target.userId,
            targetName: g.target.user.name,
            targetEmail: g.target.user.email,
        }))
    )
}

// POST /api/workspace/members/[userId]/visibility
// Body: { targetUserId: string } — grant viewer access to target's data
export async function POST(
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
    const { targetUserId } = body as { targetUserId: string }

    if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId é obrigatório' }, { status: 400 })
    }

    const [viewer, target] = await Promise.all([
        db.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId } },
        }),
        db.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: ctx.workspace.id, userId: targetUserId } },
        }),
    ])

    if (!viewer) return NextResponse.json({ error: 'Membro (viewer) não encontrado' }, { status: 404 })
    if (!target) return NextResponse.json({ error: 'Membro (target) não encontrado' }, { status: 404 })
    if (viewer.id === target.id) return NextResponse.json({ error: 'Não é possível criar grant para si mesmo' }, { status: 400 })

    const grant = await db.memberVisibilityGrant.upsert({
        where: { viewerId_targetId: { viewerId: viewer.id, targetId: target.id } },
        create: { workspaceId: ctx.workspace.id, viewerId: viewer.id, targetId: target.id },
        update: {},
    })

    return NextResponse.json({ id: grant.id, targetMemberId: target.id, targetUserId }, { status: 201 })
}
