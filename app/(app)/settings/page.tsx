import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { User, Mail, Shield, Building2 } from "lucide-react"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { PageContainer } from "@/components/layout/page-container"
import { WorkspaceService } from "@/lib/services/workspace-service"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { TeamSection } from "@/components/settings/team-section"
import { WorkspaceNameForm } from "@/components/settings/workspace-name-form"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    const dbUser = await ensureUserExists()
    const wsData = await WorkspaceService.getActiveWorkspace(authUser.id)

    const isAdmin = wsData ? hasPermission(wsData.permissions as string[], 'admin') : false

    const members = isAdmin && wsData ? await db.workspaceMember.findMany({
        where: { workspaceId: wsData.workspace.id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            role: { select: { id: true, name: true, permissions: true } },
        },
        orderBy: { joinedAt: 'asc' },
    }) : []

    const initialMembers = members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        roleId: m.role.id,
        roleName: m.role.name,
        permissions: m.role.permissions as string[],
        joinedAt: m.joinedAt.toISOString(),
        isOwner: m.userId === authUser.id,
    }))

    return (
        <PageContainer>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Workspace Name */}
                    {wsData && isAdmin && (
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="rounded-full bg-blue-100 p-3">
                                    <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Escritório</h3>
                                    <p className="text-sm text-slate-500">Nome do seu escritório na plataforma</p>
                                </div>
                            </div>
                            <WorkspaceNameForm initialName={wsData.workspace.name} />
                        </div>
                    )}

                    {/* Profile Section */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-full bg-slate-100 p-3">
                                <User className="h-6 w-6 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Perfil</h3>
                                <p className="text-sm text-slate-500">Informações da sua conta</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md border">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-900">{authUser.email}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Provedor</label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md border">
                                    <Shield className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-900 capitalize">
                                        {authUser.app_metadata?.provider || 'Email'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Membro desde</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-md border">
                                    <span className="text-slate-900">
                                        {authUser.created_at ? new Intl.DateTimeFormat('pt-BR', {
                                            dateStyle: 'long',
                                        }).format(new Date(authUser.created_at)) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Section — only visible to admin */}
                    {isAdmin && (
                        <TeamSection
                            initialMembers={initialMembers}
                            currentUserId={authUser.id}
                        />
                    )}
                </div>
            </div>
        </PageContainer>
    )
}
