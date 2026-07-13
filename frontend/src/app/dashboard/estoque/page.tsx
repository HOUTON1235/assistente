"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, Plus, Search } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovoProduto from "@/components/estoque/ModalNovoProduto";
import { api } from "@/lib/api";

interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  ativo: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = () => {
    api.get("/estoque/").then((r) => setProdutos(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const estoqueBaixo = produtos.filter((p) => p.quantidade <= p.quantidade_minima).length;

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[#2e2e2e] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Estoque</h1>
            {estoqueBaixo > 0 && (
              <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-full">
                <AlertTriangle size={12} /> {estoqueBaixo} com estoque baixo
              </span>
            )}
          </div>
          <button onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo produto
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
            <Search size={16} className="text-gray-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-[#252525] rounded animate-pulse" />)}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>{busca ? "Nenhum produto encontrado" : "Nenhum produto cadastrado ainda"}</p>
                <p className="text-sm mt-1">Use o chat para adicionar produtos ao estoque</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-[#2e2e2e]">
                    <th className="text-left px-6 py-3">Produto</th>
                    <th className="text-right px-6 py-3">Preço</th>
                    <th className="text-right px-6 py-3">Quantidade</th>
                    <th className="text-right px-6 py-3">Mínimo</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => {
                    const baixo = p.quantidade <= p.quantidade_minima;
                    return (
                      <tr key={p.id} className="border-b border-[#2e2e2e] hover:bg-[#252525] transition-colors">
                        <td className="px-6 py-3 text-sm font-medium">{p.nome}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-300">{formatCurrency(p.preco_venda)}</td>
                        <td className={`px-6 py-3 text-sm text-right font-medium ${baixo ? "text-orange-400" : "text-white"}`}>
                          {p.quantidade} {p.unidade}
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-gray-500">{p.quantidade_minima}</td>
                        <td className="px-6 py-3">
                          {baixo ? (
                            <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full w-fit">
                              <AlertTriangle size={11} /> Baixo
                            </span>
                          ) : (
                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
