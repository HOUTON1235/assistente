"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Loader, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

const SEGMENTOS = [
  { value: "hamburgueria",   label: "🍔 Hamburgueria / Lanchonete" },
  { value: "pizzaria",       label: "🍕 Pizzaria" },
  { value: "padaria",        label: "🥐 Padaria / Confeitaria" },
  { value: "mercado",        label: "🛒 Mercado / Mercearia" },
  { value: "loja_roupas",    label: "👗 Loja de Roupas / Moda" },
  { value: "salao_beleza",   label: "💇 Salão de Beleza / Barbearia" },
  { value: "farmacia",       label: "💊 Farmácia / Drogaria" },
  { value: "oficina",        label: "🔧 Oficina Mecânica" },
  { value: "clinica",        label: "🏥 Clínica / Consultório" },
  { value: "pet_shop",       label: "🐾 Pet Shop / Veterinária" },
  { value: "imobiliaria",    label: "🏠 Imobiliária / Corretor" },
  { value: "escola",         label: "📚 Escola / Curso" },
  { value: "ecommerce",      label: "📦 Loja Online / E-commerce" },
  { value: "servicos_gerais",label: "🛠️ Prestação de Serviços" },
  { value: "outro",          label: "🏢 Outro tipo de negócio" },
];

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all";

function Input({ name, value, onChange, placeholder, type = "text", onBlur, required }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      name={name} value={value} onChange={onChange} placeholder={placeholder}
      type={type} required={required}
      onFocus={() => setFocused(true)}
      onBlur={e => { setFocused(false); onBlur?.(e); }}
      className={inputCls}
      style={{ background: "#0a0f1e", border: `1px solid ${focused ? "#f97316" : "#1f2937"}` }}
    />
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tipoDoc, setTipoDoc] = useState<"cnpj" | "cpf">("cnpj");
  const [form, setForm] = useState({
    nome: "", email: "", senha: "",
    empresa_nome: "", segmento: "", descricao_negocio: "",
    horario_funcionamento: "", formas_pagamento: "",
    aceita_delivery: false, aceita_retirada: true,
    taxa_entrega: "", tempo_entrega: "",
    cnpj: "", cpf: "", telefone: "", cep: "", numero: "", complemento: "",
  });
  const [endereco, setEndereco] = useState<any>(null);
  const [docDados, setDocDados] = useState<any>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoDoc, setBuscandoDoc] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

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
        cpf:  tipoDoc === "cpf"  ? form.cpf  : undefined,
        taxa_entrega: form.taxa_entrega ? parseFloat(form.taxa_entrega) : undefined,
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

  const B = "#1f2937";
  const segSelecionado = SEGMENTOS.find(s => s.value === form.segmento);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#0a0f1e" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="rounded-2xl p-8" style={{ background: "#111827", border: "1px solid #1f2937" }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              <Bot size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Criar conta grátis</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>30 dias gratuitos, sem cartão</p>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-1.5 mb-6">
            {[1,2,3].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: s <= step ? "#f97316" : "#1f2937" }} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── PASSO 1: EMPRESA ── */}
            {step === 1 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6b7280" }}>Dados da empresa</p>

                <div className="flex gap-2">
                  {(["cnpj","cpf"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTipoDoc(t)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: tipoDoc === t ? "#f97316" : "transparent",
                        border: `1px solid ${tipoDoc === t ? "#f97316" : "#1f2937"}`,
                        color: tipoDoc === t ? "#fff" : "#6b7280",
                      }}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>{tipoDoc === "cnpj" ? "CNPJ" : "CPF"}</label>
                  <div className="flex items-center gap-2">
                    <Input name={tipoDoc} value={form[tipoDoc]} onChange={handle}
                      onBlur={tipoDoc === "cnpj" ? buscarDoc : undefined}
                      placeholder={tipoDoc === "cnpj" ? "00.000.000/0001-00" : "000.000.000-00"} />
                    {buscandoDoc && <Loader size={16} className="text-orange-400 animate-spin flex-shrink-0" />}
                    {docDados?.valido && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                  </div>
                  {docDados?.razao_social && <p className="text-xs mt-1" style={{ color: "#4ade80" }}>✓ {docDados.razao_social}</p>}
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Nome da empresa *</label>
                  <Input name="empresa_nome" value={form.empresa_nome} onChange={handle} required
                    placeholder="Minha Empresa" />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Telefone</label>
                  <Input name="telefone" value={form.telefone} onChange={handle} placeholder="(11) 99999-9999" />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>CEP</label>
                  <div className="flex items-center gap-2">
                    <Input name="cep" value={form.cep} onChange={handle} onBlur={buscarCEP} placeholder="00000-000" />
                    {buscandoCep && <Loader size={16} className="text-orange-400 animate-spin flex-shrink-0" />}
                  </div>
                  {endereco && <p className="text-xs mt-1" style={{ color: "#4ade80" }}>✓ {endereco.logradouro}, {endereco.bairro} — {endereco.cidade}/{endereco.estado}</p>}
                </div>

                {erro && <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>{erro}</p>}

                <button type="button" onClick={() => { setErro(""); setStep(2); }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                  Continuar →
                </button>
              </>
            )}

            {/* ── PASSO 2: SEGMENTO DO NEGÓCIO ── */}
            {step === 2 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6b7280" }}>Tipo do seu negócio</p>
                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  Isso ajuda a Orbita a se especializar no atendimento da sua empresa
                </p>

                {/* Seletor de segmento */}
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {SEGMENTOS.map(seg => (
                    <button key={seg.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, segmento: seg.value }))}
                      className="text-left px-3 py-2.5 rounded-lg text-xs transition-all"
                      style={{
                        background: form.segmento === seg.value ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${form.segmento === seg.value ? "#f97316" : "#1f2937"}`,
                        color: form.segmento === seg.value ? "#f97316" : "#9ca3af",
                      }}>
                      {seg.label}
                    </button>
                  ))}
                </div>

                {form.segmento && (
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
                    ✓ Orbita configurada para: <strong>{segSelecionado?.label}</strong>
                  </div>
                )}

                {/* Descrição do negócio */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Descrição do negócio (opcional)</label>
                  <textarea name="descricao_negocio" value={form.descricao_negocio} onChange={handle} rows={2}
                    placeholder="Ex: Hamburgueria artesanal com ingredientes frescos, delivery e retirada..."
                    className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none"
                    style={{ background: "#0a0f1e", border: "1px solid #1f2937" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                    onBlur={e => e.currentTarget.style.borderColor = "#1f2937"} />
                </div>

                {/* Horário e formas de pagamento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Horário de funcionamento</label>
                    <Input name="horario_funcionamento" value={form.horario_funcionamento} onChange={handle}
                      placeholder="Seg-Sex 9h-18h" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Formas de pagamento</label>
                    <Input name="formas_pagamento" value={form.formas_pagamento} onChange={handle}
                      placeholder="Pix, cartão, dinheiro" />
                  </div>
                </div>

                {/* Delivery */}
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="aceita_delivery" checked={form.aceita_delivery} onChange={handle}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: "#9ca3af" }}>🛵 Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="aceita_retirada" checked={form.aceita_retirada} onChange={handle}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: "#9ca3af" }}>🏪 Retirada</span>
                  </label>
                </div>

                {form.aceita_delivery && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Taxa de entrega (R$)</label>
                      <Input name="taxa_entrega" value={form.taxa_entrega} onChange={handle} type="number" placeholder="5.00" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Tempo de entrega</label>
                      <Input name="tempo_entrega" value={form.tempo_entrega} onChange={handle} placeholder="30-45 min" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-80"
                    style={{ background: "transparent", border: "1px solid #1f2937" }}>
                    ← Voltar
                  </button>
                  <button type="button" onClick={() => { setErro(""); setStep(3); }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                    Continuar →
                  </button>
                </div>
              </>
            )}

            {/* ── PASSO 3: ACESSO ── */}
            {step === 3 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6b7280" }}>Seus dados de acesso</p>

                {[
                  { name: "nome",  label: "Seu nome *",  placeholder: "João Silva",         type: "text" },
                  { name: "email", label: "E-mail *",    placeholder: "joao@empresa.com",   type: "email" },
                  { name: "senha", label: "Senha * (mín. 6 caracteres)", placeholder: "••••••••", type: "password" },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>{f.label}</label>
                    <Input name={f.name} type={f.type}
                      value={form[f.name as keyof typeof form] as string}
                      onChange={handle} required placeholder={f.placeholder} />
                  </div>
                ))}

                {/* Resumo */}
                {form.segmento && (
                  <div className="rounded-lg px-3 py-2.5 text-xs space-y-1"
                    style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                    <p className="font-medium" style={{ color: "#f97316" }}>Orbita configurada para sua empresa:</p>
                    <p style={{ color: "#9ca3af" }}>🏢 {form.empresa_nome} — {segSelecionado?.label}</p>
                    {form.horario_funcionamento && <p style={{ color: "#9ca3af" }}>⏰ {form.horario_funcionamento}</p>}
                    {form.formas_pagamento && <p style={{ color: "#9ca3af" }}>💳 {form.formas_pagamento}</p>}
                  </div>
                )}

                {erro && <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>{erro}</p>}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-80"
                    style={{ background: "transparent", border: "1px solid #1f2937" }}>
                    ← Voltar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                    {loading ? "Criando..." : "Criar conta grátis 🚀"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "#6b7280" }}>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium hover:opacity-80" style={{ color: "#f97316" }}>Entrar</Link>
        </p>
      </div>
    </main>
  );
}
