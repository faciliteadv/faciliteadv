import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import EditProcessClient from "./edit-client"
import { ProcessService } from "@/lib/services/process-service"

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

    const process = await ProcessService.getById(user.id, id)

    if (!process) {
        return notFound()
    }

    return <EditProcessClient params={{ id }} initialData={process} />
}
