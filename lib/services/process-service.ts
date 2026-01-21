import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

export const ProcessService = {
    // LIST with Hierarchy Logic
    // In the DB we store flat records, but in UI we group them.
    // This service returns the flat list optimized for grouping.
    listProcesses: async (userId: string, search?: string) => {
        const processes = await db.process.findMany({
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

        // Hydrate opponents name if it's a UUID
        const opponentIds = processes
            .map(p => p.opponent)
            .filter((id): id is string => !!id && id.length === 36) // Simple UUID check

        if (opponentIds.length > 0) {
            const opponents = await db.client.findMany({
                where: { id: { in: opponentIds } },
                select: { id: true, name: true }
            })

            const opponentMap = new Map(opponents.map(o => [o.id, o.name]))

            return processes.map(p => ({
                ...p,
                opponentName: p.opponent && opponentMap.has(p.opponent)
                    ? opponentMap.get(p.opponent)
                    : p.opponent
            })) as any
        }

        return processes.map(p => ({ ...p, opponentName: p.opponent })) as any
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
        const process = await db.process.findFirst({
            where: { id: processId, userId, deletedAt: null },
            include: {
                tasks: { orderBy: { fatalDate: 'asc' } },
                client: true
            }
        })

        if (process && process.opponent && process.opponent.length === 36) {
            const opponentClient = await db.client.findUnique({
                where: { id: process.opponent },
                select: { name: true }
            })
            return {
                ...process,
                opponentName: opponentClient?.name || process.opponent
            }
        }

        return process ? { ...process, opponentName: process.opponent } : null
    }
}
