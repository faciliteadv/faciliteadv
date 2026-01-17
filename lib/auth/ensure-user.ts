import { db } from "@/lib/db"
import { createClient } from "@/utils/supabase/server"

/**
 * Ensures the Supabase auth user exists in our database.
 * Creates the user record if it doesn't exist.
 * Should be called on protected routes.
 */
export async function ensureUserExists() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Check if user exists in DB
    let dbUser = await db.user.findUnique({
        where: { id: user.id }
    })

    // Create if not exists
    if (!dbUser) {
        dbUser = await db.user.create({
            data: {
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
            }
        })
    }

    return dbUser
}
