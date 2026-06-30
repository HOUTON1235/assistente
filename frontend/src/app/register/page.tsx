"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    empresa_nome: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("access_token", res.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao criar conta.");
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
          <h1 className="text-xl font-semibold text-white">Criar conta grátis</h1>
          <p className="text-gray-500 text-sm mt-1">Comece em menos de 2 minutos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "empresa_nome", label: "Nome da empresa", placeholder: "Minha Empresa Ltda" },
            { name: "nome", label: "Seu nome", placeholder: "João Silva" },
            { name: "email", label: "E-mail", placeholder: "joao@empresa.com", type: "email" },
            { name: "senha", label: "Senha", placeholder: "••••••••", type: "password" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm text-gray-400 mb-1.5">{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                required
                className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {erro && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
