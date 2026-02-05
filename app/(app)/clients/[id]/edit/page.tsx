import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ClientService } from "@/lib/services/client-service"
import { ClientForm } from "@/components/clients/client-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { id } = await params
    const client = await ClientService.getById(user.id, id)

    if (!client) {
        return <div>Cliente não encontrado.</div>
    }

    return (
        <PageContainer>
            <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <Link href={`/clients/${id}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Editar Cliente</h2>
                        <p className="text-muted-foreground">Atualize as informações do cliente.</p>
                    </div>
                </div>

                <ClientForm initialData={client} isEditing={true} />
            </div>
        </PageContainer>
    )
}
