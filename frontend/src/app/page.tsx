import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f0f] text-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-400 text-sm">
          🤖 Sistema Operacional Inteligente
        </div>

        <h1 className="text-5xl font-bold tracking-tight">
          Seu operador
          <span className="text-indigo-400"> administrativo</span>
          <br />
          com Inteligência Artificial
        </h1>

        <p className="text-gray-400 text-lg leading-relaxed">
          Não é um chatbot. É um sistema que gerencia sua empresa.
          Finanças, estoque, clientes e muito mais — por comando de voz ou texto.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </main>
  );
}
