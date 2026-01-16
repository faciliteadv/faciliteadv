import { db } from "@/lib/db"
import { TaskCard, TaskPhase, TaskType } from "@prisma/client"

export const KanbanService = {
    getBoard: async (userId: string) => {
        const tasks = await db.taskCard.findMany({
            where: {
                userId,
                isArchived: false,
                // Optional: Filter by Process status if needed
            },
            include: {
                process: { select: { number: true, client: { select: { name: true } } } },
                client: { select: { name: true } },
                tags: true
            },
            orderBy: { fatalDate: 'asc' }
        })

        // Grouping by Phase is done in UI or here?
        // Let's return flat list to be flexible
        return tasks
    },

    moveCard: async (userId: string, cardId: string, newPhase: TaskPhase) => {
        return await db.taskCard.update({
            where: { id: cardId, userId },
            data: { phase: newPhase }
        })
    },

    createTask: async (userId: string, data: any) => {
        return await db.taskCard.create({
            data: {
                ...data,
                userId
            }
        })
    },

    // Cron-like function to be called periodically (e.g., via Vercel Cron or on Page Load optimized)
    checkAutoArchive: async (userId: string) => {
        // Archive Protocolled tasks > 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        await db.taskCard.updateMany({
            where: {
                userId,
                phase: 'PROTOCOLLED',
                updatedAt: { lte: thirtyDaysAgo },
                isArchived: false
            },
            data: { isArchived: true }
        })
    }
}
