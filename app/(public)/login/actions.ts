'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db'

export async function login(formData: FormData) {
    console.log("Tentando login...")
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error("Erro no Login Supabase:", error.message)
        // Se a mensagem for 'Invalid login credentials', pode ser senha errada ou email não confirmado.
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log("Login Auth sucesso. Redirecionando...")
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    console.log("Tentando cadastro...")
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string || email.split('@')[0]

    const data = {
        email,
        password,
        options: {
            data: {
                name: name,
            }
        }
    }

    const { data: authData, error } = await supabase.auth.signUp(data)

    if (error) {
        console.error("Erro no Cadastro Supabase:", error.message)
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log("Cadastro Auth sucesso:", authData.user?.id)

    if (authData.user) {
        // Verifica identities
        if (authData.user.identities && authData.user.identities.length === 0) {
            console.warn("Usuário já existe. Redirecionando.")
            return redirect('/login?error=Usuário já cadastrado. Tente entrar.')
        }

        // Criar no Prisma
        try {
            console.log("Verificando se usuário existe no DB...")
            const existingUser = await db.user.findUnique({
                where: { email }
            })

            if (!existingUser) {
                console.log("Criando usuário no Prisma...")
                await db.user.create({
                    data: {
                        id: authData.user.id,
                        email: email,
                        name: name,
                    }
                })
                console.log("Usuário criado no Prisma com sucesso.")
            }
        } catch (dbError) {
            console.error("Erro CRÍTICO no banco:", dbError)
        }

        // DETECÇÃO DE EMAIL CONFIRMATION
        // Se user existe, mas session é null, o usuário precisa confirmar email
        if (authData.user && !authData.session) {
            console.log("Sessão nula após cadastro. Email confirmation provável.")
            return redirect('/login?error=Cadastro realizado! Verifique seu email para confirmar a conta antes de entrar.')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}
