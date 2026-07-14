"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";

function NovaSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (senha !== confirmar) { setErro("As senhas não coincidem"); return; }
    if (senha.length < 6) { setErro("Senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true);
    try {
      await api.post("/auth/nova-senha", { token, nova_senha: senha });
      router.push("/login?mensagem=Senha redefinida com sucesso");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "#0a0f1e",
    border: "1px solid #1f2937",
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
            <h1 className="text-xl font-semibold text-white">Criar nova senha</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Escolha uma senha forte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Nova senha", value: senha, setter: setSenha },
              { label: "Confirmar senha", value: confirmar, setter: setConfirmar },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>{field.label}</label>
                <input
                  type="password" value={field.value}
                  onChange={e => field.setter(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                  onBlur={e => e.currentTarget.style.borderColor = "#1f2937"}
                />
              </div>
            ))}

            {erro && (
              <p className="text-sm px-3 py-2 rounded-lg"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {erro}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function NovaSenhaPage() {
  return (
    <Suspense fallback={null}>
      <NovaSenhaForm />
    </Suspense>
  );
}
