import { createClient } from "@/utils/supabase/server"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { redirect } from "next/navigation"

export type AuthContext = {
    userId: string
    user: any
    workspaceId: string | null
}

export async function withAuth<T>(
    action: (ctx: AuthContext) => Promise<T>
): Promise<T> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Não autorizado")
    }

    // Tenta obter workspace ativo. Se não tiver, workspaceId será null (modo legado/onboarding)
    const activeData = await WorkspaceService.getActiveWorkspace(user.id)
    const workspaceId = activeData?.workspace.id || null

    return action({
        userId: user.id,
        user,
        workspaceId
    })
}
