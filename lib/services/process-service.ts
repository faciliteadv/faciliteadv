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
                        { actionType: { contains: search, mode: 'insensitive' } }
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
                // Convert Decimal to number for serialization
                claimValue: p.claimValue ? Number(p.claimValue) : null,
                // Convert Date to ISO string for serialization
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                deletedAt: p.deletedAt?.toISOString() || null,
                distributionDate: p.distributionDate?.toISOString() || null,
                opponentName: p.opponent && opponentMap.has(p.opponent)
                    ? opponentMap.get(p.opponent)
                    : p.opponent
            })) as any
        }

        return processes.map(p => ({
            ...p,
            // Convert Decimal to number for serialization
            claimValue: p.claimValue ? Number(p.claimValue) : null,
            // Convert Date to ISO string for serialization
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            deletedAt: p.deletedAt?.toISOString() || null,
            distributionDate: p.distributionDate?.toISOString() || null,
            opponentName: p.opponent
        })) as any
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
                client: true,
                authors: { include: { client: true } },
                opponents: true
            }
        })

        if (!process) return null

        // Serialize for Client Components
        const serialized = {
            ...process,
            // Convert Decimal to number
            claimValue: process.claimValue ? Number(process.claimValue) : null,
            // Convert Dates to ISO strings
            createdAt: process.createdAt.toISOString(),
            updatedAt: process.updatedAt.toISOString(),
            deletedAt: process.deletedAt?.toISOString() || null,
            distributionDate: process.distributionDate?.toISOString() || null,
            // Serialize client dates
            client: process.client ? {
                ...process.client,
                createdAt: process.client.createdAt.toISOString(),
                updatedAt: process.client.updatedAt.toISOString(),
                deletedAt: process.client.deletedAt?.toISOString() || null,
            } : null,
            // Serialize tasks dates
            tasks: process.tasks.map(task => ({
                ...task,
                startDate: task.startDate?.toISOString() || null,
                endDate: task.endDate?.toISOString() || null,
                fatalDate: task.fatalDate?.toISOString() || null,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
            })),
            // Serialize authors
            authors: process.authors.map(author => ({
                ...author,
                createdAt: author.createdAt.toISOString(),
                client: author.client ? {
                    ...author.client,
                    createdAt: author.client.createdAt.toISOString(),
                    updatedAt: author.client.updatedAt.toISOString(),
                    deletedAt: author.client.deletedAt?.toISOString() || null,
                } : null
            })),
            // Serialize opponents
            opponents: process.opponents.map(opp => ({
                ...opp,
                createdAt: opp.createdAt.toISOString(),
            }))
        }

        if (process.opponent && process.opponent.length === 36) {
            const opponentClient = await db.client.findUnique({
                where: { id: process.opponent },
                select: { name: true }
            })
            return {
                ...serialized,
                opponentName: opponentClient?.name || process.opponent
            }
        }

        return { ...serialized, opponentName: process.opponent }
    }
}
