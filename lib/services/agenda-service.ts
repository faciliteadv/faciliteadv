import { db } from "@/lib/db"
import { Prisma, AppointmentType } from "@prisma/client"

// Re-export the type from Prisma for external use
export type { Appointment } from "@prisma/client"

// Type for creating appointments (without auto-generated fields)
export type CreateAppointmentData = {
    title: string
    description?: string
    startAt: Date
    endAt: Date
    type?: AppointmentType
    location?: string
    clientId?: string
    processId?: string
}

// Type for updating appointments
export type UpdateAppointmentData = Partial<CreateAppointmentData>

export const AgendaService = {
    /**
     * Get all appointments for a user, ordered by start date
     */
    getAppointments: async (userId: string) => {
        return await db.appointment.findMany({
            where: { userId },
            include: {
                client: {
                    select: { id: true, name: true }
                },
                process: {
                    select: { id: true, number: true }
                }
            },
            orderBy: { startAt: 'asc' }
        })
    },

    /**
     * Get appointments within a date range
     */
    getAppointmentsByDateRange: async (userId: string, startDate: Date, endDate: Date) => {
        return await db.appointment.findMany({
            where: {
                userId,
                startAt: { gte: startDate },
                endAt: { lte: endDate }
            },
            include: {
                client: {
                    select: { id: true, name: true }
                },
                process: {
                    select: { id: true, number: true }
                }
            },
            orderBy: { startAt: 'asc' }
        })
    },

    /**
     * Get a single appointment by ID
     */
    getById: async (userId: string, appointmentId: string) => {
        return await db.appointment.findFirst({
            where: { id: appointmentId, userId },
            include: {
                client: {
                    select: { id: true, name: true }
                },
                process: {
                    select: { id: true, number: true, area: true }
                }
            }
        })
    },

    /**
     * Create a new appointment
     */
    createAppointment: async (userId: string, data: CreateAppointmentData) => {
        return await db.appointment.create({
            data: {
                ...data,
                userId,
                type: data.type ?? 'MEETING'
            },
            include: {
                client: {
                    select: { id: true, name: true }
                }
            }
        })
    },

    /**
     * Update an existing appointment
     */
    updateAppointment: async (userId: string, appointmentId: string, data: UpdateAppointmentData) => {
        return await db.appointment.update({
            where: { id: appointmentId, userId },
            data
        })
    },

    /**
     * Delete an appointment
     */
    deleteAppointment: async (userId: string, appointmentId: string) => {
        return await db.appointment.delete({
            where: { id: appointmentId, userId }
        })
    },

    /**
     * Get upcoming appointments (next 7 days)
     */
    getUpcomingAppointments: async (userId: string, days: number = 7) => {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(now.getDate() + days)

        return await db.appointment.findMany({
            where: {
                userId,
                startAt: {
                    gte: now,
                    lte: futureDate
                }
            },
            include: {
                client: {
                    select: { id: true, name: true }
                },
                process: {
                    select: { id: true, number: true }
                }
            },
            orderBy: { startAt: 'asc' }
        })
    }
}
