import { db } from "@/lib/db"

export const FinancialService = {
    // List all financial records for a user with related data
    listRecords: async (userId: string) => {
        return await db.financialRecord.findMany({
            where: {
                client: { userId }
            },
            include: {
                client: { select: { name: true } },
                process: { select: { number: true, area: true } }
            },
            orderBy: { dueDate: 'desc' }
        })
    },

    // Get summary: total pending, total received, total overdue
    getSummary: async (userId: string) => {
        const records = await db.financialRecord.findMany({
            where: {
                client: { userId }
            },
            select: {
                amount: true,
                paidAt: true,
                dueDate: true,
                type: true
            }
        })

        const now = new Date()
        let totalPending = 0
        let totalReceived = 0
        let totalOverdue = 0

        for (const record of records) {
            const amount = Number(record.amount)
            if (record.paidAt) {
                totalReceived += amount
            } else {
                totalPending += amount
                if (record.dueDate < now) {
                    totalOverdue += amount
                }
            }
        }

        return { totalPending, totalReceived, totalOverdue }
    },

    // Create a new financial record
    create: async (userId: string, data: {
        type: string
        amount: number
        dueDate: Date
        description?: string
        clientId: string
        processId?: string
    }) => {
        // Verify client belongs to user
        const client = await db.client.findFirst({
            where: { id: data.clientId, userId }
        })
        if (!client) {
            throw new Error("Cliente não encontrado")
        }

        return await db.financialRecord.create({
            data: {
                type: data.type,
                amount: data.amount,
                dueDate: data.dueDate,
                description: data.description,
                clientId: data.clientId,
                processId: data.processId,
                userId
            }
        })
    },

    // Mark as paid
    markAsPaid: async (userId: string, recordId: string) => {
        // Verify record belongs to user's client
        const record = await db.financialRecord.findFirst({
            where: {
                id: recordId,
                client: { userId }
            }
        })
        if (!record) {
            throw new Error("Registro não encontrado")
        }

        return await db.financialRecord.update({
            where: { id: recordId },
            data: { paidAt: new Date() }
        })
    }
}
