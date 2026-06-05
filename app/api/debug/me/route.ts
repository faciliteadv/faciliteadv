import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } })

    const memberships = await db.workspaceMember.findMany({
        where: { userId: user.id },
        include: {
            workspace: { select: { id: true, name: true, slug: true } },
            role: { select: { id: true, name: true, permissions: true, isSystem: true } },
        },
        orderBy: { joinedAt: 'asc' },
    })

    // Also check by email in case of ID mismatch
    const userByEmail = dbUser ? null : await db.user.findUnique({ where: { email: user.email! } })

    const membershipsByEmail = userByEmail ? await db.workspaceMember.findMany({
        where: { userId: userByEmail.id },
        include: {
            workspace: { select: { id: true, name: true } },
            role: { select: { id: true, name: true, permissions: true } },
        },
    }) : []

    return NextResponse.json({
        supabase: { id: user.id, email: user.email },
        dbUser,
        idMatch: !!dbUser,
        userByEmail: userByEmail ?? null,
        memberships: memberships.map(m => ({
            workspaceId: m.workspaceId,
            workspaceName: m.workspace.name,
            joinedAt: m.joinedAt,
            roleId: m.roleId,
            roleName: m.role.name,
            rolePermissions: m.role.permissions,
            roleIsSystem: m.role.isSystem,
        })),
        membershipsByEmail,
        diagnosis: {
            hasDbUser: !!dbUser,
            hasMembership: memberships.length > 0,
            firstMembershipPermissions: memberships[0]?.role.permissions ?? null,
            isIdMismatch: !dbUser && !!userByEmail,
        },
    })
}
