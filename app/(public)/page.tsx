import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Shield, BarChart3, Clock, Users, Zap, Scale, LayoutDashboard, FileText } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white overflow-x-hidden selection:bg-blue-400 selection:text-blue-950">

            {/* Navbar (Glass) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-950/20 backdrop-blur-md border-b border-white/10 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
                            <Scale className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">FaciliteADV</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-blue-100/80">
                        <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
                        <Link href="#solutions" className="hover:text-white transition-colors">Soluções</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Planos</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-blue-100 hover:text-white transition-colors hidden sm:block">
                            Entrar
                        </Link>
                        <Link href="/login">
                            <Button className="bg-white hover:bg-white/90 text-blue-900 font-semibold rounded-lg px-6 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5">
                                Começar Grátis
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-200 backdrop-blur-md mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
                        Software Jurídico Nº 1
                    </div>

                    {/* H1 */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.1] mb-6 drop-shadow-sm">
                        Facilite sua <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                            Advocacia
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p className="max-w-2xl mx-auto text-xl text-blue-100/80 leading-relaxed mb-10 font-light">
                        Gerencie processos, clientes e prazos em um único lugar. Pensado para advogados que querem mais tempo para o que importa.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login">
                            <Button size="lg" className="h-14 px-8 text-lg bg-white hover:bg-blue-50 text-blue-900 font-bold shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:-translate-y-1 rounded-xl transition-all">
                                Testar Agora (Grátis)
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#demo">
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all rounded-xl backdrop-blur-md bg-white/5">
                                Ver Demonstração
                            </Button>
                        </Link>
                    </div>

                    {/* Dashboard Visual (Simulation) */}
                    <div className="mt-20 relative mx-auto max-w-6xl transform perspective-1000 rotate-x-2 hover:rotate-x-0 transition-transform duration-1000 ease-out">
                        {/* Glow effect underneath */}
                        <div className="absolute -inset-2 bg-gradient-to-t from-blue-500/20 to-transparent rounded-[2.5rem] blur-xl opacity-50" />

                        {/* Main Container */}
                        <div className="relative bg-white ml-2 rounded-2xl shadow-2xl border border-white/10 overflow-hidden ring-1 ring-black/5">
                            {/* Header Bar Mockup */}
                            <div className="h-14 border-b border-slate-100 bg-white flex items-center justify-between px-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                                        <Scale className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="h-4 w-24 bg-slate-100 rounded-full" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100" />
                                    <div className="h-8 w-8 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">FA</div>
                                </div>
                            </div>

                            {/* App Body Mockup */}
                            <div className="flex h-[500px] bg-slate-50/50">
                                {/* Sidebar Mockup */}
                                <div className="w-64 border-r border-slate-100 bg-white p-4 hidden md:flex flex-col gap-2">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className={`h-10 w-full rounded-lg flex items-center px-3 gap-3 ${i === 1 ? 'bg-blue-50/80' : 'bg-transparent'}`}>
                                            <div className={`w-5 h-5 rounded ${i === 1 ? 'bg-blue-200' : 'bg-slate-100'}`} />
                                            <div className={`h-3 w-24 rounded-full ${i === 1 ? 'bg-blue-200' : 'bg-slate-100'}`} />
                                        </div>
                                    ))}
                                </div>

                                {/* Content Area Mockup */}
                                <div className="flex-1 p-8 overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-2">
                                            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                                            <div className="h-4 w-64 bg-slate-100 rounded-lg" />
                                        </div>
                                        <div className="h-10 w-32 bg-blue-600 rounded-lg shadow-sm shadow-blue-200" />
                                    </div>

                                    {/* Bento / Widgets Mockup */}
                                    <div className="grid grid-cols-3 gap-6">
                                        {/* Card 1 */}
                                        <div className="col-span-2 h-48 bg-white rounded-xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-6 space-y-4">
                                            <div className="flex justify-between">
                                                <div className="h-10 w-10 rounded-lg bg-blue-50" />
                                                <div className="h-6 w-16 bg-green-50 rounded-full" />
                                            </div>
                                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-blue-500 rounded-full" />
                                            </div>
                                            <div className="space-y-2 pt-4">
                                                <div className="h-3 w-full bg-slate-50 rounded" />
                                                <div className="h-3 w-5/6 bg-slate-50 rounded" />
                                                <div className="h-3 w-4/6 bg-slate-50 rounded" />
                                            </div>
                                        </div>
                                        {/* Card 2 */}
                                        <div className="h-48 bg-white rounded-xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100 p-6 flex flex-col justify-between">
                                            <div className="h-10 w-10 rounded-full ring-4 ring-blue-50 bg-blue-100 self-center" />
                                            <div className="space-y-2 text-center">
                                                <div className="h-4 w-12 bg-slate-200 rounded mx-auto" />
                                                <div className="h-3 w-20 bg-slate-100 rounded mx-auto" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* List Mockup */}
                                    <div className="mt-6 bg-white rounded-xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100 h-40 w-full p-4 space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100" />
                                                    <div className="space-y-1">
                                                        <div className="h-3 w-32 bg-slate-100 rounded" />
                                                        <div className="h-2 w-20 bg-slate-50 rounded" />
                                                    </div>
                                                </div>
                                                <div className="h-6 w-20 bg-slate-50 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features (White Section to contrast the Header) */}
            <section id="features" className="py-32 bg-white text-slate-900 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase">Recursos Premium</span>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-4 text-blue-950">Por que escolher o FaciliteADV?</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Uma suíte completa de ferramentas para modernizar seu escritório.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-blue-950">Automação de Tarefas</h3>
                            <p className="text-slate-600 leading-relaxed">Robôs inteligentes que monitoram prazos e atualizam seus processos enquanto você dorme. Mais tempo, menos burocracia.</p>
                        </div>

                        {/* Card 2 */}
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-blue-950">Segurança Blindada</h3>
                            <p className="text-slate-600 leading-relaxed">Criptografia de ponta a ponta e backups diários automáticos. Seus dados protegidos com a mesma tecnologia dos bancos.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-cyan-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-600/20 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-blue-950">Analytics & Insights</h3>
                            <p className="text-slate-600 leading-relaxed">Tenha uma visão 360º do seu escritório. Dashboards financeiros e operacionais para tomar as melhores decisões.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section (New) */}
            <section id="pricing" className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase">Investimento</span>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-4 text-blue-950">
                            Planos Flexíveis
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Escolha o plano ideal para o tamanho do seu escritório.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {/* Plan 1: Starter */}
                        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">R$ 97</span>
                                <span className="text-slate-500">/mês</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">
                                Para advogados autônomos iniciando a digitalização.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Até 50 Processos
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Gestão de Clientes
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Agenda Básica
                                </li>
                            </ul>
                            <Link href="/login">
                                <Button className="w-full bg-slate-50 hover:bg-slate-100 text-blue-900 font-semibold border border-slate-200 shadow-sm">
                                    Começar Starter
                                </Button>
                            </Link>
                        </div>

                        {/* Plan 2: Pro (Featured) */}
                        <div className="p-8 rounded-2xl bg-white border-2 border-blue-600 shadow-2xl shadow-blue-900/10 transform scale-105 relative z-10">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                MAIS POPULAR
                            </div>
                            <h3 className="text-lg font-semibold text-blue-600 mb-2">Profissional</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-bold text-slate-900">R$ 197</span>
                                <span className="text-slate-500">/mês</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">
                                Para escritórios em crescimento que precisam de automação.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Até 200 Processos
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Automação de Prazos (IA)
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Kanban Ilimitado
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Suporte Prioritário
                                </li>
                            </ul>
                            <Link href="/login">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-lg shadow-blue-600/20">
                                    Assinar Profissional
                                </Button>
                            </Link>
                        </div>

                        {/* Plan 3: Elite */}
                        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Elite</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900">R$ 497</span>
                                <span className="text-slate-500">/mês</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">
                                Para grandes bancas que exigem poder total.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Processos Ilimitados
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    API & Integrações
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Gestor de Conta Dedicado
                                </li>
                            </ul>
                            <Link href="/login">
                                <Button className="w-full bg-slate-50 hover:bg-slate-100 text-blue-900 font-semibold border border-slate-200 shadow-sm">
                                    Falar com Consultor
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-32 relative overflow-hidden bg-blue-50">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-blue-950">
                        Pronto para transformar sua advocacia?
                    </h2>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                        Junte-se a milhares de advogados que já modernizaram seus escritórios com o FaciliteADV.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="h-16 px-12 text-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-105 transition-all rounded-xl">
                                Criar Conta Agora
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-slate-500">
                        Teste grátis por 14 dias • Sem compromisso
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 bg-white text-slate-600">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-blue-900" />
                        <span className="font-bold text-blue-900">FaciliteADV</span>
                    </div>
                    <div className="text-sm">
                        © 2026 FaciliteADV. Tecnologia Jurídica.
                    </div>
                    <div className="flex gap-6 text-sm font-medium">
                        <Link href="#" className="hover:text-blue-600 transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">Suporte</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
