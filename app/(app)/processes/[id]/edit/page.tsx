import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ProcessForm } from "@/components/processes/process-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EditProcessPageProps {
    params: Promise<{ id: string }>
}

export default async function EditProcessPage({ params }: EditProcessPageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    const process = await db.process.findUnique({
        where: { id, userId: user.id }
    })

    if (!process) {
        return notFound()
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10 1">
            <div className="flex items-center gap-4">
                <Link href={`/processes/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Editar Processo</h2>
                </div>
            </div>

            <ProcessForm initialData={process} isEditing />
        </div>
    )
}
