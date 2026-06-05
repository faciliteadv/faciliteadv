import { createClient } from '@/utils/supabase/server'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { hasPermission, type Permission } from '@/lib/permissions'
import { redirect } from 'next/navigation'

/**
 * Server-side permission guard. Call at the top of any protected page.
 * Accepts one or more permissions — passes if user has ANY of them.
 * Redirects to /dashboard if user lacks access.
 */
export async function requirePermission(...perms: Permission[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) redirect('/dashboard')

    const permissions = wsData.permissions as string[]

    const hasAny = perms.some(p => hasPermission(permissions, p))
    if (!hasAny) redirect('/dashboard')

    return { user, wsData, permissions }
}
