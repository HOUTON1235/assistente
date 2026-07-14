"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, TrendingUp, Clock, AlertTriangle,
  DollarSign, MessageSquare, Search, ChevronRight, Shield,
} from "lucide-react";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"empresas" | "trials">("empresas");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setErro("");
    try {
      const res = await api.post("/admin/login", { email, senha });
      localStorage.setItem("admin_token", res.data.access_token);
      setLogado(true);
      carregar(res.data.access_token);
    } catch {
      setErro("Credenciais inválidas");
    } finally { setLoginLoading(false); }
  };

  const carregar = async (token?: string) => {
    const t = token || localStorage.getItem("admin_token");
    if (!t) return;
    try {
      const headers = { Authorization: `Bearer ${t}` };
      const [dash, emp, tri] = await Promise.all([
        api.get("/admin/dashboard", { headers }),
        api.get("/admin/empresas", { headers }),
        api.get("/admin/trials", { headers }),
      ]);
      setData(dash.data);
      setEmpresas(emp.data.empresas);
      setTrials(tri.data.trials);
      setLogado(true);
    } catch {
      localStorage.removeItem("admin_token");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) carregar(t);
    else setLoading(false);
  }, []);

  const empresasFiltradas = empresas.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.email.toLowerCase().includes(busca.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    trial: "#facc15", ativa: "#4ade80", suspensa: "#f87171", cancelada: "#6b7280",
  };

  if (!logado) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
            style={{ background: "#1e40af", filter: "blur(120px)" }} />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
            style={{ background: "#f97316", filter: "blur(120px)" }} />
        </div>
        <div className="w-full max-w-sm relative">
          <div className="rounded-2xl p-8" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <div className="text-center mb-7">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                <Shield size={22} className="text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">Painel Admin</h1>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Acesso restrito</p>
            </div>
            <form onSubmit={login} className="space-y-4">
              {[
                { label: "E-mail", value: email, setter: setEmail, type: "email", placeholder: "admin@orbita.com" },
                { label: "Senha", value: senha, setter: setSenha, type: "password", placeholder: "••••••••" },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm mb-1.5" style={{ color: "#9ca3af" }}>{f.label}</label>
                  <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)}
                    required placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
                    style={{ background: BG, border: `1px solid ${BORD}` }}
                    onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                    onBlur={e => e.currentTarget.style.borderColor = BORD} />
                </div>
              ))}
              {erro && (
                <p className="text-sm px-3 py-2 rounded-lg"
                  style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {erro}
                </p>
              )}
              <button type="submit" disabled={loginLoading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ background: "#f97316", animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const cards = data ? [
    { label: "Total empresas",    value: data.empresas.total,          icon: <Building2   size={17} />, color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
    { label: "Trials ativos",     value: data.empresas.trials_ativos,  icon: <Clock       size={17} />, color: "#facc15", bg: "rgba(250,204,21,0.1)"  },
    { label: "Assinantes pagos",  value: data.empresas.pagas,          icon: <TrendingUp  size={17} />, color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
    { label: "MRR",               value: fmt(data.financeiro.mrr),     icon: <DollarSign  size={17} />, color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
    { label: "Novos este mês",    value: data.empresas.novos_este_mes, icon: <Users       size={17} />, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    { label: "Expirando (7d)",    value: data.empresas.expirando_7dias,icon: <AlertTriangle size={17}/>,color: "#f87171", bg: "rgba(248,113,113,0.1)" },
    { label: "Msgs IA hoje",      value: data.ia.mensagens_hoje,       icon: <MessageSquare size={17}/>,color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
    { label: "Conversão trial→pago",value: `${data.empresas.taxa_conversao}%`,icon: <ChevronRight size={17}/>,color: "#f97316",bg: "rgba(249,115,22,0.1)"},
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#f1f5f9" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${BORD}`, background: SURF }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm">Orbita Admin</h1>
            <p className="text-xs" style={{ color: "#6b7280" }}>Painel de controle</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem("admin_token"); setLogado(false); }}
          className="text-sm px-3 py-1.5 rounded-lg transition-all"
          style={{ color: "#6b7280", border: `1px solid ${BORD}` }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
          Sair
        </button>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="rounded-xl p-4" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: "#6b7280" }}>{c.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          {(["empresas", "trials"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={aba === a
                ? { background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }
                : { background: "transparent", color: "#6b7280", border: `1px solid ${BORD}` }}>
              {a}
            </button>
          ))}
        </div>

        {/* Busca */}
        {aba === "empresas" && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <Search size={14} style={{ color: "#6b7280" }} />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar empresa ou email..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600" />
          </div>
        )}

        {/* Tabela empresas */}
        {aba === "empresas" && (
          <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <table className="w-full">
              <thead>
                <tr className="text-xs" style={{ color: "#6b7280", borderBottom: `1px solid ${BORD}` }}>
                  <th className="text-left px-5 py-3">Empresa</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Plano</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map(e => (
                  <tr key={e.id} className="transition-colors"
                    style={{ borderBottom: `1px solid ${BORD}` }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = BORD)}
                    onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3 text-sm font-medium text-white">{e.nome}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#9ca3af" }}>{e.email}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded-full text-xs capitalize"
                        style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
                        {e.plano}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm capitalize"
                      style={{ color: statusColor[e.status] || "#9ca3af" }}>
                      {e.status}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#6b7280" }}>
                      {e.criado_em ? new Date(e.criado_em).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {empresasFiltradas.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: "#6b7280" }}>
                Nenhuma empresa encontrada
              </div>
            )}
          </div>
        )}

        {/* Tabela trials */}
        {aba === "trials" && (
          <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <table className="w-full">
              <thead>
                <tr className="text-xs" style={{ color: "#6b7280", borderBottom: `1px solid ${BORD}` }}>
                  <th className="text-left px-5 py-3">Empresa</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Dias restantes</th>
                  <th className="text-left px-5 py-3">Expira em</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {trials.map(t => (
                  <tr key={t.id} className="transition-colors"
                    style={{ borderBottom: `1px solid ${BORD}` }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = BORD)}
                    onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3 text-sm font-medium text-white">{t.nome}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#9ca3af" }}>{t.email}</td>
                    <td className="px-5 py-3 text-sm font-medium"
                      style={{ color: (t.dias_restantes ?? 0) <= 3 ? "#f87171" : (t.dias_restantes ?? 0) <= 7 ? "#facc15" : "#4ade80" }}>
                      {t.expirado ? "Expirado" : `${t.dias_restantes} dias`}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#6b7280" }}>
                      {t.expira_em ? new Date(t.expira_em).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded-full text-xs"
                        style={t.expirado
                          ? { background: "rgba(248,113,113,0.1)", color: "#f87171" }
                          : { background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                        {t.expirado ? "Expirado" : "Ativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trials.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: "#6b7280" }}>Nenhum trial encontrado</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
