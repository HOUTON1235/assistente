"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, Package, AlertTriangle, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

const SURF = "#111827";
const BORD = "#1f2937";

interface DashboardData {
  clientes: number;
  produtos: number;
  financeiro: { receitas: number; despesas: number; saldo: number };
  alertas: { contas_vencidas: number; estoque_baixo: number };
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
  accent?: boolean;
}

function Card({ title, value, icon, iconColor, iconBg, subtitle, accent }: CardProps) {
  return (
    <div className="rounded-xl p-5 transition-all"
      style={{ background: SURF, border: `1px solid ${accent ? "rgba(249,115,22,0.3)" : BORD}` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm" style={{ color: "#6b7280" }}>{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{subtitle}</p>}
    </div>
  );
}

export default function DashboardCards() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/")
      .then(res => setData(res.data))
      .catch(() => setData({
        clientes: 0, produtos: 0,
        financeiro: { receitas: 0, despesas: 0, saldo: 0 },
        alertas: { contas_vencidas: 0, estoque_baixo: 0 },
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 h-28 animate-pulse"
            style={{ background: SURF, border: `1px solid ${BORD}` }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const totalAlertas = data.alertas.contas_vencidas + data.alertas.estoque_baixo;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        title="Saldo do Mês"
        value={fmt(data.financeiro.saldo)}
        icon={<DollarSign size={17} />}
        iconColor={data.financeiro.saldo >= 0 ? "#4ade80" : "#f87171"}
        iconBg={data.financeiro.saldo >= 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}
        subtitle={`Receitas: ${fmt(data.financeiro.receitas)}`}
      />
      <Card
        title="Receitas"
        value={fmt(data.financeiro.receitas)}
        icon={<TrendingUp size={17} />}
        iconColor="#4ade80"
        iconBg="rgba(74,222,128,0.1)"
        subtitle="Pagas este mês"
      />
      <Card
        title="Despesas"
        value={fmt(data.financeiro.despesas)}
        icon={<TrendingDown size={17} />}
        iconColor="#f87171"
        iconBg="rgba(248,113,113,0.1)"
        subtitle="Pagas este mês"
      />
      <Card
        title="Clientes"
        value={data.clientes}
        icon={<Users size={17} />}
        iconColor="#f97316"
        iconBg="rgba(249,115,22,0.1)"
        subtitle="Ativos"
      />
      <Card
        title="Produtos"
        value={data.produtos}
        icon={<Package size={17} />}
        iconColor="#facc15"
        iconBg="rgba(250,204,21,0.1)"
        subtitle="Em estoque"
      />
      <Card
        title="Alertas"
        value={totalAlertas}
        icon={<AlertTriangle size={17} />}
        iconColor="#f87171"
        iconBg="rgba(248,113,113,0.1)"
        subtitle={`${data.alertas.contas_vencidas} vencidas · ${data.alertas.estoque_baixo} estoque baixo`}
        accent={totalAlertas > 0}
      />
    </div>
  );
}
