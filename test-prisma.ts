import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log("Iniciando teste de conexão Prisma...")
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')) // Log seguro

    try {
        console.log("Tentando conectar...")
        await prisma.$connect()
        console.log("CONECTADO COM SUCESSO!")

        const testEmail = `test_${Date.now()}@example.com`
        console.log(`Tentando criar usuário de teste: ${testEmail}`)

        // Simula UUID do Supabase
        const fakeId = crypto.randomUUID()

        const user = await prisma.user.create({
            data: {
                id: fakeId,
                email: testEmail,
                name: 'Teste Prisma Script'
            }
        })

        console.log("USUÁRIO CRIADO COM SUCESSO:", user)

        // Limpeza
        console.log("Removendo usuário de teste...")
        await prisma.user.delete({
            where: { id: fakeId }
        })
        console.log("Usuário removido.")

    } catch (error) {
        console.error("ERRO GRAVE NO PRISMA:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
