import { createClient } from '@/utils/supabase/server'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { hasPermission, type Permission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

/**
 * Server-side permission guard. Call at the top of any protected page.
 * Accepts one or more permissions — passes if user has ANY of them.
 * Redirects to /dashboard if user lacks access.
 * Uses ensureWorkspace so existing users without a workspace get one created.
 */
export async function requirePermission(...perms: Permission[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get or create workspace — never returns null for an authenticated user
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { name: true } })
    const wsData = await WorkspaceService.ensureWorkspace(user.id, dbUser?.name ?? undefined)
    if (!wsData) redirect('/dashboard')

    const permissions = wsData.permissions as string[]

    const hasAny = perms.some(p => hasPermission(permissions, p))
    if (!hasAny) redirect('/dashboard')

    return { user, wsData, permissions }
}
