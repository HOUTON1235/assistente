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

const CATEGORIAS = ["vendas", "servicos", "aluguel", "salarios", "fornecedores", "impostos", "outros"];

const S = "#111827";
const B = "#1f2937";

const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-all";

export default function ModalNovaTransacao({ aberto, onFechar, onCriado }: Props) {
  const [form, setForm] = useState({
    tipo: "receita",
    descricao: "",
    valor: "",
    categoria: "outros",
    data_vencimento: "",
    status: "pago",
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro("Descrição é obrigatória"); return; }
    if (!form.valor || parseFloat(form.valor) <= 0) { setErro("Valor deve ser maior que zero"); return; }
    setErro("");
    setLoading(true);
    try {
      await api.post("/financeiro/", {
        tipo: form.tipo,
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        categoria: form.categoria,
        status: form.status,
        data_vencimento: form.data_vencimento || undefined,
      });
      setForm({ tipo: "receita", descricao: "", valor: "", categoria: "outros", data_vencimento: "", status: "pago" });
      toast.sucesso("Transação registrada!");
      onCriado();
      onFechar();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao registrar transação";
      setErro(msg);
      toast.erro(msg);
    } finally { setLoading(false); }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova transação">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="flex gap-2">
          {(["receita", "despesa"] as const).map(t => (
            <button key={t} type="button" onClick={() => setForm(p => ({ ...p, tipo: t }))}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: form.tipo === t
                  ? t === "receita" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"
                  : "transparent",
                border: `1px solid ${form.tipo === t ? (t === "receita" ? "#4ade80" : "#f87171") : B}`,
                color: form.tipo === t ? (t === "receita" ? "#4ade80" : "#f87171") : "#6b7280",
              }}>
              {t === "receita" ? "↑ Receita" : "↓ Despesa"}
            </button>
          ))}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Descrição *</label>
          <input name="descricao" value={form.descricao} onChange={handle} required
            placeholder="Ex: Venda de produto, Aluguel..."
            className={inputCls} style={{ background: "#0a0f1e", border: `1px solid ${B}` }}
            onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
            onBlur={e => e.currentTarget.style.borderColor = B} />
        </div>

        {/* Valor + Categoria */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Valor (R$) *</label>
            <input name="valor" value={form.valor} onChange={handle} type="number" step="0.01" min="0.01" required
              placeholder="0,00"
              className={inputCls} style={{ background: "#0a0f1e", border: `1px solid ${B}` }}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = B} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Categoria</label>
            <select name="categoria" value={form.categoria} onChange={handle}
              className={inputCls} style={{ background: "#0a0f1e", border: `1px solid ${B}` }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Status + Vencimento */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Status</label>
            <select name="status" value={form.status} onChange={handle}
              className={inputCls} style={{ background: "#0a0f1e", border: `1px solid ${B}` }}>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Vencimento</label>
            <input name="data_vencimento" value={form.data_vencimento} onChange={handle} type="date"
              className={inputCls} style={{ background: "#0a0f1e", border: `1px solid ${B}`, colorScheme: "dark" }}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = B} />
          </div>
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
            {loading ? "Salvando..." : "Registrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
