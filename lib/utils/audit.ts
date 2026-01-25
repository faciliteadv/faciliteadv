import { db } from "@/lib/db"

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

interface AuditParams {
    userId: string
    entityId: string
    entityType: 'PROCESS' | 'CLIENT' | 'TASK' | 'FINANCIAL' | 'APPOINTMENT'
    action: AuditAction
    oldData?: any
    newData?: any
}

/**
 * Records an audit log entry in the database.
 * Use this to track critical changes in the system.
 */
export async function recordAuditLog({
    userId,
    entityId,
    entityType,
    action,
    oldData,
    newData
}: AuditParams) {
    try {
        await db.auditLog.create({
            data: {
                userId,
                entityId,
                entityType,
                action,
                oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
                newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
            }
        })
    } catch (error) {
        console.error("Failed to record audit log:", error)
        // We don't throw here to avoid failing the main operation if audit logging fails
    }
}
