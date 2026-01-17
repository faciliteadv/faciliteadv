import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import EditProcessClient from "./edit-client"

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

    return <EditProcessClient params={{ id }} initialData={process} />
}
