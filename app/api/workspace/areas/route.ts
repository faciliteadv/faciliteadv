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

// GET /api/workspace/areas — list all areas in current workspace
export async function GET() {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const areas = await db.workspaceArea.findMany({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { members: true } },
        },
    })

    return NextResponse.json(
        areas.map(a => ({ id: a.id, name: a.name, memberCount: a._count.members, createdAt: a.createdAt }))
    )
}

// POST /api/workspace/areas — create a new area
export async function POST(request: NextRequest) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const name = (body.name as string | undefined)?.trim()

    if (!name || name.length < 2) {
        return NextResponse.json({ error: 'Nome da área deve ter no mínimo 2 caracteres' }, { status: 400 })
    }
    if (name.length > 60) {
        return NextResponse.json({ error: 'Nome da área deve ter no máximo 60 caracteres' }, { status: 400 })
    }

    const existing = await db.workspaceArea.findUnique({
        where: { workspaceId_name: { workspaceId: ctx.workspace.id, name } },
    })
    if (existing) {
        return NextResponse.json({ error: 'Já existe uma área com esse nome' }, { status: 409 })
    }

    const area = await db.workspaceArea.create({
        data: { name, workspaceId: ctx.workspace.id },
    })

    return NextResponse.json({ id: area.id, name: area.name, memberCount: 0, createdAt: area.createdAt }, { status: 201 })
}
