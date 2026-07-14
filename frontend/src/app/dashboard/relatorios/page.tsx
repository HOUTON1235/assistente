"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const selectStyle: React.CSSProperties = {
  background: SURF,
  border: `1px solid ${BORD}`,
  color: "#f1f5f9",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  outline: "none",
};

export default function RelatoriosPage() {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/relatorios/dre?mes=${mes}&ano=${ano}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mes, ano]);

  const grafico = data?.historico_6_meses?.map((h: any) => ({
    name: `${MESES[h.mes - 1]}/${String(h.ano).slice(2)}`,
    Receitas: h.receitas,
    Despesas: h.despesas,
    Lucro: h.receitas - h.despesas,
  })) || [];

  const categorias = data?.por_categoria || {};

  const cards = [
    { label: "Receitas pagas",  value: data?.resumo?.receitas_pagas,  icon: <TrendingUp  size={17} />, color: "#4ade80", bg: "rgba(74,222,128,0.1)",  sub: `+ ${fmt(data?.resumo?.receitas_pendentes || 0)} pendentes` },
    { label: "Despesas pagas",  value: data?.resumo?.despesas_pagas,  icon: <TrendingDown size={17} />, color: "#f87171", bg: "rgba(248,113,113,0.1)", sub: `+ ${fmt(data?.resumo?.despesas_pendentes || 0)} pendentes` },
    { label: "Lucro líquido",   value: data?.resumo?.lucro_liquido,   icon: <DollarSign  size={17} />, color: "#f97316", bg: "rgba(249,115,22,0.1)",  sub: `Margem: ${data?.resumo?.margem_lucro || 0}%` },
    { label: "Lançamentos",     value: data?.resumo?.total_lancamentos, icon: <Activity  size={17} />, color: "#facc15", bg: "rgba(250,204,21,0.1)", isCount: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORD}` }}>
          <div>
            <h1 className="text-lg font-semibold text-white">Relatórios</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>DRE e análise financeira</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={mes} onChange={e => setMes(Number(e.target.value))} style={selectStyle}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={ano} onChange={e => setAno(Number(e.target.value))} style={selectStyle}>
              {[ano - 1, ano, ano + 1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: SURF }} />
              ))}
            </div>
          ) : (
            <>
              {/* Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(c => (
                  <div key={c.label} className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm" style={{ color: "#6b7280" }}>{c.label}</p>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: c.bg, color: c.color }}>
                        {c.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold"
                      style={{ color: !c.isCount && (c.value || 0) < 0 ? "#f87171" : "#f1f5f9" }}>
                      {c.isCount ? (c.value || 0) : fmt(c.value || 0)}
                    </p>
                    {c.sub && <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{c.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Gráfico */}
              <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <h2 className="font-medium text-white mb-5">Evolução — últimos 6 meses</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={grafico} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORD} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 8 }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(v: any) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                    <Bar dataKey="Receitas" fill="#4ade80" radius={[4,4,0,0]} />
                    <Bar dataKey="Despesas" fill="#f87171" radius={[4,4,0,0]} />
                    <Bar dataKey="Lucro"    fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Por categoria */}
              {Object.keys(categorias).length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                  <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORD}` }}>
                    <h2 className="font-medium text-white">Por categoria</h2>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs" style={{ color: "#6b7280", borderBottom: `1px solid ${BORD}` }}>
                        <th className="text-left px-5 py-3">Categoria</th>
                        <th className="text-right px-5 py-3">Receitas</th>
                        <th className="text-right px-5 py-3">Despesas</th>
                        <th className="text-right px-5 py-3">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(categorias).map(([cat, vals]: any) => (
                        <tr key={cat} className="transition-colors"
                          style={{ borderBottom: `1px solid ${BORD}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = BORD)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td className="px-5 py-3 text-sm capitalize" style={{ color: "#9ca3af" }}>{cat}</td>
                          <td className="px-5 py-3 text-sm text-right" style={{ color: "#4ade80" }}>{fmt(vals.receitas)}</td>
                          <td className="px-5 py-3 text-sm text-right" style={{ color: "#f87171" }}>{fmt(vals.despesas)}</td>
                          <td className="px-5 py-3 text-sm text-right font-medium"
                            style={{ color: vals.receitas - vals.despesas >= 0 ? "#f1f5f9" : "#f87171" }}>
                            {fmt(vals.receitas - vals.despesas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty */}
              {!data?.resumo?.total_lancamentos && (
                <div className="text-center py-12" style={{ color: "#6b7280" }}>
                  <Activity size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum lançamento em {MESES[mes - 1]}/{ano}</p>
                  <p className="text-sm mt-1">Registre receitas e despesas para ver o relatório</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
