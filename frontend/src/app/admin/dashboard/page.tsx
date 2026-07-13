"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, Clock, DollarSign, AlertTriangle, Activity } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";

interface DashData {
  empresas: { total: number; trials_ativos: number; pagas: number; expirando_7dias: number; trials_expirados: number; novos_este_mes: number; taxa_conversao: number };
  financeiro: { mrr: number; arr: number };
  usuarios: { total: number };
  ia: { mensagens_hoje: number };
}

function Card({ label, value, sub, icon, color }: any) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    adminApi.get("/admin/dashboard").then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return (
    <AdminLayout>
      <div className="p-6 text-gray-400">Carregando...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visão geral do negócio</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="MRR" value={fmt(data.financeiro.mrr)} sub={`ARR: ${fmt(data.financeiro.arr)}`}
            icon={<DollarSign size={18} className="text-green-400" />} color="bg-green-500/10" />
          <Card label="Empresas pagas" value={data.empresas.pagas} sub={`Taxa conversão: ${data.empresas.taxa_conversao}%`}
            icon={<TrendingUp size={18} className="text-indigo-400" />} color="bg-indigo-500/10" />
          <Card label="Trials ativos" value={data.empresas.trials_ativos} sub={`${data.empresas.expirando_7dias} expirando em 7 dias`}
            icon={<Clock size={18} className="text-yellow-400" />} color="bg-yellow-500/10" />
          <Card label="Total empresas" value={data.empresas.total} sub={`+${data.empresas.novos_este_mes} este mês`}
            icon={<Users size={18} className="text-blue-400" />} color="bg-blue-500/10" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card label="Total usuários" value={data.usuarios.total}
            icon={<Users size={18} className="text-purple-400" />} color="bg-purple-500/10" />
          <Card label="Mensagens IA hoje" value={data.ia.mensagens_hoje}
            icon={<Activity size={18} className="text-cyan-400" />} color="bg-cyan-500/10" />
          <Card label="Trials expirados" value={data.empresas.trials_expirados} sub="Sem conversão"
            icon={<AlertTriangle size={18} className="text-red-400" />} color="bg-red-500/10" />
        </div>
      </div>
    </AdminLayout>
  );
}
