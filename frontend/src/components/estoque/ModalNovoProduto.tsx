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

const B = "#1f2937";
const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-all";
const inp = { background: "#0a0f1e", border: `1px solid ${B}` };
const focus = (e: React.FocusEvent<any>) => e.currentTarget.style.borderColor = "#f97316";
const blur  = (e: React.FocusEvent<any>) => e.currentTarget.style.borderColor = B;

export default function ModalNovoProduto({ aberto, onFechar, onCriado }: Props) {
  const [form, setForm] = useState({
    nome: "", preco_venda: "", preco_custo: "",
    quantidade: "0", quantidade_minima: "5", unidade: "un", descricao: "",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Nome *</label>
          <input name="nome" value={form.nome} onChange={handle} required
            placeholder="Ex: Produto X, Serviço Y..."
            className={inputCls} style={inp} onFocus={focus} onBlur={blur} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Preço de venda (R$) *</label>
            <input name="preco_venda" value={form.preco_venda} onChange={handle}
              type="number" step="0.01" min="0.01" required placeholder="0,00"
              className={inputCls} style={inp} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Preço de custo (R$)</label>
            <input name="preco_custo" value={form.preco_custo} onChange={handle}
              type="number" step="0.01" min="0" placeholder="0,00"
              className={inputCls} style={inp} onFocus={focus} onBlur={blur} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Qtd. inicial</label>
            <input name="quantidade" value={form.quantidade} onChange={handle} type="number" min="0"
              className={inputCls} style={inp} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Estoque mínimo</label>
            <input name="quantidade_minima" value={form.quantidade_minima} onChange={handle} type="number" min="0"
              className={inputCls} style={inp} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Unidade</label>
            <select name="unidade" value={form.unidade} onChange={handle}
              className={inputCls} style={inp}>
              {["un", "kg", "g", "l", "ml", "cx", "pc", "par", "m"].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Descrição</label>
          <textarea name="descricao" value={form.descricao} onChange={handle} rows={2}
            placeholder="Detalhes do produto..."
            className={inputCls + " resize-none"} style={inp} onFocus={focus} onBlur={blur} />
        </div>

        {erro && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {erro}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onFechar}
            className="flex-1 py-2 rounded-lg text-sm transition-all"
            style={{ background: "transparent", border: `1px solid ${B}`, color: "#6b7280" }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            {loading ? "Salvando..." : "Criar produto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
