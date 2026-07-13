"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/esqueci-senha", { email });
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Esqueci minha senha</h1>
          <p className="text-gray-500 text-sm mt-1">Enviaremos um link para redefinir</p>
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="seu@email.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
            <p className="text-green-400 font-medium">Email enviado!</p>
            <p className="text-gray-400 text-sm mt-1">Verifique sua caixa de entrada e spam.</p>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
