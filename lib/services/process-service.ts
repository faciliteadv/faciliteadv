import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export const ProcessService = {
    // LIST with Hierarchy Logic
    // In the DB we store flat records, but in UI we group them.
    // This service returns the flat list optimized for grouping.
    listProcesses: async (userId: string, search?: string) => {
        return await db.process.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { number: { contains: search, mode: 'insensitive' } },
                        { folderName: { contains: search, mode: 'insensitive' } },
                        { subject: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            include: {
                client: {
                    select: { name: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    },

    create: async (userId: string, data: Omit<Prisma.ProcessUncheckedCreateInput, 'userId'>) => {
        // Validate hierarchy logic here if needed
        // Calculate folderName for caching: "Area > Client"
        // (Actual complex logic would go here)

        return await db.process.create({
            data: {
                ...data,
                userId
            }
        })
    },

    getById: async (userId: string, processId: string) => {
        return await db.process.findFirst({
            where: { id: processId, userId, deletedAt: null },
            include: {
                tasks: { orderBy: { fatalDate: 'asc' } },
                client: true
            }
        })
    }
}
