import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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

        // Verifica se o usuário já existe no Prisma
        let dbUser = await db.user.findUnique({
            where: { id: user.id }
        })

        if (!dbUser) {
            console.log('📝 Criando novo usuário no banco de dados...')
            
            // Extrai o nome do profile do Google
            const userName = user.user_metadata?.full_name || 
                             user.user_metadata?.name || 
                             user.email?.split('@')[0] ||
                             'Usuário'

            dbUser = await db.user.create({
                data: {
                    id: user.id,
                    email: user.email || '',
                    name: userName,
                }
            })
            console.log('✅ Usuário criado no banco:', dbUser.email)

            // Criar workspace padrão para novo usuário
            console.log('📦 Criando workspace padrão...')
            try {
                // Gerar slug único do workspace
                const slug = `workspace-${user.id.substring(0, 8)}`

                // Criar workspace primeiro
                const workspace = await db.workspace.create({
                    data: {
                        name: `${userName}'s Workspace`,
                        slug: slug,
                        isActive: true,
                    }
                })
                console.log('✅ Workspace criado:', workspace.name)

                // Criar role padrão (Owner) associada ao workspace
                const ownerRole = await db.role.create({
                    data: {
                        name: 'Owner',
                        permissions: ['admin'],
                        workspace: {
                            connect: { id: workspace.id }
                        }
                    }
                })
                console.log('✅ Role criada:', ownerRole.name)

                // Criar membership
                await db.workspaceMember.create({
                    data: {
                        workspaceId: workspace.id,
                        userId: user.id,
                        roleId: ownerRole.id,
                    }
                })
                console.log('✅ Membership criado')
            } catch (wsError) {
                console.error('⚠️ Erro ao criar workspace (não bloqueante):', wsError)
                // Não bloqueamos o login se workspace falhar
            }
        } else {
            console.log('✅ Usuário já existe no banco:', dbUser.email)

            // Garante que o usuário existente tenha workspace (pode ter sido criado antes da feature)
            const hasMembership = await db.workspaceMember.findFirst({
                where: { userId: user.id }
            })

            if (!hasMembership) {
                console.log('📦 Usuário sem workspace, criando...')
                try {
                    const userName = dbUser.name || user.email?.split('@')[0] || 'Usuário'
                    const slug = `workspace-${user.id.substring(0, 8)}`

                    const workspace = await db.workspace.create({
                        data: { name: `${userName}'s Workspace`, slug, isActive: true }
                    })

                    const ownerRole = await db.role.create({
                        data: {
                            name: 'Owner',
                            permissions: ['admin'],
                            workspace: { connect: { id: workspace.id } }
                        }
                    })

                    await db.workspaceMember.create({
                        data: { workspaceId: workspace.id, userId: user.id, roleId: ownerRole.id }
                    })
                    console.log('✅ Workspace retroativo criado para:', dbUser.email)
                } catch (wsError) {
                    console.error('⚠️ Erro ao criar workspace retroativo:', wsError)
                }
            }
        }

        console.log('🎉 Autenticação Google OAuth sucesso!')
        return redirect('/dashboard')

    } catch (error) {
        console.error('❌ Erro crítico no callback:', error)
        return redirect(
            '/login?error=' + encodeURIComponent('Erro ao processar autenticação')
        )
    }
}
