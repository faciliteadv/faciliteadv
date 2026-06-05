'use client'

import { useState } from 'react'
import { login, signInWithGoogle } from '@/app/(public)/login/actions'
import Link from 'next/link'
import { AlertCircle, Loader2 } from 'lucide-react'

export function AuthForm({ errorMessage }: { errorMessage?: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        try {
            await login(formData)
        } catch {
            // Em server actions com redirect, o erro pode ser um redirect, então não é necessariamente um erro
            // Se cair aqui e não for redirect, é erro real
        } finally {
            // Se for redirect, o componente desmonta, então não tem problema setar false
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            await signInWithGoogle()
        } catch (error) {
            console.error('Erro ao fazer login com Google:', error)
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center flex flex-col items-center">
                <h1 className="text-3xl font-bold text-blue-900">FaciliteADV</h1>
                <p className="text-slate-500 text-sm mt-1">Facilite sua advocacia</p>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                    Bem-vindo de volta
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Entre na sua conta para continuar
                </p>
            </div>

            {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{errorMessage}</p>
                </div>
            )}

            <div className="bg-white py-8 px-6 shadow-lg rounded-2xl border border-slate-100">
                {/* Google OAuth Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Conectando...
                        </>
                    ) : (
                        'Continuar com Google'
                    )}
                </button>

                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-slate-500">
                            Ou entre com email
                        </span>
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-5 mt-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="seu@email.com"
                            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Senha
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                    ← Voltar para o início
                </Link>
            </p>
        </div>
    )
}
