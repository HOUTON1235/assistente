"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";

export default function NovaSenhaPage() {
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

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Criar nova senha</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nova senha", value: senha, setter: setSenha },
            { label: "Confirmar senha", value: confirmar, setter: setConfirmar },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm text-gray-400 mb-1.5">{field.label}</label>
              <input type="password" value={field.value} onChange={e => field.setter(e.target.value)} required
                className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••" />
            </div>
          ))}
          {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </main>
  );
}
