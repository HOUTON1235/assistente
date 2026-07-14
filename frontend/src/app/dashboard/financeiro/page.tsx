"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Plus } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovaTransacao from "@/components/financeiro/ModalNovaTransacao";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

interface Transacao {
  id: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  status: string;
  data_vencimento: string | null;
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState({ total_receitas: 0, total_despesas: 0, saldo: 0, contas_vencidas: 0 });
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = () => {
    setLoading(true);
    Promise.all([
      api.get("/financeiro/resumo").catch(() => ({ data: resumo })),
      api.get("/financeiro/").catch(() => ({ data: [] })),
    ]).then(([r, t]) => {
      setResumo(r.data);
      setTransacoes(t.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const statusColor: Record<string, string> = {
    pago: "#4ade80",
    pendente: "#facc15",
    vencido: "#f87171",
    cancelado: "#6b7280",
  };

  const cards = [
    { label: "Receitas",  value: resumo.total_receitas, icon: <TrendingUp  size={17} />, color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
    { label: "Despesas",  value: resumo.total_despesas, icon: <TrendingDown size={17} />, color: "#f87171", bg: "rgba(248,113,113,0.1)" },
    { label: "Saldo",     value: resumo.saldo,          icon: <DollarSign  size={17} />, color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
    { label: "Vencidas",  value: resumo.contas_vencidas,icon: <AlertCircle size={17} />, color: "#facc15", bg: "rgba(250,204,21,0.1)", isCount: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORD}` }}>
          <div>
            <h1 className="text-lg font-semibold text-white">Financeiro</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Receitas, despesas e fluxo de caixa</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Plus size={15} /> Nova transação
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                <p className="text-2xl font-bold" style={{ color: c.isCount && (c.value as number) > 0 ? c.color : "#f1f5f9" }}>
                  {c.isCount ? c.value : fmt(c.value as number)}
                </p>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORD}` }}>
              <h2 className="font-medium text-white">Transações recentes</h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "#1f2937" }} />
                ))}
              </div>
            ) : transacoes.length === 0 ? (
              <div className="p-12 text-center" style={{ color: "#6b7280" }}>
                <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma transação ainda</p>
                <p className="text-sm mt-1">Use o botão acima ou o chat para registrar</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs" style={{ color: "#6b7280", borderBottom: `1px solid ${BORD}` }}>
                    <th className="text-left px-6 py-3">Descrição</th>
                    <th className="text-left px-6 py-3">Categoria</th>
                    <th className="text-left px-6 py-3">Tipo</th>
                    <th className="text-right px-6 py-3">Valor</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map(t => (
                    <tr key={t.id} className="transition-colors" style={{ borderBottom: `1px solid ${BORD}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#1f2937")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-6 py-3 text-sm text-white">{t.descricao}</td>
                      <td className="px-6 py-3 text-sm capitalize" style={{ color: "#9ca3af" }}>{t.categoria}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: t.tipo === "receita" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                            color:      t.tipo === "receita" ? "#4ade80" : "#f87171",
                          }}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium"
                        style={{ color: t.tipo === "receita" ? "#4ade80" : "#f87171" }}>
                        {t.tipo === "receita" ? "+" : "-"}{fmt(t.valor)}
                      </td>
                      <td className="px-6 py-3 text-sm capitalize"
                        style={{ color: statusColor[t.status] || "#9ca3af" }}>
                        {t.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ModalNovaTransacao
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriado={carregar}
      />
    </div>
  );
}
