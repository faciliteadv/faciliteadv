'use client'

import { useState } from 'react'
import { login, signup } from '@/app/(public)/login/actions'
import Link from 'next/link'
import { AlertCircle, Loader2 } from 'lucide-react'

export function AuthForm({ errorMessage }: { errorMessage?: string }) {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        try {
            if (mode === 'login') {
                await login(formData)
            } else {
                await signup(formData)
            }
        } catch (error) {
            // Em server actions com redirect, o erro pode ser um redirect, então não é necessariamente um erro
            // Se cair aqui e não for redirect, é erro real
        } finally {
            // Se for redirect, o componente desmonta, então não tem problema setar false
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
                    {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    {mode === 'login'
                        ? 'Entre na sua conta para continuar'
                        : 'Preencha os dados abaixo para começar'}
                </p>
            </div>

            {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{errorMessage}</p>
                </div>
            )}

            <div className="bg-white py-8 px-6 shadow-lg rounded-2xl border border-slate-100">
                <form action={handleSubmit} className="space-y-5">
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Nome Completo
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required={mode === 'signup'}
                                placeholder="Seu nome"
                                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    )}

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
                            autoComplete={mode === 'login' ? "current-password" : "new-password"}
                            required
                            placeholder="••••••••"
                            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        {mode === 'signup' && (
                            <p className="text-xs text-slate-500 mt-1">Mínimo de 6 caracteres</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : mode === 'login' ? (
                                'Entrar'
                            ) : (
                                'Criar Conta Gratuita'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-slate-500">
                            {mode === 'login' ? 'Novo por aqui?' : 'Já tem uma conta?'}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'login' ? 'signup' : 'login')
                            setIsLoading(false)
                        }}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                        {mode === 'login' ? 'Criar minha conta' : 'Fazer Login'}
                    </button>
                </div>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                    ← Voltar para o início
                </Link>
            </p>
        </div>
    )
}
