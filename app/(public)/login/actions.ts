'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'

export async function login(formData: FormData) {
    console.log("Tentando login com email/senha...")
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error("Erro no Login Supabase:", error.message)
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log("Login email/senha sucesso. Redirecionando...")
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

/**
 * Faz login/signup com Google OAuth
 * Se o usuário não existe, é criado automaticamente
 * Se o usuário já existe, apenas faz login
 */
export async function signInWithGoogle() {
    console.log("Iniciando login com Google OAuth...")
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (error) {
        console.error("Erro ao iniciar Google OAuth:", error.message)
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.url) {
        console.log("Redirecionando para Google OAuth...")
        redirect(data.url)
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}
