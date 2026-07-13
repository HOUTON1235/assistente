import Link from "next/link";
import Logo from "@/components/brand/Logo";

const funcionalidades = [
  { icone: "💬", titulo: "Chat com IA", desc: "Converse em linguagem natural. O sistema executa." },
  { icone: "💰", titulo: "Financeiro", desc: "Receitas, despesas, fluxo de caixa e cobranças automáticas." },
  { icone: "📦", titulo: "Estoque", desc: "Controle entradas, saídas e receba alertas de reposição." },
  { icone: "👥", titulo: "Clientes", desc: "CRM integrado com histórico e pendências." },
  { icone: "📊", titulo: "Relatórios", desc: "DRE, análises e previsões geradas pela IA." },
  { icone: "🔔", titulo: "Alertas", desc: "Vencimentos e avisos por email e no app." },
];

export default function Home() {
  return (
    <main className="min-h-screen text-white" style={{ background: "#0a0f1e" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid #1f2937" }}>
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Entrar
          </Link>
          <Link href="/register"
            className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#f97316" }}>
            Começar grátis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8 font-medium"
          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}>
          🚀 30 dias grátis, sem cartão
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6">
          Seu operador administrativo
          <br />
          <span style={{ color: "#f97316" }}>com Inteligência Artificial</span>
        </h1>

        <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
          Não é um chatbot. É o sistema que gerencia sua empresa.
          Fale com a Orbita e ela trabalha por você.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/register"
            className="flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl text-base transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            Criar conta grátis →
          </Link>
          <Link href="/login"
            className="text-sm text-gray-400 hover:text-white px-5 py-3.5 rounded-xl transition-colors"
            style={{ border: "1px solid #1f2937" }}>
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionalidades.map((f) => (
            <div key={f.titulo}
              className="p-5 rounded-xl transition-colors hover:border-blue-800"
              style={{ background: "#111827", border: "1px solid #1f2937" }}>
              <span className="text-2xl">{f.icone}</span>
              <h3 className="font-semibold text-white mt-3 mb-1">{f.titulo}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto text-center px-6 pb-24">
        <div className="p-10 rounded-2xl" style={{ background: "#111827", border: "1px solid #1f2937" }}>
          <h2 className="text-2xl font-bold mb-3">Pronto para escalar sua empresa?</h2>
          <p className="text-gray-400 mb-6">Comece hoje com 30 dias gratuitos. Sem cartão.</p>
          <Link href="/register"
            className="inline-block text-white font-semibold px-8 py-3 rounded-xl transition-all hover:opacity-90"
            style={{ background: "#f97316" }}>
            Começar agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-gray-600" style={{ borderTop: "1px solid #1f2937" }}>
        <div className="pt-6">
          <Logo size="sm" variant="icon" />
          <p className="mt-2">© 2026 Orbita. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
