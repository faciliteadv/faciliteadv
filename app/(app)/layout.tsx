import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ensureUserExists } from "@/lib/auth/ensure-user"
import { redirect } from "next/navigation"

import { QueryProvider } from "@/components/providers/query-provider"
import { EsteiraModalProvider } from "@/components/providers/esteira-modal-provider"
import { WorkspaceService } from "@/lib/services/workspace-service"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await ensureUserExists()

    if (!user) {
        redirect('/login')
    }

    const workspaces = await WorkspaceService.listUserWorkspaces(user.id)
    const activeWorkspace = await WorkspaceService.getActiveWorkspace(user.id)

    const permissions = (activeWorkspace?.permissions as string[]) ?? []

    return (
        <QueryProvider>
            <EsteiraModalProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                    <Sidebar
                        workspaces={workspaces}
                        activeWorkspaceId={activeWorkspace?.workspace.id || ''}
                        permissions={permissions}
                    />
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <Header />
                        <main className="flex-1 flex flex-col overflow-y-auto transition-all duration-300">
                            {children}
                        </main>
                    </div>
                </div>
            </EsteiraModalProvider>
        </QueryProvider>
    );
}

