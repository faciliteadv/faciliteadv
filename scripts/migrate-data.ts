import { db } from "@/lib/db"

async function main() {
    console.log('Starting data migration: Linking Tasks to Columns...')

    // Fetch all users to handle multi-tenant logic correctly if needed (assuming single user per request logic usually, but script is global)
    // Or just fetch all columns
    const columns = await db.kanbanColumn.findMany()
    console.log(`Found ${columns.length} columns.`)

    let updatedCount = 0

    for (const col of columns) {
        // Find tasks that match phase name and userId
        // Note: phase is stored in TaskCard
        // We match strictly by phase === col.name

        const tasks = await db.taskCard.findMany({
            where: {
                userId: col.userId,
                phase: col.name,
                columnId: null // Only migrate unlinked tasks
            }
        })

        if (tasks.length > 0) {
            console.log(`Column "${col.name}" (ID: ${col.id}) matches ${tasks.length} tasks. Linking...`)

            // Batch update? Prisma updateMany
            const result = await db.taskCard.updateMany({
                where: {
                    userId: col.userId,
                    phase: col.name,
                    columnId: null
                },
                data: {
                    columnId: col.id
                }
            })
            updatedCount += result.count
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} tasks.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        // Disconnect
    })
