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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buscarDoc = async () => {
    if (tipoDoc === "cnpj") {
      const cnpj = form.cnpj.replace(/\D/g, "");
      if (cnpj.length !== 14) return;
      setBuscandoDoc(true);
      try {
        const res = await api.post("/auth/consultar-cnpj", { cnpj: form.cnpj });
        if (res.data.valido) {
          setDocDados(res.data);
          if (res.data.razao_social && !form.empresa_nome) {
            setForm(prev => ({ ...prev, empresa_nome: res.data.razao_social }));
          }
        } else {
          setErro(res.data.erro || "CNPJ inválido");
        }
      } catch {} finally { setBuscandoDoc(false); }
    }
    // CPF é validado só no backend
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
    <main className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Criar conta grátis</h1>
          <p className="text-gray-500 text-sm mt-1">30 dias gratuitos, sem cartão</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-indigo-500" : "bg-[#2e2e2e]"}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <h2 className="text-sm font-medium text-gray-300 mb-2">Dados da empresa</h2>

              {/* Seletor CPF/CNPJ */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Documento</label>
                <div className="flex gap-2 mb-2">
                  {(["cnpj", "cpf"] as const).map(tipo => (
                    <button key={tipo} type="button" onClick={() => { setTipoDoc(tipo); setDocDados(null); setErro(""); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${tipoDoc === tipo ? "bg-indigo-500 border-indigo-500 text-white" : "bg-transparent border-[#2e2e2e] text-gray-400 hover:border-indigo-500/50"}`}>
                      {tipo.toUpperCase()}
                    </button>
                  ))}
                </div>

                {tipoDoc === "cnpj" ? (
                  <div>
                    <div className="flex gap-2">
                      <input name="cnpj" value={form.cnpj} onChange={handleChange} onBlur={buscarDoc}
                        placeholder="00.000.000/0001-00"
                        className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                      {buscandoDoc && <Loader size={16} className="text-indigo-400 animate-spin self-center" />}
                      {docDados?.valido && <CheckCircle size={16} className="text-green-400 self-center flex-shrink-0" />}
                    </div>
                    {docDados?.razao_social && (
                      <p className="text-xs text-green-400 mt-1">✓ {docDados.razao_social}</p>
                    )}
                  </div>
                ) : (
                  <input name="cpf" value={form.cpf} onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Nome da empresa *</label>
                <input name="empresa_nome" value={form.empresa_nome} onChange={handleChange} required
                  placeholder={tipoDoc === "cpf" ? "Nome do profissional / MEI" : "Minha Empresa Ltda"}
                  className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Telefone</label>
                <input name="telefone" value={form.telefone} onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              {/* CEP */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">CEP</label>
                <div className="flex gap-2">
                  <input name="cep" value={form.cep} onChange={handleChange} onBlur={buscarCEP}
                    placeholder="00000-000"
                    className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                  {buscandoCep && <Loader size={16} className="text-indigo-400 animate-spin self-center" />}
                </div>
                {endereco && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ {endereco.logradouro}, {endereco.bairro} — {endereco.cidade}/{endereco.estado}
                  </p>
                )}
              </div>

              {endereco && (
                <div className="flex gap-2">
                  <input name="numero" value={form.numero} onChange={handleChange} placeholder="Nº"
                    className="w-24 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                  <input name="complemento" value={form.complemento} onChange={handleChange} placeholder="Complemento"
                    className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              )}

              {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

              <button type="button" onClick={() => { setErro(""); setStep(2); }}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-medium text-gray-300 mb-2">Seus dados de acesso</h2>

              {[
                { name: "nome", label: "Seu nome *", placeholder: "João Silva", type: "text" },
                { name: "email", label: "E-mail *", placeholder: "joao@empresa.com", type: "email" },
                { name: "senha", label: "Senha * (mín. 6 caracteres)", placeholder: "••••••••", type: "password" },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm text-gray-400 mb-1.5">{field.label}</label>
                  <input type={field.type} name={field.name}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange} required placeholder={field.placeholder}
                    className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}

              <p className="text-xs text-gray-500">
                Ao criar a conta, você concorda com os{" "}
                <Link href="/termos" className="text-indigo-400 hover:underline">Termos de Uso</Link>.
                {" "}Seus 30 dias de trial começam agora.
              </p>

              {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  ← Voltar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  {loading ? "Criando..." : "Criar conta grátis"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
