"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

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

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="border-b border-[#2e2e2e] px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Relatórios</h1>
          {/* Seletor de período */}
          <div className="flex items-center gap-2">
            <select value={mes} onChange={e => setMes(Number(e.target.value))}
              className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={ano} onChange={e => setAno(Number(e.target.value))}
              className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
              {[ano - 1, ano, ano + 1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </header>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Cards DRE */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Receitas pagas", value: data?.resumo?.receitas_pagas, icon: <TrendingUp size={18} className="text-green-400" />, color: "bg-green-500/10", sub: `+ ${fmt(data?.resumo?.receitas_pendentes || 0)} pendentes` },
                { label: "Despesas pagas", value: data?.resumo?.despesas_pagas, icon: <TrendingDown size={18} className="text-red-400" />, color: "bg-red-500/10", sub: `+ ${fmt(data?.resumo?.despesas_pendentes || 0)} pendentes` },
                { label: "Lucro líquido", value: data?.resumo?.lucro_liquido, icon: <DollarSign size={18} className="text-indigo-400" />, color: "bg-indigo-500/10", sub: `Margem: ${data?.resumo?.margem_lucro || 0}%` },
                { label: "Lançamentos", value: data?.resumo?.total_lancamentos, icon: <Activity size={18} className="text-yellow-400" />, color: "bg-yellow-500/10", isCount: true },
              ].map(card => (
                <div key={card.label} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>{card.icon}</div>
                  </div>
                  <p className={`text-2xl font-bold ${card.value < 0 ? "text-red-400" : "text-white"}`}>
                    {card.isCount ? card.value : fmt(card.value || 0)}
                  </p>
                  {card.sub && <p className="text-xs text-gray-500 mt-1">{card.sub}</p>}
                </div>
              ))}
            </div>

            {/* Gráfico 6 meses */}
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
              <h2 className="font-medium mb-5">Evolução — últimos 6 meses</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={grafico} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v: any) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                  <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lucro" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Por categoria */}
            {Object.keys(categorias).length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2e2e2e]">
                  <h2 className="font-medium">Por categoria</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-[#2e2e2e]">
                      <th className="text-left px-5 py-3">Categoria</th>
                      <th className="text-right px-5 py-3">Receitas</th>
                      <th className="text-right px-5 py-3">Despesas</th>
                      <th className="text-right px-5 py-3">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categorias).map(([cat, vals]: any) => (
                      <tr key={cat} className="border-b border-[#252525] hover:bg-[#252525] transition-colors">
                        <td className="px-5 py-3 text-sm capitalize text-gray-300">{cat}</td>
                        <td className="px-5 py-3 text-sm text-right text-green-400">{fmt(vals.receitas)}</td>
                        <td className="px-5 py-3 text-sm text-right text-red-400">{fmt(vals.despesas)}</td>
                        <td className={`px-5 py-3 text-sm text-right font-medium ${vals.receitas - vals.despesas >= 0 ? "text-white" : "text-red-400"}`}>
                          {fmt(vals.receitas - vals.despesas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Estado vazio */}
            {!data?.resumo?.total_lancamentos && (
              <div className="text-center py-12 text-gray-500">
                <Activity size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum lançamento em {MESES[mes - 1]}/{ano}</p>
                <p className="text-sm mt-1">Registre receitas e despesas para ver o relatório</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
