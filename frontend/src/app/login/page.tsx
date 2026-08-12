"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mensagem = searchParams.get("mensagem");
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [erro, setErro]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, senha });
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("plano", res.data.plano);
      localStorage.setItem("trial_dias", String(res.data.trial_dias_restantes));
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429) setErro("Muitas tentativas. Aguarde alguns minutos.");
      else setErro(detail || "E-mail ou senha incorretos.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const result = await signIn("google", { redirect: false });
      if (result?.ok) router.push("/dashboard");
      else setErro("Erro ao entrar com Google");
    } catch { setErro("Erro ao entrar com Google"); }
    finally { setLoadingGoogle(false); }
  };

  return (
    <div className="w-full max-w-sm relative">
      <div className="rounded-2xl p-8" style={{ background: "#111827", border: "1px solid #1f2937" }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Entrar na conta</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Bem-vindo de volta</p>
        </div>

        {mensagem && (
          <div className="text-sm px-3 py-2.5 rounded-lg mb-4 text-center"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
            {mensagem}
          </div>
        )}

        {/* Botão Google */}
        <button onClick={handleGoogle} disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 mb-4"
          style={{ background: "#fff", color: "#374151", border: "1px solid #e5e7eb" }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.21l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-3.24z"/>
          </svg>
          {loadingGoogle ? "Entrando..." : "Entrar com Google"}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "#1f2937" }} />
          <span className="text-xs" style={{ color: "#6b7280" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "#1f2937" }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: "#0a0f1e", border: "1px solid #1f2937" }}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = "#1f2937"} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm" style={{ color: "#9ca3af" }}>Senha</label>
              <Link href="/esqueci-senha" className="text-xs hover:opacity-80" style={{ color: "#f97316" }}>
                Esqueci minha senha
              </Link>
            </div>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
              placeholder="••••••••"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: "#0a0f1e", border: "1px solid #1f2937" }}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = "#1f2937"} />
          </div>

          {erro && (
            <p className="text-sm px-3 py-2 rounded-lg"
              style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {erro}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: "#6b7280" }}>
        Não tem conta?{" "}
        <Link href="/register" className="font-medium hover:opacity-80" style={{ color: "#f97316" }}>
          Criar grátis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0f1e" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mensagem = searchParams.get("mensagem");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, senha });
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("plano", res.data.plano);
      localStorage.setItem("trial_dias", String(res.data.trial_dias_restantes));
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 429) {
        setErro("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setErro(detail || "E-mail ou senha incorretos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative">
      <div className="rounded-2xl p-8" style={{ background: "#111827", border: "1px solid #1f2937" }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Entrar na conta</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Bem-vindo de volta</p>
        </div>

        {mensagem && (
          <div className="text-sm px-3 py-2.5 rounded-lg mb-4 text-center"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
            {mensagem}
          </div>
        )}

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm" style={{ color: "#9ca3af" }}>Senha</label>
              <Link href="/esqueci-senha" className="text-xs transition-colors hover:opacity-80"
                style={{ color: "#f97316" }}>
                Esqueci minha senha
              </Link>
            </div>
            <input
              type="password" value={senha} onChange={e => setSenha(e.target.value)} required
              placeholder="••••••••"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: "#0a0f1e", border: "1px solid #1f2937" }}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = "#1f2937"}
            />
          </div>

          {erro && (
            <p className="text-sm px-3 py-2 rounded-lg"
              style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {erro}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-5" style={{ color: "#6b7280" }}>
        Não tem conta?{" "}
        <Link href="/register" className="font-medium transition-colors hover:opacity-80" style={{ color: "#f97316" }}>
          Criar grátis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0f1e" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
