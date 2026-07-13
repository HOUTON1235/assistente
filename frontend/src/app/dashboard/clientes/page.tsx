"use client";

import { useEffect, useState } from "react";
import { Users, Search, Plus, Phone, Mail } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ModalNovoCliente from "@/components/clientes/ModalNovoCliente";
import { api } from "@/lib/api";

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

  const carregar = () => {
    api.get("/clientes/").then((r) => setClientes(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[#2e2e2e] px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Clientes</h1>
          <button onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Novo cliente
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Busca */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
            <Search size={16} className="text-gray-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar clientes..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Lista */}
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-[#252525] rounded animate-pulse" />)}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>{busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}</p>
                <p className="text-sm mt-1">Use o chat para cadastrar clientes rapidamente</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2e2e2e]">
                {filtrados.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#252525] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium text-sm">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.nome}</p>
                        {c.cpf_cnpj && <p className="text-xs text-gray-500">{c.cpf_cnpj}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
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

      <ModalNovoCliente
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriado={carregar}
      />
    </div>
  );
}
