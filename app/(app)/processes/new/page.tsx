import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProcessForm } from "@/components/processes/process-form"
import { PageContainer } from "@/components/layout/page-container"
import { BackButton } from "@/components/ui/back-button"

export default async function NewProcessPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const params = await searchParams
    const clientId = typeof params.clientId === 'string' ? params.clientId : undefined
    const processType = typeof params.type === 'string' ? params.type : undefined

    return (
        <PageContainer>
            <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Novo Processo</h2>
                        <p className="text-muted-foreground">Cadastre um novo processo ou caso consultivo.</p>
                    </div>
                </div>

                <ProcessForm initialClientId={clientId} initialType={processType} />
            </div>
        </PageContainer>
    )
}
