import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/lib/services/workspace-service'

/**
 * Route Handler para o callback do Google OAuth
 * GET /auth/callback
 * 
 * Supabase redireciona aqui após autenticação com Google
 * Este handler:
 * 1. Verifica se há código de autenticação
 * 2. Cria/atualiza a sessão
 * 3. Cria usuário no Prisma (se novo)
 * 4. Redireciona para dashboard
 */
export async function GET(request: NextRequest) {
    console.log('🔐 OAuth Callback - Iniciando verificação...')
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Verifica se há erro na autenticação
    if (error) {
        console.error('❌ Erro OAuth:', errorDescription)
        return redirect(
            `/login?error=${encodeURIComponent(errorDescription || error)}`
        )
    }

    // Verifica se há código de autenticação
    if (!code) {
        console.error('❌ Sem código de autenticação')
        return redirect('/login?error=Sem código de autenticação')
    }

    try {
        const supabase = await createClient()

        // Exchange do código por session
        console.log('🔄 Trocando código por sessão...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError || !data.user) {
            console.error('❌ Erro ao trocar código:', exchangeError?.message)
            return redirect(
                `/login?error=${encodeURIComponent(exchangeError?.message || 'Erro na autenticação')}`
            )
        }

        const user = data.user
        console.log('✅ Sessão criada para:', user.email)

        // Ensure DB user record exists
        let dbUser = await db.user.findUnique({ where: { id: user.id } })

        if (!dbUser) {
            console.log('📝 Criando novo usuário no banco de dados...')
            const userName = user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'Usuário'

            dbUser = await db.user.create({
                data: { id: user.id, email: user.email || '', name: userName }
            })
            console.log('✅ Usuário criado no banco:', dbUser.email)
        } else {
            console.log('✅ Usuário já existe no banco:', dbUser.email)
        }

        // Guarantee workspace exists with correct permissions (creates if missing)
        await WorkspaceService.ensureWorkspace(user.id, dbUser.name ?? undefined)
        console.log('✅ Workspace garantido para:', dbUser.email)

        console.log('🎉 Autenticação Google OAuth sucesso!')
        return redirect('/dashboard')

    } catch (error) {
        console.error('❌ Erro crítico no callback:', error)
        return redirect(
            '/login?error=' + encodeURIComponent('Erro ao processar autenticação')
        )
    }
}
