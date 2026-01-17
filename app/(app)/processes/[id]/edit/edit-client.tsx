"use client"

import { useRouter } from "next/navigation"
import { ProcessForm } from "@/components/processes/process-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface EditProcessClientProps {
    params: { id: string }
    initialData: any
}

export default function EditProcessClient({ params, initialData }: EditProcessClientProps) {
    const router = useRouter()

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Editar Processo</h2>
                </div>
            </div>

            <ProcessForm initialData={initialData} isEditing />
        </div>
    )
}
