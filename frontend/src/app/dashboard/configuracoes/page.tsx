"use client";

import { useEffect, useState } from "react";
import { User, Lock, Building2, CheckCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all";
const inp = { background: BG, border: `1px solid ${BORD}` };
const inpDisabled = { background: BORD, border: `1px solid ${BORD}`, color: "#6b7280" };

function Secao({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: `1px solid ${BORD}` }}>
        <div style={{ color: "#f97316" }}>{icone}</div>
        <h2 className="font-medium text-white text-sm">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FocusInput({ name, value, onChange, type = "text", disabled, placeholder }: any) {
  return (
    <input name={name} value={value} onChange={onChange} type={type}
      disabled={disabled} placeholder={placeholder}
      className={inputCls}
      style={disabled ? inpDisabled : inp}
      onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = "#f97316"; }}
      onBlur={e => { if (!disabled) e.currentTarget.style.borderColor = BORD; }}
    />
  );
}

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [nomePerfil, setNomePerfil] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");
  const [msg, setMsg] = useState<{ texto: string; tipo: "ok" | "erro" } | null>(null);

  const flash = (texto: string, tipo: "ok" | "erro") => {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    api.get("/conta/perfil").then(r => {
      setPerfil(r.data);
      setNomePerfil(r.data.nome);
      setNomeEmpresa(r.data.empresa?.nome || "");
      setTelefoneEmpresa(r.data.empresa?.telefone || "");
    }).catch(() => {});
  }, []);

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch("/conta/perfil", { nome: nomePerfil });
      flash("Perfil atualizado!", "ok");
    } catch { flash("Erro ao atualizar perfil", "erro"); }
  };

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) { flash("As senhas não coincidem", "erro"); return; }
    if (novaSenha.length < 6) { flash("Mínimo 6 caracteres", "erro"); return; }
    try {
      await api.patch("/conta/senha", { senha_atual: senhaAtual, nova_senha: novaSenha });
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      flash("Senha alterada com sucesso!", "ok");
    } catch (err: any) { flash(err.response?.data?.detail || "Erro ao alterar senha", "erro"); }
  };

  const salvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch("/conta/empresa", { nome: nomeEmpresa, telefone: telefoneEmpresa });
      flash("Empresa atualizada!", "ok");
    } catch { flash("Erro ao atualizar empresa", "erro"); }
  };

  const btnPrimario = "px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORD}` }}>
          <h1 className="text-lg font-semibold text-white">Configurações</h1>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Gerencie seu perfil e empresa</p>
        </header>

        <div className="p-6 max-w-2xl space-y-5">
          {msg && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
              style={msg.tipo === "ok"
                ? { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }
                : { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
              {msg.tipo === "ok" && <CheckCircle size={15} />}
              {msg.texto}
            </div>
          )}

          {/* Perfil */}
          <Secao titulo="Meu perfil" icone={<User size={15} />}>
            <form onSubmit={salvarPerfil} className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Nome</label>
                <FocusInput value={nomePerfil} onChange={(e: any) => setNomePerfil(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>E-mail</label>
                <FocusInput value={perfil?.email || ""} disabled />
                <p className="text-xs mt-1" style={{ color: perfil?.email_verificado ? "#4ade80" : "#facc15" }}>
                  {perfil?.email_verificado ? "✓ Email verificado" : "⚠ Email não verificado"}
                </p>
              </div>
              <button type="submit" className={btnPrimario}
                style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                Salvar perfil
              </button>
            </form>
          </Secao>

          {/* Senha */}
          <Secao titulo="Alterar senha" icone={<Lock size={15} />}>
            <form onSubmit={alterarSenha} className="space-y-3">
              {[
                { label: "Senha atual", value: senhaAtual, setter: setSenhaAtual },
                { label: "Nova senha", value: novaSenha, setter: setNovaSenha },
                { label: "Confirmar nova senha", value: confirmarSenha, setter: setConfirmarSenha },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>{f.label}</label>
                  <input type="password" value={f.value} onChange={e => f.setter(e.target.value)}
                    required placeholder="••••••••"
                    className={inputCls} style={inp}
                    onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
                    onBlur={e => e.currentTarget.style.borderColor = BORD} />
                </div>
              ))}
              <button type="submit" className={btnPrimario}
                style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                Alterar senha
              </button>
            </form>
          </Secao>

          {/* Empresa */}
          <Secao titulo="Dados da empresa" icone={<Building2 size={15} />}>
            <form onSubmit={salvarEmpresa} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Nome da empresa</label>
                  <FocusInput value={nomeEmpresa} onChange={(e: any) => setNomeEmpresa(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9ca3af" }}>Telefone</label>
                  <FocusInput value={telefoneEmpresa} onChange={(e: any) => setTelefoneEmpresa(e.target.value)}
                    placeholder="(11) 99999-9999" />
                </div>
              </div>

              {perfil?.empresa && (
                <div className="rounded-lg p-3 text-xs space-y-1"
                  style={{ background: BG, border: `1px solid ${BORD}`, color: "#6b7280" }}>
                  <p>CNPJ: {perfil.empresa.cnpj || "Não informado"}</p>
                  <p>Plano:{" "}
                    <span className="capitalize font-medium" style={{ color: "#f97316" }}>
                      {perfil.empresa.plano}
                    </span>
                    {perfil.empresa.trial_dias_restantes > 0 && ` · ${perfil.empresa.trial_dias_restantes} dias restantes`}
                  </p>
                  {perfil.empresa.cidade && (
                    <p>{perfil.empresa.logradouro}, {perfil.empresa.numero} — {perfil.empresa.bairro}, {perfil.empresa.cidade}/{perfil.empresa.estado}</p>
                  )}
                </div>
              )}

              <button type="submit" className={btnPrimario}
                style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                Salvar empresa
              </button>
            </form>
          </Secao>
        </div>
      </div>
    </div>
  );
}
