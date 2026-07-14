"use client";

import { useEffect, useState } from "react";
import { Users, Search, Plus, Phone, Mail } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovoCliente from "@/components/clientes/ModalNovoCliente";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  ativo: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = () =>
    api.get("/clientes/").then(r => setClientes(r.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { carregar(); }, []);

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORD}` }}>
          <div>
            <h1 className="text-lg font-semibold text-white">Clientes</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              {clientes.length} {clientes.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Plus size={15} /> Novo cliente
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Busca */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <Search size={15} style={{ color: "#6b7280" }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
            />
          </div>

          {/* Lista */}
          <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: BORD }} />
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center" style={{ color: "#6b7280" }}>
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">{busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}</p>
                <p className="text-sm mt-1">Use o chat para cadastrar clientes rapidamente</p>
              </div>
            ) : (
              <div>
                {filtrados.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors cursor-pointer"
                    style={{ borderBottom: i < filtrados.length - 1 ? `1px solid ${BORD}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = BORD)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar com gradiente */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}
                      >
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{c.nome}</p>
                        {c.cpf_cnpj && <p className="text-xs" style={{ color: "#6b7280" }}>{c.cpf_cnpj}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-sm" style={{ color: "#6b7280" }}>
                      {c.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} /> {c.email}
                        </span>
                      )}
                      {c.telefone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} /> {c.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalNovoCliente aberto={modalAberto} onFechar={() => setModalAberto(false)} onCriado={carregar} />
    </div>
  );
}
