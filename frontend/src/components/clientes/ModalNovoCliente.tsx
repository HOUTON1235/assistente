"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onCriado: () => void;
}

export default function ModalNovoCliente({ aberto, onFechar, onCriado }: Props) {
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf_cnpj: "", observacoes: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro("Nome é obrigatório"); return; }
    setErro("");
    setLoading(true);
    try {
      await api.post("/clientes/", form);
      setForm({ nome: "", telefone: "", email: "", cpf_cnpj: "", observacoes: "" });
      toast.sucesso("Cliente criado com sucesso!");
      onCriado();
      onFechar();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao criar cliente";
      setErro(msg);
      toast.erro(msg);
    } finally { setLoading(false); }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo cliente">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nome *</label>
          <input name="nome" value={form.nome} onChange={handleChange} required
            placeholder="João Silva"
            className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handleChange}
              placeholder="(11) 99999-9999"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CPF / CNPJ</label>
            <input name="cpf_cnpj" value={form.cpf_cnpj} onChange={handleChange}
              placeholder="000.000.000-00"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="joao@email.com"
            className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={2}
            placeholder="Informações adicionais..."
            className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
        </div>

        {erro && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onFechar}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-2 rounded-lg text-sm transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Salvando..." : "Criar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
