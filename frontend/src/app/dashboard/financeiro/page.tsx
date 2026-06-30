"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Plus } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

interface Transacao {
  id: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  status: string;
  data_vencimento: string | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState({ total_receitas: 0, total_despesas: 0, saldo: 0, contas_vencidas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/financeiro/resumo").catch(() => ({ data: resumo })),
      api.get("/financeiro/").catch(() => ({ data: [] })),
    ]).then(([r, t]) => {
      setResumo(r.data);
      setTransacoes(t.data);
    }).finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    pago: "text-green-400",
    pendente: "text-yellow-400",
    vencido: "text-red-400",
    cancelado: "text-gray-500",
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[#2e2e2e] px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Financeiro</h1>
          <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nova transação
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cards resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Receitas", value: resumo.total_receitas, icon: <TrendingUp size={18} className="text-green-400" />, color: "bg-green-500/10" },
              { label: "Despesas", value: resumo.total_despesas, icon: <TrendingDown size={18} className="text-red-400" />, color: "bg-red-500/10" },
              { label: "Saldo", value: resumo.saldo, icon: <DollarSign size={18} className="text-indigo-400" />, color: "bg-indigo-500/10" },
              { label: "Vencidas", value: resumo.contas_vencidas, icon: <AlertCircle size={18} className="text-orange-400" />, color: "bg-orange-500/10", isCount: true },
            ].map((card) => (
              <div key={card.label} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-400">{card.label}</p>
                  <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>{card.icon}</div>
                </div>
                <p className="text-2xl font-bold">{card.isCount ? card.value : formatCurrency(card.value)}</p>
              </div>
            ))}
          </div>

          {/* Tabela de transações */}
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2e2e2e]">
              <h2 className="font-medium">Transações recentes</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-[#252525] rounded animate-pulse" />)}
              </div>
            ) : transacoes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhuma transação ainda</p>
                <p className="text-sm mt-1">Use o chat para registrar receitas e despesas</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-[#2e2e2e]">
                    <th className="text-left px-6 py-3">Descrição</th>
                    <th className="text-left px-6 py-3">Categoria</th>
                    <th className="text-left px-6 py-3">Tipo</th>
                    <th className="text-right px-6 py-3">Valor</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map((t) => (
                    <tr key={t.id} className="border-b border-[#2e2e2e] hover:bg-[#252525] transition-colors">
                      <td className="px-6 py-3 text-sm">{t.descricao}</td>
                      <td className="px-6 py-3 text-sm text-gray-400 capitalize">{t.categoria}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${t.tipo === "receita" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-sm text-right font-medium ${t.tipo === "receita" ? "text-green-400" : "text-red-400"}`}>
                        {t.tipo === "receita" ? "+" : "-"}{formatCurrency(t.valor)}
                      </td>
                      <td className={`px-6 py-3 text-sm capitalize ${statusColor[t.status] || "text-gray-400"}`}>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
