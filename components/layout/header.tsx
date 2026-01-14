import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
                Bem-vindo de volta, Dr. Usuário
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-slate-600">
                    Ajuda
                </Button>
                <div className="flex items-center gap-2 border-l pl-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-900">Dr. Usuário Demo</p>
                        <p className="text-xs text-slate-500">OAB/SP 123456</p>
                    </div>
                    <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white">UD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
