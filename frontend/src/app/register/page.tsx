"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Loader, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Endereco {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all";
const inputStyle = { background: "#0a0f1e", border: "1px solid #1f2937" };

function Input({ name, value, onChange, placeholder, type = "text", onBlur, required }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      name={name} value={value} onChange={onChange} placeholder={placeholder}
      type={type} required={required} onBlur={e => { setFocused(false); onBlur?.(e); }}
      onFocus={() => setFocused(true)}
      className={inputCls}
      style={{ ...inputStyle, borderColor: focused ? "#f97316" : "#1f2937" }}
    />
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tipoDoc, setTipoDoc] = useState<"cnpj" | "cpf">("cnpj");
  const [form, setForm] = useState({
    nome: "", email: "", senha: "",
    empresa_nome: "", cnpj: "", cpf: "", telefone: "",
    cep: "", numero: "", complemento: "",
  });
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [docDados, setDocDados] = useState<any>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoDoc, setBuscandoDoc] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const buscarDoc = async () => {
    if (tipoDoc !== "cnpj") return;
    const cnpj = form.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) return;
    setBuscandoDoc(true);
    try {
      const res = await api.post("/auth/consultar-cnpj", { cnpj: form.cnpj });
      if (res.data.valido) {
        setDocDados(res.data);
        if (res.data.razao_social && !form.empresa_nome)
          setForm(prev => ({ ...prev, empresa_nome: res.data.razao_social }));
      } else {
        setErro(res.data.erro || "CNPJ inválido");
      }
    } catch {} finally { setBuscandoDoc(false); }
  };

  const buscarCEP = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await api.post("/auth/consultar-cep", { cep: form.cep });
      if (res.data.encontrado) setEndereco(res.data);
      else setErro("CEP não encontrado");
    } catch {} finally { setBuscandoCep(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        cnpj: tipoDoc === "cnpj" ? form.cnpj : undefined,
        cpf: tipoDoc === "cpf" ? form.cpf : undefined,
      };
      const res = await api.post("/auth/register", payload);
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("plano", res.data.plano);
      localStorage.setItem("trial_dias", String(res.data.trial_dias_restantes));
      router.push("/dashboard");
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao criar conta.");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#0a0f1e" }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "#111827", border: "1px solid #1f2937" }}>
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              <Bot size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Criar conta grátis</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>30 dias gratuitos, sem cartão</p>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: s <= step ? "#f97316" : "#1f2937" }} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Passo 1: Empresa ── */}
            {step === 1 && (
              <>
                <p className="text-sm font-medium" style={{ color: "#9ca3af" }}>Dados da empresa</p>

                {/* Seletor CPF/CNPJ */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>Documento</label>
                  <div className="flex gap-2 mb-3">
                    {(["cnpj", "cpf"] as const).map(tipo => (
                      <button key={tipo} type="button"
                        onClick={() => { setTipoDoc(tipo); setDocDados(null); setErro(""); }}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: tipoDoc === tipo ? "#f97316" : "transparent",
                          border: `1px solid ${tipoDoc === tipo ? "#f97316" : "#1f2937"}`,
                          color: tipoDoc === tipo ? "#fff" : "#6b7280",
                        }}>
                        {tipo.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {tipoDoc === "cnpj" ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <Input name="cnpj" value={form.cnpj} onChange={handleChange}
                          onBlur={buscarDoc} placeholder="00.000.000/0001-00" />
                        {buscandoDoc && <Loader size={16} className="text-orange-400 animate-spin flex-shrink-0" />}
                        {docDados?.valido && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                      </div>
                      {docDados?.razao_social && (
                        <p className="text-xs mt-1" style={{ color: "#4ade80" }}>✓ {docDados.razao_social}</p>
                      )}
                    </div>
                  ) : (
                    <Input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>Nome da empresa *</label>
                  <Input name="empresa_nome" value={form.empresa_nome} onChange={handleChange} required
                    placeholder={tipoDoc === "cpf" ? "Nome do profissional / MEI" : "Minha Empresa Ltda"} />
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>Telefone</label>
                  <Input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>CEP</label>
                  <div className="flex items-center gap-2">
                    <Input name="cep" value={form.cep} onChange={handleChange}
                      onBlur={buscarCEP} placeholder="00000-000" />
                    {buscandoCep && <Loader size={16} className="text-orange-400 animate-spin flex-shrink-0" />}
                  </div>
                  {endereco && (
                    <p className="text-xs mt-1" style={{ color: "#4ade80" }}>
                      ✓ {endereco.logradouro}, {endereco.bairro} — {endereco.cidade}/{endereco.estado}
                    </p>
                  )}
                </div>

                {endereco && (
                  <div className="flex gap-2">
                    <div className="w-24">
                      <Input name="numero" value={form.numero} onChange={handleChange} placeholder="Nº" />
                    </div>
                    <div className="flex-1">
                      <Input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Complemento" />
                    </div>
                  </div>
                )}

                {erro && (
                  <p className="text-sm px-3 py-2 rounded-lg"
                    style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {erro}
                  </p>
                )}

                <button type="button" onClick={() => { setErro(""); setStep(2); }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 mt-2"
                  style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                  Continuar →
                </button>
              </>
            )}

            {/* ── Passo 2: Acesso ── */}
            {step === 2 && (
              <>
                <p className="text-sm font-medium" style={{ color: "#9ca3af" }}>Seus dados de acesso</p>

                {[
                  { name: "nome", label: "Seu nome *", placeholder: "João Silva", type: "text" },
                  { name: "email", label: "E-mail *", placeholder: "joao@empresa.com", type: "email" },
                  { name: "senha", label: "Senha * (mín. 6 caracteres)", placeholder: "••••••••", type: "password" },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>{field.label}</label>
                    <Input
                      name={field.name} type={field.type}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange} required placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Ao criar a conta, você concorda com os{" "}
                  <Link href="/termos" className="hover:opacity-80" style={{ color: "#f97316" }}>Termos de Uso</Link>.
                  {" "}Seus 30 dias de trial começam agora.
                </p>

                {erro && (
                  <p className="text-sm px-3 py-2 rounded-lg"
                    style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {erro}
                  </p>
                )}

                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-80"
                    style={{ background: "transparent", border: "1px solid #1f2937" }}>
                    ← Voltar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                    {loading ? "Criando..." : "Criar conta grátis"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "#6b7280" }}>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium hover:opacity-80" style={{ color: "#f97316" }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
