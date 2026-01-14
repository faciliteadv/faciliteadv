'use server'

import { createClient } from "@/utils/supabase/server"
import { KanbanService } from "@/lib/services/kanban-service"
import { TaskPhase } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function moveCardAction(cardId: string, newPhase: TaskPhase) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const userId = user.id

    await KanbanService.moveCard(userId, cardId, newPhase)
    revalidatePath('/kanban')
    revalidatePath('/') // Dashboard might show stats
}
