import { Prisma, ProcessStatus } from "@prisma/client"
import { db } from "@/lib/db"

async function getMemberIds(workspaceId: string): Promise<string[]> {
    const rows = await db.workspaceMember.findMany({
        where: { workspaceId },
        select: { userId: true },
    })
    return rows.map(r => r.userId)
}

type ProcessListRecord = Prisma.ProcessGetPayload<{
    include: {
        client: {
            select: {
                name: true
                type: true
            }
        }
    }
}>

type SerializedProcessListRecord = Omit<
    ProcessListRecord,
    "claimValue" | "createdAt" | "updatedAt" | "deletedAt" | "distributionDate"
> & {
    claimValue: number | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    distributionDate: string | null
    opponentName: string | null
}

export const ProcessService = {
    listProcesses: async (workspaceId: string, search?: string, statuses?: ProcessStatus[]): Promise<SerializedProcessListRecord[]> => {
        const memberIds = await getMemberIds(workspaceId)

        const processes = await db.process.findMany({
            where: {
                deletedAt: null,
                AND: [
                    { OR: [{ workspaceId }, { userId: { in: memberIds } }] },
                    ...(statuses?.length ? [{ status: { in: statuses } }] : []),
                    ...(search ? [{
                        OR: [
                            { number: { contains: search, mode: 'insensitive' as const } },
                            { folderName: { contains: search, mode: 'insensitive' as const } },
                            { actionType: { contains: search, mode: 'insensitive' as const } },
                        ]
                    }] : []),
                ],
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
                    ? opponentMap.get(p.opponent) ?? null
                    : (p.opponent && p.opponent.length === 36 ? null : p.opponent || null)
            }))
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
            opponentName: p.opponent || null
        }))
    },

    listStatusCounts: async (workspaceId: string, search?: string) => {
        const memberIds = await getMemberIds(workspaceId)

        const counts = await db.process.groupBy({
            by: ['status'],
            where: {
                deletedAt: null,
                AND: [
                    { OR: [{ workspaceId }, { userId: { in: memberIds } }] },
                    ...(search ? [{
                        OR: [
                            { number: { contains: search, mode: 'insensitive' as const } },
                            { folderName: { contains: search, mode: 'insensitive' as const } },
                            { actionType: { contains: search, mode: 'insensitive' as const } },
                        ]
                    }] : []),
                ],
            },
            _count: { _all: true }
        })

        return counts.map(item => ({
            status: item.status,
            count: item._count._all
        }))
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

    getById: async (workspaceId: string, processId: string) => {
        const memberIds = await getMemberIds(workspaceId)

        const process = await db.process.findFirst({
            where: {
                id: processId,
                deletedAt: null,
                OR: [{ workspaceId }, { userId: { in: memberIds } }],
            },
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
                opponentName: opponentClient?.name || null
            }
        }

        return { ...serialized, opponentName: (process.opponent && process.opponent.length === 36 ? null : process.opponent) }
    }
}
