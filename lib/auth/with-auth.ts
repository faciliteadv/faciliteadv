import { createClient } from "@/utils/supabase/server"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { redirect } from "next/navigation"

export type AuthContext = {
    userId: string
    user: any
    workspaceId: string | null
    permissions: string[]
}

export async function withAuth<T>(
    action: (ctx: AuthContext) => Promise<T>
): Promise<T> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Não autorizado")
    }

    const activeData = await WorkspaceService.ensureWorkspace(user.id)
    const workspaceId = activeData?.workspace.id || null
    const permissions = (activeData?.permissions as string[]) ?? []

    return action({
        userId: user.id,
        user,
        workspaceId,
        permissions,
    })
}
