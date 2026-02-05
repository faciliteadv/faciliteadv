"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ProcessForm } from "@/components/processes/process-form"
import { PageContainer } from "@/components/layout/page-container"

export default function NewProcessPage() {
    const router = useRouter()

    return (
        <PageContainer>
            <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Novo Processo</h2>
                        <p className="text-muted-foreground">Cadastre um novo processo jurídico.</p>
                    </div>
                </div>

                <ProcessForm />
            </div>
        </PageContainer>
    )
}
