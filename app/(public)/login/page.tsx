import { AuthForm } from '@/components/auth/auth-form'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams
    const errorMessage = params.error

    return (
        <div className="flex min-h-screen">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />

                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold text-white tracking-tight">FaciliteADV</h1>
                    </div>

                    <div className="max-w-md text-center">
                        <h2 className="text-2xl font-light text-white/90 mb-6">
                            Simplifique sua rotina jurídica
                        </h2>
                        <p className="text-blue-200/80 text-sm leading-relaxed">
                            Gerencie processos, clientes e prazos em um único lugar.
                            Feito para advogados que valorizam seu tempo.
                        </p>
                    </div>

                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50">
                <AuthForm errorMessage={errorMessage} />
            </div>
        </div>
    )
}
