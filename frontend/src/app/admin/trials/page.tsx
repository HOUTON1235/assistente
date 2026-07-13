"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";

export default function AdminTrialsPage() {
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/admin/trials").then(r => setTrials(r.data.trials)).finally(() => setLoading(false));
  }, []);

  const estender = async (id: string) => {
    await adminApi.patch(`/admin/trials/${id}/estender?dias=7`);
    adminApi.get("/admin/trials").then(r => setTrials(r.data.trials));
  };

  const ativos = trials.filter(t => !t.expirado);
  const expirados = trials.filter(t => t.expirado);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Trials</h1>
          <p className="text-gray-400 text-sm">{ativos.length} ativos · {expirados.length} expirados</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Ativos", value: ativos.length, color: "text-green-400 bg-green-500/10" },
            { label: "Expirando em 7 dias", value: ativos.filter(t => t.dias_restantes <= 7).length, color: "text-yellow-400 bg-yellow-500/10" },
            { label: "Expirados sem conversão", value: expirados.length, color: "text-red-400 bg-red-500/10" },
          ].map(c => (
            <div key={c.label} className="bg-[#111] border border-[#222] rounded-xl p-4">
              <p className="text-sm text-gray-400">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color.split(" ")[0]}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#222] flex items-center gap-2">
            <Clock size={15} className="text-yellow-400" />
            <h2 className="font-medium text-white">Trials ativos</h2>
          </div>
          {loading ? <div className="p-6 text-gray-500 text-center">Carregando...</div> : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-[#222]">
                  <th className="text-left px-5 py-3">Empresa</th>
                  <th className="text-left px-5 py-3">Dias restantes</th>
                  <th className="text-left px-5 py-3">Expira em</th>
                  <th className="text-right px-5 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {ativos.map(t => (
                  <tr key={t.id} className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm text-white">{t.nome}</p>
                      <p className="text-xs text-gray-500">{t.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${t.dias_restantes <= 3 ? "text-red-400" : t.dias_restantes <= 7 ? "text-yellow-400" : "text-green-400"}`}>
                        {t.dias_restantes} dias
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {t.expira_em ? new Date(t.expira_em).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => estender(t.id)}
                        className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg transition-colors">
                        +7 dias
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
