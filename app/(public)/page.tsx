import Link from 'next/link'
import Image from 'next/image'
import {
    Briefcase, Users, DollarSign, Calendar, LayoutDashboard,
    CheckCircle, Zap, Shield, ArrowRight, ChevronRight,
    Scale, Clock, FileText
} from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">FaciliteADV</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">
                                Funcionalidades
                            </a>
                            <a href="#benefits" className="text-sm text-slate-300 hover:text-white transition-colors">
                                Benefícios
                            </a>
                            <a href="#stats" className="text-sm text-slate-300 hover:text-white transition-colors">
                                Resultados
                            </a>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                Entrar
                            </Link>
                            <Link
                                href="/login"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
                            >
                                Começar Grátis
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 via-slate-950 to-slate-950" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px]" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-slate-300">Novo: Kanban integrado com prazos</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                        <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                            Facilite sua
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Advocacia
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Gerencie processos, clientes e prazos em um único lugar.
                        Pensado para advogados que querem <span className="text-white font-medium">mais tempo para o que importa</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/login"
                            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                            Começar Gratuitamente
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="flex items-center gap-2 text-slate-400 hover:text-white px-6 py-4 transition-colors"
                        >
                            Ver funcionalidades
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                        {[
                            { value: '100%', label: 'Gratuito para começar' },
                            { value: '5min', label: 'Para configurar' },
                            { value: '0', label: 'Burocracia' },
                            { value: '∞', label: 'Possibilidades' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-white/40 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Tudo o que você precisa,
                            <br />
                            <span className="text-slate-500">em um só lugar</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Ferramentas integradas que simplificam sua rotina jurídica
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Briefcase,
                                title: 'Gestão de Processos',
                                description: 'Acompanhe todos os processos em um painel visual. Nunca mais perca um prazo.',
                                color: 'blue'
                            },
                            {
                                icon: Users,
                                title: 'CRM de Clientes',
                                description: 'Gerencie clientes, contatos e histórico de atendimentos de forma organizada.',
                                color: 'green'
                            },
                            {
                                icon: DollarSign,
                                title: 'Financeiro Integrado',
                                description: 'Controle honorários, parcelas e pagamentos. Saiba quanto vai receber e quando.',
                                color: 'yellow'
                            },
                            {
                                icon: LayoutDashboard,
                                title: 'Kanban de Tarefas',
                                description: 'Organize atividades em colunas visuais. Arraste e solte para atualizar status.',
                                color: 'purple'
                            },
                            {
                                icon: Calendar,
                                title: 'Agenda Inteligente',
                                description: 'Compromissos, audiências e prazos em um calendário unificado.',
                                color: 'pink'
                            },
                            {
                                icon: FileText,
                                title: 'Dashboard Completo',
                                description: 'Visão geral do escritório com métricas em tempo real.',
                                color: 'cyan'
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group relative bg-slate-900/50 border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-6`}>
                                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-32 relative bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">
                                Focado em
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    simplificar
                                </span>
                            </h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        icon: Clock,
                                        title: 'Economize tempo',
                                        description: 'Menos cliques, mais resultados. Interface pensada para agilidade.'
                                    },
                                    {
                                        icon: CheckCircle,
                                        title: 'Nunca perca prazos',
                                        description: 'Alertas e notificações automáticas para compromissos importantes.'
                                    },
                                    {
                                        icon: Shield,
                                        title: 'Dados seguros',
                                        description: 'Criptografia de ponta a ponta e backups automáticos.'
                                    }
                                ].map((benefit, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <benefit.icon className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">{benefit.title}</h3>
                                            <p className="text-slate-400">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
                            <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="space-y-4">
                                    <div className="h-6 bg-slate-800 rounded w-3/4" />
                                    <div className="h-6 bg-slate-800 rounded w-1/2" />
                                    <div className="grid grid-cols-3 gap-4 mt-8">
                                        <div className="h-24 bg-blue-500/20 rounded-xl" />
                                        <div className="h-24 bg-green-500/20 rounded-xl" />
                                        <div className="h-24 bg-purple-500/20 rounded-xl" />
                                    </div>
                                    <div className="h-32 bg-slate-800/50 rounded-xl mt-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-32 relative">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16">
                        Feito para advogados
                        <br />
                        <span className="text-slate-500">modernos</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { value: 'Simples', subtitle: 'Interface limpa' },
                            { value: 'Rápido', subtitle: 'Performance otimizada' },
                            { value: 'Seguro', subtitle: 'Seus dados protegidos' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-8">
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-slate-400">{stat.subtitle}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/30 to-transparent" />
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Pronto para facilitar
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            sua advocacia?
                        </span>
                    </h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
                        Comece gratuitamente e descubra como é simples gerenciar seu escritório.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-100 transition-all hover:shadow-xl hover:shadow-white/10 hover:-translate-y-0.5"
                    >
                        Criar Conta Gratuita
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <Scale className="w-6 h-6 text-blue-400" />
                            <span className="font-semibold">FaciliteADV</span>
                            <span className="text-slate-500 text-sm ml-2">Facilite sua advocacia</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            © {new Date().getFullYear()} FaciliteADV. Todos os direitos reservados.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
