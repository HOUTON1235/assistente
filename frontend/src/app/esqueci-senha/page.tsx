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
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0f1e" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="rounded-2xl p-8" style={{ background: "#111827", border: "1px solid #1f2937" }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              <Bot size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Esqueci minha senha</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Enviaremos um link para redefinir</p>
          </div>

          {!enviado ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>E-mail</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  style={{ background: "#0a0f1e", border: "1px solid #1f2937" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                  onBlur={e => e.currentTarget.style.borderColor = "#1f2937"}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          ) : (
            <div className="rounded-xl p-5 text-center"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="font-medium" style={{ color: "#4ade80" }}>Email enviado!</p>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Verifique sua caixa de entrada e spam.</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm mt-5">
          <Link href="/login"
            className="flex items-center justify-center gap-1.5 transition-colors hover:opacity-80"
            style={{ color: "#f97316" }}>
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
