import { db } from "@/lib/db"
import { TaskType } from "@prisma/client"

export const KanbanService = {
    getBoard: async (userId: string) => {
        const tasks = await db.taskCard.findMany({
            where: {
                userId,
                isArchived: false,
                // Optional: Filter by Process status if needed
            },
            include: {
                // position: true, // Excluded due to missing DB column
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                process: {
                    select: {
                        id: true,
                        number: true,
                        folderName: true
                    }
                },
                responsibleLawyer: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                tags: true,
                checklist: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { fatalDate: 'asc' }
        })

        // Serialize dates to avoid Next.js server component errors
        return tasks.map(task => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            fatalDate: task.fatalDate ? task.fatalDate.toISOString() : null,
            endDate: task.endDate ? task.endDate.toISOString() : null,
            publicationDate: task.publicationDate ? task.publicationDate.toISOString() : null,
            protocolDate: task.protocolDate ? task.protocolDate.toISOString() : null,
        }))
    },

    moveCard: async (userId: string, cardId: string, columnId: string) => {
        // Fetch the target column to get its name (for legacy support)
        const column = await db.kanbanColumn.findUnique({
            where: { id: columnId }
        })

        if (!column) throw new Error('Coluna não encontrada')

        return await db.taskCard.update({
            where: { id: cardId, userId },
            data: {
                columnId: columnId,
                phase: column.name
            } as any
        })
    },

    createTask: async (userId: string, data: {
        title: string
        description?: string
        type: TaskType
        phase?: string
        fatalDate?: Date
        endDate?: Date
        publicationDate?: Date
        protocolDate?: Date
        daysCount?: number
        daysType?: 'BUSINESS' | 'CALENDAR'
        practiceArea?: string
        processId?: string
        clientId?: string
        responsibleLawyerId?: string
        points?: number
        tags?: string[] // Tag IDs
        checklist?: string[] // Checklist Titles
    }) => {
        const { checklist, tags, practiceArea, daysType, ...taskData } = data

        return await db.taskCard.create({
            data: {
                ...taskData,
                userId,
                phase: data.phase || 'A Fazer',
                practiceArea: practiceArea as any, // Cast to PracticeArea enum
                daysType: daysType as any, // Cast to DaysType enum
                tags: tags && tags.length > 0 ? {
                    connect: tags.map(id => ({ id }))
                } : undefined,
                checklist: checklist && checklist.length > 0 ? {
                    create: checklist.map(title => ({ title }))
                } : undefined
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
