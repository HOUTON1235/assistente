"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { signIn } from "next-auth/react";
import { D } from "@/lib/design";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mensagem = searchParams.get("mensagem");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
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
      const s = err?.response?.status;
      if (s === 429) setErro("Muitas tentativas. Aguarde alguns minutos.");
      else setErro(err?.response?.data?.detail || "E-mail ou senha incorretos.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const r = await signIn("google", { redirect: false, callbackUrl: "/auth/google-callback" });
      if (r?.ok) router.push("/dashboard");
      else setErro("Erro ao entrar com Google");
    } catch { setErro("Erro ao entrar com Google"); }
    finally { setLoadingGoogle(false); }
  };

  const inp: any = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    background: D.surface2, border: `1px solid ${D.border}`,
    color: D.text, fontSize: 14, outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ width: "100%", maxWidth: 380 }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px", marginBottom: 8 }}>Orbita</div>
        <p style={{ color: D.muted, fontSize: 14, margin: 0 }}>Bem-vindo de volta</p>
      </div>

      {/* Card */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: "28px 28px" }}>

        {mensagem && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#4ade80" }}>
            {mensagem}
          </div>
        )}

        {/* Google */}
        <button onClick={handleGoogle} disabled={loadingGoogle}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "9px 16px", borderRadius: 8, background: D.surface2, border: `1px solid ${D.border}`, color: D.text2, fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 20, transition: "border-color 0.15s" }}
          onMouseEnter={(e: any) => e.currentTarget.style.borderColor = D.border2}
          onMouseLeave={(e: any) => e.currentTarget.style.borderColor = D.border}>
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.21l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-3.24z"/>
          </svg>
          {loadingGoogle ? "Entrando..." : "Continuar com Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: D.border }} />
          <span style={{ fontSize: 12, color: D.muted }}>ou</span>
          <div style={{ flex: 1, height: 1, background: D.border }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: D.text3, marginBottom: 6 }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com" style={inp}
              onFocus={(e: any) => e.target.style.borderColor = D.border2}
              onBlur={(e: any) => e.target.style.borderColor = D.border} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: D.text3 }}>Senha</label>
              <Link href="/esqueci-senha" style={{ fontSize: 12, color: D.muted, textDecoration: "none" }}>
                Esqueci minha senha
              </Link>
            </div>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
              placeholder="••••••••" style={inp}
              onFocus={(e: any) => e.target.style.borderColor = D.border2}
              onBlur={(e: any) => e.target.style.borderColor = D.border} />
          </div>

          {erro && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#f87171" }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "10px", borderRadius: 8, background: D.text, color: D.bg, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, border: "none", marginTop: 4 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: D.muted }}>
        Não tem conta?{" "}
        <Link href="/register" style={{ color: D.text2, fontWeight: 500, textDecoration: "none" }}>
          Criar grátis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: D.bg }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
