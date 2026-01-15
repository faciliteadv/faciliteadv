import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { logout } from "@/app/(public)/login/actions"
import { LogOut } from "lucide-react"

export async function Header() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userEmail = user?.email || 'Usuário'
    const userName = user?.user_metadata?.name || userEmail.split('@')[0]
    const initials = userName.slice(0, 2).toUpperCase()

    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
                Bem-vindo de volta, <span className="text-slate-700">{userName}</span>
            </div>

            <div className="flex items-center gap-4">
                <form action={logout}>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                    </Button>
                </form>
                <div className="flex items-center gap-2 border-l pl-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-900">{userName}</p>
                        <p className="text-xs text-slate-500">{userEmail}</p>
                    </div>
                    <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white">{initials}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
