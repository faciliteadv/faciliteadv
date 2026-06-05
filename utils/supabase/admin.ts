import { createClient } from '@supabase/supabase-js'

// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
// Get it at: Supabase Dashboard → Project Settings → API → service_role (secret)
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurado no .env.local')
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
