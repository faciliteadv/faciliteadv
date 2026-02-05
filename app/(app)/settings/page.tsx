import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { User, Mail, Shield, Bell } from "lucide-react"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { PageContainer } from "@/components/layout/page-container"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    const dbUser = await ensureUserExists()

    return (
        <PageContainer>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile Section */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-full bg-blue-100 p-3">
                                <User className="h-6 w-6 text-blue-600" />
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
                                <label className="block text-sm font-medium text-slate-500 mb-1">ID do Usuário</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-md border">
                                    <span className="text-xs text-slate-600 font-mono">{authUser.id}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Criado em</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-md border">
                                    <span className="text-slate-900">
                                        {authUser.created_at ? new Intl.DateTimeFormat('pt-BR', {
                                            dateStyle: 'long',
                                            timeStyle: 'short'
                                        }).format(new Date(authUser.created_at)) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-full bg-green-100 p-3">
                                <Shield className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Segurança</h3>
                                <p className="text-sm text-slate-500">Configurações de acesso</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Último login</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-md border">
                                    <span className="text-slate-900">
                                        {authUser.last_sign_in_at ? new Intl.DateTimeFormat('pt-BR', {
                                            dateStyle: 'long',
                                            timeStyle: 'short'
                                        }).format(new Date(authUser.last_sign_in_at)) : '-'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Provedor de autenticação</label>
                                <div className="px-3 py-2 bg-slate-50 rounded-md border">
                                    <span className="text-slate-900 capitalize">
                                        {authUser.app_metadata?.provider || 'Email'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section - Future */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm opacity-60">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-full bg-yellow-100 p-3">
                                <Bell className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Notificações</h3>
                                <p className="text-sm text-slate-500">Em breve</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400">
                            Configurações de notificações por email e push estarão disponíveis em breve.
                        </p>
                    </div>
                </div>
            </div>
        </PageContainer>
    )
}
