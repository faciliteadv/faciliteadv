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
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm sticky top-0 z-10 transition-all">
            <div className="text-sm font-medium text-muted-foreground">
                Bem-vindo de volta, <span className="text-foreground font-semibold">{userName}</span>
            </div>

            <div className="flex items-center gap-4">
                <form action={logout}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                    </Button>
                </form>
                <div className="flex items-center gap-2 border-l border-border pl-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-foreground">{userName}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
