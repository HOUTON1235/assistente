"use client";

import { useEffect, useState } from "react";
import { User, Lock, Building2, CheckCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

interface Perfil {
  nome: string;
  email: string;
  email_verificado: boolean;
  empresa: {
    nome: string;
    cnpj: string | null;
    telefone: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    plano: string;
    trial_dias_restantes: number;
  };
}

function Secao({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2e2e2e]">
        <div className="text-indigo-400">{icone}</div>
        <h2 className="font-medium text-white">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nomePerfil, setNomePerfil] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");
  const [msg, setMsg] = useState<{ texto: string; tipo: "ok" | "erro" } | null>(null);

  const mostrarMsg = (texto: string, tipo: "ok" | "erro") => {
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
      mostrarMsg("Perfil atualizado com sucesso", "ok");
    } catch { mostrarMsg("Erro ao atualizar perfil", "erro"); }
  };

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) { mostrarMsg("As senhas não coincidem", "erro"); return; }
    if (novaSenha.length < 6) { mostrarMsg("Nova senha deve ter pelo menos 6 caracteres", "erro"); return; }
    try {
      await api.patch("/conta/senha", { senha_atual: senhaAtual, nova_senha: novaSenha });
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      mostrarMsg("Senha alterada com sucesso", "ok");
    } catch (err: any) {
      mostrarMsg(err.response?.data?.detail || "Erro ao alterar senha", "erro");
    }
  };

  const salvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch("/conta/empresa", { nome: nomeEmpresa, telefone: telefoneEmpresa });
      mostrarMsg("Dados da empresa atualizados", "ok");
    } catch { mostrarMsg("Erro ao atualizar empresa", "erro"); }
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="border-b border-[#2e2e2e] px-6 py-4">
          <h1 className="text-lg font-semibold">Configurações</h1>
        </header>

        <div className="p-6 max-w-2xl space-y-5">

          {/* Mensagem de feedback */}
          {msg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
              msg.tipo === "ok"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {msg.tipo === "ok" && <CheckCircle size={15} />}
              {msg.texto}
            </div>
          )}

          {/* Perfil */}
          <Secao titulo="Meu perfil" icone={<User size={16} />}>
            <form onSubmit={salvarPerfil} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome</label>
                <input value={nomePerfil} onChange={e => setNomePerfil(e.target.value)}
                  className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">E-mail</label>
                <input value={perfil?.email || ""} disabled
                  className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-600 mt-1">
                  {perfil?.email_verificado
                    ? "✓ Email verificado"
                    : "⚠ Email não verificado — verifique sua caixa de entrada"}
                </p>
              </div>
              <button type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Salvar
              </button>
            </form>
          </Secao>

          {/* Alterar senha */}
          <Secao titulo="Alterar senha" icone={<Lock size={16} />}>
            <form onSubmit={alterarSenha} className="space-y-3">
              {[
                { label: "Senha atual", value: senhaAtual, setter: setSenhaAtual },
                { label: "Nova senha", value: novaSenha, setter: setNovaSenha },
                { label: "Confirmar nova senha", value: confirmarSenha, setter: setConfirmarSenha },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                  <input type="password" value={f.value} onChange={e => f.setter(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
              <button type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Alterar senha
              </button>
            </form>
          </Secao>

          {/* Empresa */}
          <Secao titulo="Dados da empresa" icone={<Building2 size={16} />}>
            <form onSubmit={salvarEmpresa} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nome da empresa</label>
                  <input value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)}
                    className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Telefone</label>
                  <input value={telefoneEmpresa} onChange={e => setTelefoneEmpresa(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-[#252525] border border-[#3e3e3e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              {perfil?.empresa && (
                <div className="bg-[#252525] rounded-lg p-3 text-xs text-gray-400 space-y-1">
                  <p>CNPJ: {perfil.empresa.cnpj || "Não informado"}</p>
                  <p>Plano: <span className="text-indigo-400 capitalize">{perfil.empresa.plano}</span>
                    {perfil.empresa.trial_dias_restantes > 0 && ` · ${perfil.empresa.trial_dias_restantes} dias restantes`}
                  </p>
                  {perfil.empresa.cidade && (
                    <p>Endereço: {perfil.empresa.logradouro}, {perfil.empresa.numero} — {perfil.empresa.bairro}, {perfil.empresa.cidade}/{perfil.empresa.estado}</p>
                  )}
                </div>
              )}

              <button type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Salvar empresa
              </button>
            </form>
          </Secao>

        </div>
      </div>
    </div>
  );
}
