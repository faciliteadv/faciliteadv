import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    let dbStatus = "Checking..."
    let dbError = null
    let envCheck = "Ok"

    try {
        // Verifica se a URL começa com aspas (erro comum ao copiar do txt)
        const url = process.env.DATABASE_URL || ""
        if (url.startsWith('"') || url.startsWith("'")) {
            envCheck = "ERRO: A variável DATABASE_URL contém aspas no início. Remova as aspas no painel da Vercel."
        } else if (!url) {
            envCheck = "ERRO: DATABASE_URL está vazia."
        } else {
             // Tenta query simples
             const count = await db.user.count()
             dbStatus = `SUCESSO! Conectado. Usuários no banco: ${count}`
        }

    } catch (e: any) {
        dbStatus = "FALHA NA CONEXÃO"
        dbError = e.message
    }

    return (
        <div className="p-8 font-mono text-sm space-y-4">
            <h1 className="text-xl font-bold">Diagnóstico de Produção</h1>
            
            <div className="p-4 border rounded bg-slate-100">
                <h2 className="font-bold">Verificação de Ambiente</h2>
                <p className={envCheck.includes("ERRO") ? "text-red-600" : "text-green-600"}>
                    {envCheck}
                </p>
                <p className="text-gray-500 mt-2">
                    URL (Safe): {process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 10)}...` : "Não definida"}
                </p>
            </div>

            <div className="p-4 border rounded bg-slate-100">
                <h2 className="font-bold">Teste de Banco de Dados</h2>
                <p className={dbError ? "text-red-600" : "text-green-600"}>
                    Result: {dbStatus}
                </p>
                {dbError && (
                    <pre className="mt-2 text-red-500 whitespace-pre-wrap">
                        {dbError}
                    </pre>
                )}
            </div>
        </div>
    )
}
