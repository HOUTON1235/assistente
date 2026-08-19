"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, Plus, Search } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovoProduto from "@/components/estoque/ModalNovoProduto";
import { api } from "@/lib/api";
import { D } from "@/lib/design";

function fmt(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); }

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);

  const carregar = () => api.get("/estoque/").then(r => setProdutos(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { carregar(); }, []);

  const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));
  const baixo = produtos.filter(p => p.quantidade <= p.quantidade_minima).length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: D.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 14, fontWeight: 600, color: D.text, margin: 0 }}>Estoque</h1>
            {baixo > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "2px 8px", borderRadius: 100, background: `${D.warning}15`, color: D.warning }}>
                <AlertTriangle size={10} /> {baixo} com estoque baixo
              </span>
            )}
          </div>
          <button onClick={() => setModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: D.text, border: "none", color: D.bg, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} /> Novo produto
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, marginBottom: 16 }}>
            <Search size={13} style={{ color: D.muted }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produtos..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: D.text, fontSize: 13 }} />
          </div>

          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 20 }}>
                {[...Array(5)].map((_, i) => <div key={i} style={{ height: 44, borderRadius: 6, background: D.surface2, marginBottom: 6 }} />)}
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Package size={32} style={{ color: D.muted2, marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>{busca ? "Nenhum resultado" : "Nenhum produto ainda"}</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                    {["Produto","Preço","Quantidade","Mín.","Status"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 500, color: D.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const baixo = p.quantidade <= p.quantidade_minima;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${D.border}` }}
                        onMouseEnter={(e: any) => e.currentTarget.style.background = D.surface2}
                        onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: D.text, fontWeight: 500 }}>{p.nome}</td>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: D.muted }}>{fmt(p.preco_venda)}</td>
                        <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 500, color: baixo ? D.warning : D.text }}>
                          {p.quantidade} {p.unidade}
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: D.muted }}>{p.quantidade_minima}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: baixo ? `${D.warning}15` : `${D.success}15`, color: baixo ? D.warning : D.success }}>
                            {baixo ? "Baixo" : "OK"}
                          </span>
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
      <ModalNovoProduto aberto={modal} onFechar={() => setModal(false)} onCriado={carregar} />
    </div>
  );
}
