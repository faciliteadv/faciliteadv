import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'
import { WorkspaceService } from '@/lib/services/workspace-service'
import { hasPermission } from '@/lib/permissions'

// PATCH /api/workspace — update workspace name
export async function PATCH(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const wsData = await WorkspaceService.getActiveWorkspace(user.id)
    if (!wsData) return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 })

    if (!hasPermission(wsData.permissions as string[], 'admin')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { name } = await request.json()
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
    }

    const updated = await db.workspace.update({
        where: { id: wsData.workspace.id },
        data: { name: name.trim() },
        select: { id: true, name: true },
    })

    return NextResponse.json(updated)
}
