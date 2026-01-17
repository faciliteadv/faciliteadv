import { db } from "@/lib/db"

export const CRMService = {
    // ============ CASE CARD METHODS ============
    getCases: async (userId: string) => {
        return await db.caseCard.findMany({
            where: {
                userId,
                isArchived: false
            },
            include: {
                checklist: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { deadline: 'asc' }
        })
    },

    createCase: async (userId: string, data: {
        clientName: string
        defendantName?: string
        practiceArea: string
        deadline?: Date
        description?: string
        checklist?: string[]
    }) => {
        const { checklist, ...caseData } = data

        return await db.caseCard.create({
            data: {
                ...caseData,
                userId,
                phase: 'NEW_LEAD',
                checklist: checklist && checklist.length > 0 ? {
                    create: checklist.map(title => ({ title }))
                } : undefined
            }
        })
    },

    moveCase: async (userId: string, caseId: string, newPhase: string) => {
        return await db.caseCard.update({
            where: { id: caseId, userId },
            data: { phase: newPhase }
        })
    },

    // ============ INSS CASE METHODS ============
    getINSSCases: async (userId: string) => {
        return await db.iNSSCase.findMany({
            where: {
                userId,
                isArchived: false
            },
            include: {
                checklist: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { deadline: 'asc' }
        })
    },

    createINSSCase: async (userId: string, data: {
        clientName: string
        clientCpf?: string
        govPassword?: string
        actionType: string
        deadline?: Date
        description?: string
        checklist?: string[]
    }) => {
        const { checklist, ...caseData } = data

        return await db.iNSSCase.create({
            data: {
                ...caseData,
                userId,
                phase: 'NEW_CASE',
                checklist: checklist && checklist.length > 0 ? {
                    create: checklist.map(title => ({ title }))
                } : undefined
            }
        })
    },

    moveINSSCase: async (userId: string, caseId: string, newPhase: string) => {
        // Auto-copy to CRM when moving to JUDICIAL_ACTION
        if (newPhase === 'JUDICIAL_ACTION') {
            const inssCase = await db.iNSSCase.findUnique({
                where: { id: caseId, userId }
            })

            if (inssCase) {
                // Calculate 5 business days from now
                const deadline = addBusinessDays(new Date(), 5)

                // Create corresponding CaseCard
                await db.caseCard.create({
                    data: {
                        clientName: inssCase.clientName,
                        practiceArea: 'SOCIAL_SECURITY',
                        phase: 'TODO',
                        deadline,
                        description: `Ação Judicial - INSS (${inssCase.actionType})`,
                        userId
                    }
                })
            }
        }

        return await db.iNSSCase.update({
            where: { id: caseId, userId },
            data: { phase: newPhase }
        })
    }
}

// Helper function to add business days
function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date)
    let added = 0

    while (added < days) {
        result.setDate(result.getDate() + 1)
        const dayOfWeek = result.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++
        }
    }

    return result
}
