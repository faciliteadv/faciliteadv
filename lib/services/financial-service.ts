import { db } from "@/lib/db"

export const FinancialService = {
    // List all financial records for a user with related data
    listRecords: async (userId: string) => {
        const records = await db.financialRecord.findMany({
            where: {
                client: { userId }
            },
            include: {
                client: { select: { name: true } },
                process: { select: { number: true, area: true } }
            },
            orderBy: { dueDate: 'desc' }
        })

        // Convert Decimal to number for Client Components compatibility
        return records.map(record => ({
            ...record,
            amount: Number(record.amount)
        }))
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

        const record = await db.financialRecord.create({
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

        return {
            ...record,
            amount: Number(record.amount)
        }
    },

    // Mark as paid
    markAsPaid: async (userId: string, recordId: string) => {
        // Verify record belongs to user's client
        const existingRecord = await db.financialRecord.findFirst({
            where: {
                id: recordId,
                client: { userId }
            }
        })
        if (!existingRecord) {
            throw new Error("Registro não encontrado")
        }

        const updated = await db.financialRecord.update({
            where: { id: recordId },
            data: { paidAt: new Date() }
        })

        return {
            ...updated,
            amount: Number(updated.amount)
        }
    }
}
