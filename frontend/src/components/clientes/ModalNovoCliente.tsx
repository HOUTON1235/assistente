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

export default function ModalNovoCliente({ aberto, onFechar, onCriado }: Props) {
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf_cnpj: "", observacoes: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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

  const inp = { background: "#0a0f1e", border: `1px solid ${B}` };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo cliente">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Nome *</label>
          <input name="nome" value={form.nome} onChange={handle} required placeholder="João Silva"
            className={inputCls} style={inp}
            onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
            onBlur={e => e.currentTarget.style.borderColor = B} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handle} placeholder="(11) 99999-9999"
              className={inputCls} style={inp}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = B} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>CPF / CNPJ</label>
            <input name="cpf_cnpj" value={form.cpf_cnpj} onChange={handle} placeholder="000.000.000-00"
              className={inputCls} style={inp}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = B} />
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handle} placeholder="joao@email.com"
            className={inputCls} style={inp}
            onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
            onBlur={e => e.currentTarget.style.borderColor = B} />
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: "#9ca3af" }}>Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handle} rows={2}
            placeholder="Informações adicionais..."
            className={inputCls + " resize-none"} style={inp}
            onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
            onBlur={e => e.currentTarget.style.borderColor = B} />
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
            {loading ? "Salvando..." : "Criar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
