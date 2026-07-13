"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Lock, Unlock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import Link from "next/link";

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = async (p = pagina) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pagina: String(p), por_pagina: "20" });
      if (busca) params.set("busca", busca);
      if (filtroPlano) params.set("plano", filtroPlano);
      const res = await adminApi.get(`/admin/empresas?${params}`);
      setEmpresas(res.data.empresas);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, [pagina, filtroPlano]);

  const bloquear = async (id: string, ativo: boolean) => {
    await adminApi.patch(`/admin/empresas/${id}/${ativo ? "bloquear" : "desbloquear"}`);
    carregar();
  };

  const statusColor: Record<string, string> = {
    ativa: "text-green-400 bg-green-500/10",
    trial: "text-yellow-400 bg-yellow-500/10",
    suspensa: "text-red-400 bg-red-500/10",
    cancelada: "text-gray-400 bg-gray-500/10",
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Empresas <span className="text-gray-500 text-base font-normal">({total})</span></h1>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-2">
            <Search size={15} className="text-gray-500" />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === "Enter" && carregar(1)}
              placeholder="Buscar empresa ou email..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
          </div>
          <select value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)}
            className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none">
            <option value="">Todos os planos</option>
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-[#222]">
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Trial</th>
                <th className="text-left px-4 py-3">Cadastro</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Carregando...</td></tr>
              ) : empresas.map(e => (
                <tr key={e.id} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{e.nome}</p>
                    <p className="text-xs text-gray-500">{e.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full capitalize">{e.plano}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor[e.status] || "text-gray-400"}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {e.plano === "trial" ? `${e.trial_dias_restantes}d` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {e.criado_em ? new Date(e.criado_em).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/empresas/${e.id}`}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => bloquear(e.id, e.ativo)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors">
                        {e.ativo ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{total} resultados</span>
            <div className="flex gap-2">
              <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}
                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 py-1">Página {pagina}</span>
              <button disabled={pagina * 20 >= total} onClick={() => setPagina(p => p + 1)}
                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
