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
        },
        orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json(members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        roleId: m.role.id,
        roleName: m.role.name,
        permissions: m.role.permissions as string[],
        joinedAt: m.joinedAt,
        isOwner: m.userId === ctx.userId,
    })))
}

// POST /api/workspace/members — create a new member
export async function POST(request: NextRequest) {
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (!hasPermission(ctx.permissions, 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, permissions } = body as {
        name: string
        email: string
        password: string
        permissions: Permission[]
    }

    if (!name || !email || !password || !permissions) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
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
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
            role: { select: { id: true, permissions: true } },
        },
    })

    return NextResponse.json({
        id: membership.id,
        userId: membership.userId,
        name: membership.user.name,
        email: membership.user.email,
        roleId: membership.role.id,
        permissions: membership.role.permissions as string[],
    }, { status: 201 })
}
