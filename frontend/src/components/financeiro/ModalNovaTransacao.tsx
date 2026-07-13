"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onCriada: () => void;
  tipoInicial?: "receita" | "despesa";
}

const CATEGORIAS = ["vendas", "servicos", "aluguel", "salarios", "fornecedores", "impostos", "outros"];

export default function ModalNovaTransacao({ aberto, onFechar, onCriada, tipoInicial = "receita" }: Props) {
  const [form, setForm] = useState({
    tipo: tipoInicial,
    descricao: "",
    valor: "",
    categoria: "outros",
    data_vencimento: "",
    observacoes: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro("Descrição é obrigatória"); return; }
    if (!form.valor || parseFloat(form.valor) <= 0) { setErro("Valor deve ser maior que zero"); return; }
    setErro("");
    setLoading(true);
    try {
      await api.post("/financeiro/", {
        ...form,
        valor: parseFloat(form.valor),
        data_vencimento: form.data_vencimento || undefined,
      });
      setForm({ tipo: tipoInicial, descricao: "", valor: "", categoria: "outros", data_vencimento: "", observacoes: "" });
      toast.sucesso(`${form.tipo === "receita" ? "Receita" : "Despesa"} registrada com sucesso!`);
      onCriada();
      onFechar();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao criar transação";
      setErro(msg);
      toast.erro(msg);
    } finally { setLoading(false); }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova transação">
      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Tipo */}
        <div className="flex gap-2">
          {(["receita", "despesa"] as const).map(t => (
            <button key={t} type="button"
              onClick={() => setForm(prev => ({ ...prev, tipo: t }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                form.tipo === t
                  ? t === "receita" ? "bg-green-500/15 border-green-500/40 text-green-400" : "bg-red-500/15 border-red-500/40 text-red-400"
                  : "bg-transparent border-[#3e3e3e] text-gray-400 hover:border-gray-500"
              }`}>
              {t === "receita" ? "↑ Receita" : "↓ Despesa"}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Descrição *</label>
          <input name="descricao" value={form.descricao} onChange={handleChange} required
            placeholder="Ex: Venda de produto, Aluguel..."
            className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Valor (R$) *</label>
            <input name="valor" value={form.valor} onChange={handleChange} type="number" step="0.01" min="0.01" required
              placeholder="0,00"
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Categoria</label>
            <select name="categoria" value={form.categoria} onChange={handleChange}
              className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
              {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Vencimento</label>
          <input name="data_vencimento" value={form.data_vencimento} onChange={handleChange} type="date"
            className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
        </div>

        {erro && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onFechar}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-2 rounded-lg text-sm transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Salvando..." : "Criar transação"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
