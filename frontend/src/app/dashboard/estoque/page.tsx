"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, Plus, Search } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovoProduto from "@/components/estoque/ModalNovoProduto";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

interface Produto {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  ativo: boolean;
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = () =>
    api.get("/estoque/").then(r => setProdutos(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { carregar(); }, []);

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));
  const estoqueBaixo = produtos.filter(p => p.quantidade <= p.quantidade_minima).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORD}` }}>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-white">Estoque</h1>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Produtos e movimentações</p>
            </div>
            {estoqueBaixo > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(250,204,21,0.1)", color: "#facc15", border: "1px solid rgba(250,204,21,0.2)" }}>
                <AlertTriangle size={11} /> {estoqueBaixo} com estoque baixo
              </span>
            )}
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Plus size={15} /> Novo produto
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Busca */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all"
            style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <Search size={15} style={{ color: "#6b7280" }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar produtos..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
            />
          </div>

          {/* Tabela */}
          <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: BORD }} />
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center" style={{ color: "#6b7280" }}>
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">{busca ? "Nenhum produto encontrado" : "Nenhum produto cadastrado ainda"}</p>
                <p className="text-sm mt-1">Use o chat para adicionar produtos ao estoque</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs" style={{ color: "#6b7280", borderBottom: `1px solid ${BORD}` }}>
                    <th className="text-left px-6 py-3">Produto</th>
                    <th className="text-right px-6 py-3">Preço</th>
                    <th className="text-right px-6 py-3">Quantidade</th>
                    <th className="text-right px-6 py-3">Mínimo</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const baixo = p.quantidade <= p.quantidade_minima;
                    return (
                      <tr key={p.id} className="transition-colors" style={{ borderBottom: `1px solid ${BORD}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = BORD)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-6 py-3 text-sm font-medium text-white">{p.nome}</td>
                        <td className="px-6 py-3 text-sm text-right" style={{ color: "#9ca3af" }}>{fmt(p.preco_venda)}</td>
                        <td className="px-6 py-3 text-sm text-right font-medium"
                          style={{ color: baixo ? "#facc15" : "#f1f5f9" }}>
                          {p.quantidade} {p.unidade}
                        </td>
                        <td className="px-6 py-3 text-sm text-right" style={{ color: "#6b7280" }}>{p.quantidade_minima}</td>
                        <td className="px-6 py-3">
                          {baixo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                              style={{ background: "rgba(250,204,21,0.1)", color: "#facc15" }}>
                              <AlertTriangle size={10} /> Baixo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs"
                              style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                              OK
                            </span>
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

      <ModalNovoProduto aberto={modalAberto} onFechar={() => setModalAberto(false)} onCriado={carregar} />
    </div>
  );
}
