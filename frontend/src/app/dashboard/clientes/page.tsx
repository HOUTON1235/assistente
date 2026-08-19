"use client";

import { useEffect, useState } from "react";
import { Users, Search, Plus, Mail, Phone } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovoCliente from "@/components/clientes/ModalNovoCliente";
import { api } from "@/lib/api";
import { D } from "@/lib/design";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);

  const carregar = () => api.get("/clientes/").then(r => setClientes(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { carregar(); }, []);

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: D.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: D.text, margin: 0 }}>
            Clientes <span style={{ color: D.muted, fontWeight: 400, marginLeft: 6 }}>{clientes.length}</span>
          </h1>
          <button onClick={() => setModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, background: D.text, border: "none", color: D.bg, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} /> Novo cliente
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, marginBottom: 16 }}>
            <Search size={13} style={{ color: D.muted }} />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: D.text, fontSize: 13 }} />
          </div>

          {/* Lista */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 20 }}>
                {[...Array(5)].map((_, i) => <div key={i} style={{ height: 52, borderRadius: 6, background: D.surface2, marginBottom: 6, animation: "pulse 2s infinite" }} />)}
              </div>
            ) : filtrados.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Users size={32} style={{ color: D.muted2, marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: D.muted, margin: 0 }}>{busca ? "Nenhum resultado" : "Nenhum cliente ainda"}</p>
              </div>
            ) : (
              filtrados.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < filtrados.length - 1 ? `1px solid ${D.border}` : "none" }}
                  onMouseEnter={(e: any) => e.currentTarget.style.background = D.surface2}
                  onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: D.surface2, border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: D.muted, fontSize: 13, fontWeight: 600 }}>
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: D.text, margin: 0 }}>{c.nome}</p>
                      {c.cpf_cnpj && <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>{c.cpf_cnpj}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: D.muted }}>
                    {c.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={11} />{c.email}</span>}
                    {c.telefone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} />{c.telefone}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ModalNovoCliente aberto={modal} onFechar={() => setModal(false)} onCriado={carregar} />
    </div>
  );
}
