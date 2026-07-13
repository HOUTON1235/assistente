"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";

const PLANOS = ["trial", "starter", "professional", "business", "enterprise"];

export default function EmpresaDetalhe() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [novoPlano, setNovoPlano] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    adminApi.get(`/admin/empresas/${id}`).then(r => {
      setData(r.data);
      setNovoPlano(r.data.empresa.plano);
    }).catch(() => {});
  }, [id]);

  const salvarPlano = async () => {
    setSalvando(true);
    try {
      await adminApi.patch(`/admin/empresas/${id}/plano`, { plano: novoPlano });
      setMsg("Plano atualizado com sucesso");
      setTimeout(() => setMsg(""), 3000);
    } finally { setSalvando(false); }
  };

  const estenderTrial = async () => {
    await adminApi.patch(`/admin/trials/${id}/estender?dias=7`);
    setMsg("Trial estendido por 7 dias");
    setTimeout(() => setMsg(""), 3000);
  };

  if (!data) return <AdminLayout><div className="p-6 text-gray-400">Carregando...</div></AdminLayout>;

  const { empresa, usuarios, assinaturas, uso } = data;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-white">{empresa.nome}</h1>
          <p className="text-gray-400 text-sm">{empresa.email} · {empresa.cnpj || "Sem CNPJ"}</p>
        </div>

        {msg && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2.5 rounded-lg">{msg}</div>}

        {/* Info geral */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 grid grid-cols-2 gap-4 text-sm">
          {[
            ["Status", empresa.status],
            ["Plano", empresa.plano],
            ["Cidade", `${empresa.cidade || "—"}/${empresa.estado || "—"}`],
            ["Telefone", empresa.telefone || "—"],
            ["Trial dias restantes", empresa.trial_dias_restantes],
            ["Cadastrado em", empresa.criado_em ? new Date(empresa.criado_em).toLocaleDateString("pt-BR") : "—"],
            ["Transações", uso.total_transacoes],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-gray-500 text-xs">{k}</p>
              <p className="text-white font-medium capitalize">{String(v)}</p>
            </div>
          ))}
        </div>

        {/* Alterar plano */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-3">
          <h2 className="font-medium text-white">Gerenciar plano</h2>
          <div className="flex gap-3">
            <select value={novoPlano} onChange={e => setNovoPlano(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white outline-none flex-1">
              {PLANOS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
            <button onClick={salvarPlano} disabled={salvando}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            {empresa.plano === "trial" && (
              <button onClick={estenderTrial}
                className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                +7 dias trial
              </button>
            )}
          </div>
        </div>

        {/* Usuários */}
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#222]">
            <h2 className="font-medium text-white">Usuários ({usuarios.length})</h2>
          </div>
          {usuarios.map((u: any) => (
            <div key={u.email} className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a] last:border-0">
              <div>
                <p className="text-sm text-white">{u.nome}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full capitalize">{u.perfil}</span>
            </div>
          ))}
        </div>

        {/* Assinaturas */}
        {assinaturas.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#222]">
              <h2 className="font-medium text-white">Histórico de assinaturas</h2>
            </div>
            {assinaturas.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a] last:border-0 text-sm">
                <span className="capitalize text-gray-300">{a.plano}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${a.status === "ativa" ? "text-green-400 bg-green-500/10" : "text-gray-400 bg-gray-500/10"}`}>{a.status}</span>
                <span className="text-gray-400">R$ {parseFloat(a.valor).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
