"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Plus } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovaTransacao from "@/components/financeiro/ModalNovaTransacao";
import { api } from "@/lib/api";
import { D } from "@/lib/design";

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); }

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [resumo, setResumo]         = useState({ total_receitas: 0, total_despesas: 0, saldo: 0, contas_vencidas: 0 });
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);

  const carregar = () => {
    setLoading(true);
    Promise.all([
      api.get("/financeiro/resumo").catch(() => ({ data: resumo })),
      api.get("/financeiro/").catch(() => ({ data: [] })),
    ]).then(([r, t]) => { setResumo(r.data); setTransacoes(t.data); }).finally(() => setLoading(false));
  };
  useEffect(() => { carregar(); }, []);

  const status: Record<string, string> = { pago: D.success, pendente: D.warning, vencido: D.error, cancelado: D.muted };

  const cards = [
    { label: "Receitas",  value: fmt(resumo.total_receitas), icon: <TrendingUp  size={14} strokeWidth={1.5} />, color: D.success },
    { label: "Despesas",  value: fmt(resumo.total_despesas), icon: <TrendingDown size={14} strokeWidth={1.5} />, color: D.error },
    { label: "Saldo",     value: fmt(resumo.saldo),          icon: <DollarSign  size={14} strokeWidth={1.5} />, color: D.text },
    { label: "Vencidas",  value: String(resumo.contas_vencidas), icon: <AlertCircle size={14} strokeWidth={1.5} />, color: resumo.contas_vencidas > 0 ? D.warning : D.muted },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: D.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: D.text, margin: 0 }}>Financeiro</h1>
          <button onClick={() => setModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: D.text, border: "none", color: D.bg, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} /> Nova transação
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {cards.map(c => (
              <div key={c.label} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: D.muted, margin: 0 }}>{c.label}</p>
                  <span style={{ color: c.color }}>{c.icon}</span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 700, color: c.color, margin: 0, letterSpacing: "-0.5px" }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: 0 }}>Transações recentes</p>
            </div>
            {loading ? (
              <div style={{ padding: 20 }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ height: 36, borderRadius: 6, background: D.surface2, marginBottom: 8, animation: "pulse 2s infinite" }} />)}
              </div>
            ) : transacoes.length === 0 ? (
              <p style={{ fontSize: 13, color: D.muted, textAlign: "center", padding: 40, margin: 0 }}>Nenhuma transação. Use o botão acima ou o chat.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                    {["Descrição","Categoria","Tipo","Valor","Status"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: h === "Valor" ? "right" : "left", fontSize: 11, fontWeight: 500, color: D.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map(t => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${D.border}` }}
                      onMouseEnter={(e: any) => e.currentTarget.style.background = D.surface2}
                      onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 20px", fontSize: 13, color: D.text }}>{t.descricao}</td>
                      <td style={{ padding: "12px 20px", fontSize: 12, color: D.muted, textTransform: "capitalize" }}>{t.categoria}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: t.tipo === "receita" ? `${D.success}15` : `${D.error}15`, color: t.tipo === "receita" ? D.success : D.error, fontWeight: 500 }}>
                          {t.tipo}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 500, color: t.tipo === "receita" ? D.success : D.error, textAlign: "right" }}>
                        {t.tipo === "receita" ? "+" : "-"}{fmt(t.valor)}
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 12, color: status[t.status] || D.muted, textTransform: "capitalize" }}>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <ModalNovaTransacao aberto={modal} onFechar={() => setModal(false)} onCriado={carregar} />
    </div>
  );
}
