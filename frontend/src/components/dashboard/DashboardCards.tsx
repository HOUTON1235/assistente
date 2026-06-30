"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { api } from "@/lib/api";

interface DashboardData {
  clientes: number;
  produtos: number;
  financeiro: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
  alertas: {
    contas_vencidas: number;
    estoque_baixo: number;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function Card({ title, value, icon, color, subtitle }: CardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3e3e3e] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardCards() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/")
      .then((res) => setData(res.data))
      .catch(() => {
        // Dados mock para desenvolvimento
        setData({
          clientes: 47,
          produtos: 124,
          financeiro: { receitas: 28500, despesas: 12300, saldo: 16200 },
          alertas: { contas_vencidas: 3, estoque_baixo: 7 },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          title="Saldo do Mês"
          value={formatCurrency(data.financeiro.saldo)}
          icon={<DollarSign size={18} className="text-green-400" />}
          color="bg-green-500/10"
          subtitle={`Receitas: ${formatCurrency(data.financeiro.receitas)}`}
        />
        <Card
          title="Receitas"
          value={formatCurrency(data.financeiro.receitas)}
          icon={<TrendingUp size={18} className="text-indigo-400" />}
          color="bg-indigo-500/10"
          subtitle="Este mês"
        />
        <Card
          title="Despesas"
          value={formatCurrency(data.financeiro.despesas)}
          icon={<TrendingDown size={18} className="text-red-400" />}
          color="bg-red-500/10"
          subtitle="Este mês"
        />
        <Card
          title="Clientes"
          value={data.clientes}
          icon={<Users size={18} className="text-blue-400" />}
          color="bg-blue-500/10"
          subtitle="Ativos"
        />
        <Card
          title="Produtos"
          value={data.produtos}
          icon={<Package size={18} className="text-yellow-400" />}
          color="bg-yellow-500/10"
          subtitle="Em estoque"
        />
        <Card
          title="Alertas"
          value={data.alertas.contas_vencidas + data.alertas.estoque_baixo}
          icon={<AlertTriangle size={18} className="text-orange-400" />}
          color="bg-orange-500/10"
          subtitle={`${data.alertas.contas_vencidas} vencidas · ${data.alertas.estoque_baixo} estoque baixo`}
        />
      </div>
    </div>
  );
}
