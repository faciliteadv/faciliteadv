import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { db } from '@/lib/db'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { hasPermission, OWNER_PERMISSIONS, type Permission } from '@/lib/permissions'

async function getAuthContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) return null

    return { userId: user.id, workspace: wsData.workspace, permissions: wsData.permissions as string[] }
}

// GET /api/workspace/members — list members of current workspace
export async function GET() {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const members = await db.workspaceMember.findMany({
        where: { workspaceId: ctx.workspace.id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            role: { select: { id: true, name: true, permissions: true } },
            area: { select: { id: true, name: true } },
        },
        orderBy: { joinedAt: 'asc' },
    })

    const membersWithGrants = await Promise.all(
        members.map(async (m) => {
            const grants = await db.memberVisibilityGrant.findMany({
                where: { viewerId: m.id },
                select: { id: true, targetId: true, target: { select: { userId: true, user: { select: { name: true, email: true } } } } },
            })
            return {
                id: m.id,
                userId: m.userId,
                name: m.user.name,
                email: m.user.email,
                roleId: m.role.id,
                roleName: m.role.name,
                permissions: m.role.permissions as string[],
                areaId: m.areaId,
                areaName: (m as any).area?.name ?? null,
                visibilityScope: m.visibilityScope,
                joinedAt: m.joinedAt,
                isOwner: m.userId === ctx.userId,
                visibilityGrants: grants.map(g => ({
                    id: g.id,
                    targetMemberId: g.targetId,
                    targetUserId: g.target.userId,
                    targetName: g.target.user.name,
                    targetEmail: g.target.user.email,
                })),
            }
        })
    )

    return NextResponse.json(membersWithGrants)
}

// POST /api/workspace/members — create a new member
export async function POST(request: NextRequest) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, permissions, areaId, visibilityScope } = body as {
        name: string
        email: string
        password: string
        permissions: Permission[]
        areaId?: string
        visibilityScope?: 'SELF' | 'AREA' | 'ALL'
    }

    if (!name || !email || !password || !permissions) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Validate areaId if provided
    if (areaId) {
        const area = await db.workspaceArea.findFirst({
            where: { id: areaId, workspaceId: ctx.workspace.id },
        })
        if (!area) return NextResponse.json({ error: 'Área não encontrada' }, { status: 400 })
    }

    if (password.length < 6) {
        return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Check if email already exists in this workspace
    const existingInWorkspace = await db.user.findFirst({
        where: {
            email,
            workspaces: { some: { workspaceId: ctx.workspace.id } }
        }
    })
    if (existingInWorkspace) {
        return NextResponse.json({ error: 'Este email já é membro do escritório' }, { status: 409 })
    }

    const adminClient = createAdminClient()

    // Check if Supabase user already exists (might be from another workspace)
    let supabaseUserId: string

    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users.find(u => u.email === email)

    if (existingAuthUser) {
        supabaseUserId = existingAuthUser.id
        // Update password if user already exists
        await adminClient.auth.admin.updateUserById(supabaseUserId, { password })
    } else {
        // Create new Supabase auth user (no email confirmation)
        const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        })

        if (createError || !newAuthUser.user) {
            return NextResponse.json({ error: createError?.message || 'Erro ao criar usuário' }, { status: 500 })
        }

        supabaseUserId = newAuthUser.user.id
    }

    // Ensure DB user exists
    let dbUser = await db.user.findUnique({ where: { id: supabaseUserId } })
    if (!dbUser) {
        dbUser = await db.user.create({
            data: { id: supabaseUserId, email, name },
        })
    } else {
        // Update name if needed
        await db.user.update({ where: { id: supabaseUserId }, data: { name } })
    }

    // Create a dedicated role for this member
    const roleName = `member-${supabaseUserId.substring(0, 8)}`
    const role = await db.role.create({
        data: {
            name: roleName,
            workspaceId: ctx.workspace.id,
            isSystem: false,
            permissions: permissions,
        },
    })

    // Create workspace membership
    const membership = await db.workspaceMember.create({
        data: {
            workspaceId: ctx.workspace.id,
            userId: supabaseUserId,
            roleId: role.id,
            areaId: areaId || null,
            visibilityScope: visibilityScope || 'AREA',
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
            role: { select: { id: true, permissions: true } },
            area: { select: { id: true, name: true } },
        },
    })

    return NextResponse.json({
        id: membership.id,
        userId: membership.userId,
        name: membership.user.name,
        email: membership.user.email,
        areaId: membership.areaId,
        areaName: (membership as any).area?.name ?? null,
        visibilityScope: membership.visibilityScope,
        roleId: membership.role.id,
        permissions: membership.role.permissions as string[],
    }, { status: 201 })
}
