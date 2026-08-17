"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Bot, ArrowLeft, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

function EsqueciSenhaForm() {
  const router = useRouter();
  const [step, setStep]         = useState<"email" | "codigo" | "senha">("email");
  const [email, setEmail]       = useState("");
  const [codigo, setCodigo]     = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState("");

  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setLoading(true);
    try {
      const res = await api.post("/auth/esqueci-senha", { email });
      // Se email falhou, o backend retorna o código diretamente
      if (res.data.codigo) {
        setCodigo(res.data.codigo);
        setStep("codigo");
        setErro("⚠️ Email indisponível. Use o código abaixo (visível só agora):");
        return;
      }
      setStep("codigo");
    } catch { setErro("Erro ao enviar. Tente novamente."); }
    finally { setLoading(false); }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setLoading(true);
    try {
      await api.post("/auth/verificar-codigo", { email, codigo });
      setStep("senha");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Código inválido");
    } finally { setLoading(false); }
  };

  const redefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem"); return; }
    if (novaSenha.length < 6) { setErro("Mínimo 6 caracteres"); return; }
    setErro(""); setLoading(true);
    try {
      await api.post("/auth/nova-senha-codigo", { email, codigo, nova_senha: novaSenha });
      router.push("/login?mensagem=Senha redefinida com sucesso");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao redefinir senha");
    } finally { setLoading(false); }
  };

  const inp = { background: "#0a0f1e", border: "1px solid #1f2937" };
  const inpCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all";

  return (
    <div className="w-full max-w-sm relative">
      <div className="rounded-2xl p-8" style={{ background: "#111827", border: "1px solid #1f2937" }}>
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">
            {step === "email" ? "Esqueci minha senha" : step === "codigo" ? "Digite o código" : "Nova senha"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            {step === "email" ? "Enviaremos um código para seu email" :
             step === "codigo" ? `Código enviado para ${email}` : "Escolha uma senha forte"}
          </p>
        </div>

        {/* Passo 1: Email */}
        {step === "email" && (
          <form onSubmit={enviarCodigo} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com" className={inpCls} style={inp}
                onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                onBlur={e => e.currentTarget.style.borderColor = "#1f2937"} />
            </div>
            {erro && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{erro}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </form>
        )}

        {/* Passo 2: Código */}
        {step === "codigo" && (
          <form onSubmit={verificarCodigo} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Código de 6 dígitos</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g,"").slice(0,6))}
                required maxLength={6} placeholder="000000"
                className={`${inpCls} text-center text-2xl tracking-widest`} style={inp}
                onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                onBlur={e => e.currentTarget.style.borderColor = "#1f2937"} />
              <p className="text-xs mt-1.5" style={{ color: "#6b7280" }}>
                Não recebeu? <button type="button" onClick={() => { setStep("email"); setCodigo(""); }}
                  className="underline" style={{ color: "#f97316" }}>Reenviar</button>
              </p>
            </div>
            {erro && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{erro}</p>}
            <button type="submit" disabled={loading || codigo.length !== 6}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              {loading ? "Verificando..." : "Verificar código"}
            </button>
          </form>
        )}

        {/* Passo 3: Nova senha */}
        {step === "senha" && (
          <form onSubmit={redefinirSenha} className="space-y-4">
            {[
              { label: "Nova senha", value: novaSenha, setter: setNovaSenha },
              { label: "Confirmar", value: confirmar, setter: setConfirmar },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>{f.label}</label>
                <input type="password" value={f.value} onChange={e => f.setter(e.target.value)} required
                  placeholder="••••••••" className={inpCls} style={inp}
                  onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                  onBlur={e => e.currentTarget.style.borderColor = "#1f2937"} />
              </div>
            ))}
            {erro && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{erro}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm mt-5">
        <Link href="/login" className="flex items-center justify-center gap-1.5 hover:opacity-80"
          style={{ color: "#f97316" }}>
          <ArrowLeft size={14} /> Voltar ao login
        </Link>
      </p>
    </div>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0f1e" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>
      <Suspense fallback={null}>
        <EsqueciSenhaForm />
      </Suspense>
    </main>
  );
}
