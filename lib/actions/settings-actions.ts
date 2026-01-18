"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateUserLogos(userId: string, logoFullUrl?: string, logoCollapsedUrl?: string) {
    try {
        await db.user.update({
            where: { id: userId },
            data: {
                logoFullUrl,
                logoCollapsedUrl
            } as any
        })

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Error updating logos:", error)
        return { success: false, error: "Falha ao atualizar logos" }
    }
}
