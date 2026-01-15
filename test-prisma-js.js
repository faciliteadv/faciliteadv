const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    // log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log("Iniciando teste de conexão Prisma (JS)...")

    // Obfusca a senha no log
    const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
    const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log("DATABASE_URL:", safeUrl)

    try {
        console.log("Tentando conectar...")
        await prisma.$connect()
        console.log("CONECTADO COM SUCESSO! (Prisma Client conectou)")

        const testEmail = `test_${Date.now()}@example.com`
        console.log(`Tentando criar usuário de teste: ${testEmail}`)

        // Simula UUID
        const fakeId = '00000000-0000-0000-0000-' + Date.now().toString().slice(-12)

        const user = await prisma.user.create({
            data: {
                id: fakeId,
                email: testEmail,
                name: 'Teste Prisma Script JS'
            }
        })

        console.log("USUÁRIO CRIADO COM SUCESSO (RETORNO DO DB):")
        console.log(JSON.stringify(user, null, 2))

        // Limpeza
        console.log("Removendo usuário de teste...")
        await prisma.user.delete({
            where: { id: fakeId }
        })
        console.log("Usuário removido.")

    } catch (error) {
        console.error("ERRO GRAVE NO PRISMA:", error)
        if (error.code) console.error("Error Code:", error.code)
        if (error.meta) console.error("Error Meta:", error.meta)
    } finally {
        await prisma.$disconnect()
    }
}

main()
