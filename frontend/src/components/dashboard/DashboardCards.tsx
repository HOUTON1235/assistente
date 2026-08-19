"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { D } from "@/lib/design";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function Card({ label, value, sub, icon, trend }: CardProps) {
  return (
    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: D.muted, margin: 0, fontWeight: 500 }}>{label}</p>
        <div style={{ color: D.muted2 }}>{icon}</div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: trend === "up" ? D.success : trend === "down" ? D.error : D.muted, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function DashboardCards() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/dashboard/").then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, height: 100, animation: "pulse 2s infinite" }} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Receitas",
      value: fmt(data.financeiro?.total_receitas || 0),
      sub: `${data.financeiro?.transacoes_mes || 0} transações`,
      icon: <TrendingUp size={15} strokeWidth={1.5} />,
      trend: "up" as const,
    },
    {
      label: "Despesas",
      value: fmt(data.financeiro?.total_despesas || 0),
      sub: `Saldo: ${fmt(data.financeiro?.saldo || 0)}`,
      icon: <TrendingDown size={15} strokeWidth={1.5} />,
      trend: "neutral" as const,
    },
    {
      label: "Contas vencidas",
      value: String(data.financeiro?.contas_vencidas || 0),
      sub: data.financeiro?.contas_vencidas > 0 ? "Atenção necessária" : "Em dia",
      icon: <AlertCircle size={15} strokeWidth={1.5} />,
      trend: data.financeiro?.contas_vencidas > 0 ? "down" as const : "up" as const,
    },
    {
      label: "Clientes",
      value: String(data.clientes?.total || 0),
      sub: `${data.clientes?.novos_mes || 0} novos este mês`,
      icon: <Users size={15} strokeWidth={1.5} />,
      trend: "up" as const,
    },
    {
      label: "Produtos",
      value: String(data.estoque?.total_produtos || 0),
      sub: `${data.estoque?.estoque_baixo || 0} com estoque baixo`,
      icon: <Package size={15} strokeWidth={1.5} />,
      trend: data.estoque?.estoque_baixo > 0 ? "down" as const : "neutral" as const,
    },
    {
      label: "Valor em estoque",
      value: fmt(data.estoque?.valor_total || 0),
      sub: "Valor de custo total",
      icon: <DollarSign size={15} strokeWidth={1.5} />,
      trend: "neutral" as const,
    },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {cards.map(c => <Card key={c.label} {...c} />)}
      </div>
    </div>
  );
}
