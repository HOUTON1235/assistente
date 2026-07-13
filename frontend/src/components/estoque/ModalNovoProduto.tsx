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

export default function ModalNovoProduto({ aberto, onFechar, onCriado }: Props) {
  const [form, setForm] = useState({
    nome: "",
    preco_venda: "",
    preco_custo: "",
    quantidade: "0",
    quantidade_minima: "5",
    unidade: "un",
    descricao: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro("Nome é obrigatório"); return; }
    if (!form.preco_venda || parseFloat(form.preco_venda) <= 0) { setErro("Preço de venda deve ser maior que zero"); return; }
    setErro("");
    setLoading(true);
    try {
      await api.post("/estoque/", {
        nome: form.nome,
        preco_venda: parseFloat(form.preco_venda),
        preco_custo: form.preco_custo ? parseFloat(form.preco_custo) : undefined,
        quantidade: parseInt(form.quantidade),
        quantidade_minima: parseInt(form.quantidade_minima),
        unidade: form.unidade,
        descricao: form.descricao || undefined,
      });
      setForm({ nome: "", preco_venda: "", preco_custo: "", quantidade: "0", quantidade_minima: "5", unidade: "un", descricao: "" });
      toast.sucesso("Produto criado com sucesso!");
      onCriado();
      onFechar();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao criar produto";
      setErro(msg);
      toast.erro(msg);
    } finally { setLoading(false); }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo produto">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nome *</label>
          <input name="nome" value={form.nome} onChange={handleChange} required
            placeholder="Ex: Produto X, Serviço Y..."
            className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Preço de venda (R$) *</label>
            <input name="preco_venda" value={form.preco_venda} onChange={handleChange} type="number" step="0.01" min="0.01" required
              placeholder="0,00"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Preço de custo (R$)</label>
            <input name="preco_custo" value={form.preco_custo} onChange={handleChange} type="number" step="0.01" min="0"
              placeholder="0,00"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Qtd. inicial</label>
            <input name="quantidade" value={form.quantidade} onChange={handleChange} type="number" min="0"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Estoque mínimo</label>
            <input name="quantidade_minima" value={form.quantidade_minima} onChange={handleChange} type="number" min="0"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Unidade</label>
            <select name="unidade" value={form.unidade} onChange={handleChange}
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
              {["un", "kg", "g", "l", "ml", "cx", "pc", "par", "m"].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Descrição</label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={2}
            placeholder="Detalhes do produto..."
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
            {loading ? "Salvando..." : "Criar produto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
