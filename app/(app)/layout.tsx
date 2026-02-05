import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ensureUserExists } from "@/lib/auth/ensure-user"

import { QueryProvider } from "@/components/providers/query-provider"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await ensureUserExists()

    return (
        <QueryProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto transition-all duration-300">
                        {children}
                    </main>
                </div>
            </div>
        </QueryProvider>
    );
}
