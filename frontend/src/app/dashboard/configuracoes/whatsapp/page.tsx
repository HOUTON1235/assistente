"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageCircle, Wifi, WifiOff, QrCode, Trash2, RefreshCw,
  CheckCircle, Save, ToggleLeft, ToggleRight, Bot, Eye, Building2,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";
const DIAS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const SEGMENTOS = [
  { value:"hamburgueria",    label:"🍔 Hamburgueria" },
  { value:"pizzaria",        label:"🍕 Pizzaria" },
  { value:"padaria",         label:"🥐 Padaria" },
  { value:"mercado",         label:"🛒 Mercado" },
  { value:"loja_roupas",     label:"👗 Loja de Roupas" },
  { value:"salao_beleza",    label:"💇 Salão / Barbearia" },
  { value:"farmacia",        label:"💊 Farmácia" },
  { value:"oficina",         label:"🔧 Oficina Mecânica" },
  { value:"clinica",         label:"🏥 Clínica / Consultório" },
  { value:"pet_shop",        label:"🐾 Pet Shop" },
  { value:"imobiliaria",     label:"🏠 Imobiliária" },
  { value:"escola",          label:"📚 Escola / Curso" },
  { value:"ecommerce",       label:"📦 Loja Online" },
  { value:"servicos_gerais", label:"🛠️ Serviços Gerais" },
  { value:"outro",           label:"🏢 Outro" },
];

export default function WhatsappPage() {
  const [status,   setStatus]   = useState<any>(null);
  const [config,   setConfig]   = useState<any>(null);
  const [empresa,  setEmpresa]  = useState<any>(null);
  const [qrcode,   setQrcode]   = useState<string|null>(null);
  const [loading,  setLoading]  = useState(false);
  const [criando,  setCriando]  = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [preview,  setPreview]  = useState<string|null>(null);
  const [prevLoading, setPrevLoading] = useState(false);
  const [aba, setAba] = useState<"conexao"|"atendimento"|"negocio">("conexao");
  const pollingRef   = useRef<NodeJS.Timeout|null>(null);
  const qrPollingRef = useRef<NodeJS.Timeout|null>(null);

  const verificarStatus = useCallback(async () => {
    try {
      const r = await api.get("/whatsapp/instancia/status");
      setStatus(r.data);
      if (r.data.conectado) { setQrcode(null); pararQrPolling(); }
    } catch {}
  }, []);

  const carregarTudo = useCallback(async () => {
    try 
      const [r1, r2] = await Promise.all([
        api.get("/whatsapp/configuracoes"),
        api.get("/conta/perfil"),
      ]);
      setConfig(r1.data);
      setEmpresa(r2.data?.empresa || null);
    } catch {}
  }, []);

  useEffect(() => {
    verificarStatus();
    carregarTudo();
    pollingRef.current = setInterval(verificarStatus, 5000);
    return () => { clearInterval(pollingRef.current!); pararQrPolling(); };
  }, []);

  const iniciarQrPolling = () => {
    pararQrPolling();
    qrPollingRef.current = setInterval(async () => {
      try {
        const r = await api.get("/whatsapp/instancia/qrcode");
        if (r.data?.conectado) { setQrcode(null); pararQrPolling(); await verificarStatus(); return; }
        const b64 = r.data?.base64 || r.data?.qrcode;
        if (b64) setQrcode(b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`);
      } catch {}
    }, 5000);
  };

  const pararQrPolling = () => {
    if (qrPollingRef.current) { clearInterval(qrPollingRef.current); qrPollingRef.current = null; }
  };

  const criarInstancia = async () => {
    setCriando(true);
    try {
      await api.post("/whatsapp/instancia/criar");
      await carregarQrCode();
    } catch (e: any) { toast.erro(e.response?.data?.detail || "Erro ao conectar"); }
    finally { setCriando(false); }
  };

  const carregarQrCode = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < 6; i++) {
        const r = await api.get("/whatsapp/instancia/qrcode");
        if (r.data?.conectado) { await verificarStatus(); return; }
        const b64 = r.data?.base64 || r.data?.qrcode;
        if (b64) { setQrcode(b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`); iniciarQrPolling(); return; }
        await new Promise(x => setTimeout(x, 2500));
      }
      toast.aviso("QR ainda sendo gerado. Tente em segundos.");
    } catch { toast.erro("Erro ao carregar QR Code"); }
    finally { setLoading(false); }
  };

  const desconectar = async () => {
    if (!confirm("Desconectar o WhatsApp?")) return;
    try {
      await api.delete("/whatsapp/instancia/desconectar");
      setStatus(null); setQrcode(null); pararQrPolling();
      toast.sucesso("WhatsApp desconectado");
    } catch (e: any) { toast.erro(e.response?.data?.detail || "Erro"); }
  };

  const salvarConfig = async () => {
    setSalvando(true);
    try {
      await api.patch("/whatsapp/configuracoes", config);
      toast.sucesso("Configurações salvas!");
    } catch { toast.erro("Erro ao salvar"); }
    finally { setSalvando(false); }
  };

  const salvarEmpresa = async () => {
    setSalvando(true);
    try {
      await api.patch("/conta/empresa", empresa);
      toast.sucesso("Negócio atualizado! Orbita já adaptada.");
    } catch { toast.erro("Erro ao salvar"); }
    finally { setSalvando(false); }
  };

  const gerarPrevia = async () => {
    setPrevLoading(true);
    try {
      const r = await api.post("/whatsapp/previa-atendimento", { mensagem: "Oi! Gostaria de saber sobre os produtos" });
      setPreview(r.data.resposta);
    } catch { toast.erro("Erro ao gerar prévia"); }
    finally { setPrevLoading(false); }
  };

  const toggleDia = (d: number) => {
    const dias = config?.dias_atendimento || [1,2,3,4,5];
    setConfig((p: any) => ({ ...p, dias_atendimento: dias.includes(d) ? dias.filter((x: number) => x !== d) : [...dias, d].sort() }));
  };

  const temInstancia = !!status?.instancia;
  const conectado    = status?.conectado === true;
  const segLabel     = SEGMENTOS.find(s => s.value === empresa?.segmento)?.label || "Não configurado";

  const inp = { background: BG, border: `1px solid ${BORD}` };
  const inpCls = "w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="px-6 py-4" style={{ borderBottom: `1px solid ${BORD}` }}>
          <h1 className="text-lg font-semibold text-white">WhatsApp</h1>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Atendimento automático adaptado ao seu negócio</p>
        </header>

        {/* Abas */}
        <div className="flex gap-2 px-6 pt-4">
          {(["conexao","atendimento","negocio"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a
                ? { background:"rgba(249,115,22,0.1)", color:"#f97316", border:"1px solid rgba(249,115,22,0.3)" }
                : { background:"transparent", color:"#6b7280", border:`1px solid ${BORD}` }}>
              {a === "conexao" ? "Conexão" : a === "atendimento" ? "Atendimento" : "Meu Negócio"}
            </button>
          ))}
        </div>

        <div className="p-6 max-w-2xl space-y-5">

          {/* ── ABA CONEXÃO ── */}
          {aba === "conexao" && (<>
            <div className="rounded-xl p-5" style={{ background: SURF, border:`1px solid ${BORD}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: conectado ? "rgba(74,222,128,0.1)" : "rgba(107,114,128,0.1)" }}>
                    <MessageCircle size={18} style={{ color: conectado ? "#4ade80" : "#6b7280" }} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Conexão WhatsApp</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {conectado
                        ? <><Wifi size={12} style={{ color:"#4ade80" }} /><span className="text-xs" style={{ color:"#4ade80" }}>+{status?.numero} conectado</span></>
                        : <><WifiOff size={12} style={{ color:"#6b7280" }} /><span className="text-xs" style={{ color:"#6b7280" }}>Desconectado</span></>}
                    </div>
                  </div>
                </div>
                <button onClick={verificarStatus} style={{ color:"#6b7280" }}
                  onMouseEnter={e=>(e.currentTarget as any).style.color="#f1f5f9"}
                  onMouseLeave={e=>(e.currentTarget as any).style.color="#6b7280"}>
                  <RefreshCw size={14} />
                </button>
              </div>

              {conectado && (
                <div className="rounded-lg px-4 py-2.5 mb-4" style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)" }}>
                  <p className="text-xs" style={{ color:"#4ade80" }}>✓ Orbita atendendo como: <strong>{segLabel}</strong></p>
                </div>
              )}

              <div className="flex gap-2">
                {!temInstancia ? (
                  <button onClick={criarInstancia} disabled={criando}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ background:"linear-gradient(135deg,#1e40af,#f97316)" }}>
                    <MessageCircle size={15} />{criando ? "Iniciando..." : "Conectar WhatsApp"}
                  </button>
                ) : conectado ? (
                  <button onClick={desconectar} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                    style={{ background:"rgba(248,113,113,0.1)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)" }}>
                    <Trash2 size={14} /> Desconectar
                  </button>
                ) : (<>
                  <button onClick={carregarQrCode} disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ background:"linear-gradient(135deg,#1e40af,#f97316)" }}>
                    <QrCode size={15} />{loading ? "Carregando..." : "Ver QR Code"}
                  </button>
                  <button onClick={desconectar} className="px-3 py-2 rounded-lg text-sm"
                    style={{ background:"transparent", border:`1px solid ${BORD}`, color:"#6b7280" }}>
                    <Trash2 size={14} />
                  </button>
                </>)}
              </div>
            </div>

            {qrcode && !conectado && (
              <div className="rounded-xl p-5 text-center" style={{ background: SURF, border:`1px solid ${BORD}` }}>
                <p className="text-sm font-medium text-white mb-1">Escaneie o QR Code</p>
                <p className="text-xs mb-5" style={{ color:"#6b7280" }}>WhatsApp → Menu → Dispositivos Conectados → Conectar</p>
                <div className="inline-block p-3 rounded-xl bg-white">
                  <img src={qrcode} alt="QR Code WhatsApp" width={220} height={220} />
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background:"#f97316" }} />
                  <p className="text-xs" style={{ color:"#6b7280" }}>Aguardando conexão...</p>
                </div>
              </div>
            )}
          </>)}

          {/* ── ABA ATENDIMENTO ── */}
          {aba === "atendimento" && config && (<div className="space-y-4">
            {/* Toggle ativo */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Atendimento ativo</p>
                  <p className="text-xs mt-0.5" style={{ color:"#6b7280" }}>Orbita responde clientes automaticamente</p>
                </div>
                <button onClick={() => setConfig((p:any) => ({...p, ativo_atendimento: !p.ativo_atendimento}))}
                  style={{ color: config.ativo_atendimento ? "#4ade80" : "#6b7280" }}>
                  {config.ativo_atendimento ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                </button>
              </div>
            </div>

            {/* Horário */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-4">Horário de atendimento</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {DIAS.map((d,i) => {
                  const ativo = (config.dias_atendimento||[]).includes(i);
                  return (
                    <button key={i} onClick={() => toggleDia(i)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={ativo
                        ? { background:"rgba(249,115,22,0.15)", color:"#f97316", border:"1px solid rgba(249,115,22,0.4)" }
                        : { background:"transparent", color:"#6b7280", border:`1px solid ${BORD}` }}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Início","horario_inicio","08:00"],["Fim","horario_fim","18:00"]].map(([l,n,def]) => (
                  <div key={n}>
                    <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>{l}</label>
                    <input type="time" value={config[n]||def}
                      onChange={e => setConfig((p:any) => ({...p,[n]:e.target.value}))}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                      style={{ background:BG, border:`1px solid ${BORD}`, colorScheme:"dark" }}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensagens */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-4">Mensagens automáticas</p>
              {[
                ["Boas-vindas","mensagem_boas_vindas","Olá! Bem-vindo..."],
                ["Fora do horário","mensagem_fora_horario","Estamos fora do horário..."],
              ].map(([l,n,ph]) => (
                <div key={n} className="mb-3">
                  <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>{l}</label>
                  <textarea value={config[n]||""} onChange={e => setConfig((p:any)=>({...p,[n]:e.target.value}))}
                    rows={2} placeholder={ph}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none"
                    style={inp}
                    onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                    onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
                </div>
              ))}
            </div>

            {/* Instrução personalizada */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-1">Instrução personalizada</p>
              <p className="text-xs mb-3" style={{ color:"#6b7280" }}>Ex: "Não informe preços sem confirmar o estoque. Sempre ofereça o combo."</p>
              <textarea value={config.prompt_personalizado||""}
                onChange={e => setConfig((p:any)=>({...p,prompt_personalizado:e.target.value}))}
                rows={3} placeholder="Instrução adicional para a Orbita..."
                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none"
                style={inp}
                onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
            </div>

            {/* Prévia */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white">Prévia do atendimento</p>
                  <p className="text-xs mt-0.5" style={{ color:"#6b7280" }}>Como a Orbita responderia um cliente agora</p>
                </div>
                <button onClick={gerarPrevia} disabled={prevLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background:"linear-gradient(135deg,#1e40af,#f97316)" }}>
                  <Eye size={13}/>{prevLoading ? "Gerando..." : "Simular"}
                </button>
              </div>
              {preview && (
                <div className="rounded-lg p-3 text-sm" style={{ background:BG, border:`1px solid ${BORD}`, color:"#d1d5db" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={14} style={{ color:"#f97316" }}/><span className="text-xs font-medium" style={{ color:"#f97316" }}>Orbita responderia:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-xs">{preview}</p>
                </div>
              )}
            </div>

            <button onClick={salvarConfig} disabled={salvando}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background:"linear-gradient(135deg,#1e40af,#f97316)" }}>
              <Save size={15}/>{salvando ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>)}

          {/* ── ABA MEU NEGÓCIO ── */}
          {aba === "negocio" && empresa && (<div className="space-y-4">
            <div className="rounded-xl p-4 text-sm" style={{ background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.2)", color:"#f97316" }}>
              <Bot size={14} className="inline mr-1.5"/>
              A Orbita usa essas informações para se adaptar ao seu tipo de negócio automaticamente.
            </div>

            {/* Segmento */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-3">Tipo do negócio</p>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {SEGMENTOS.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setEmpresa((p:any) => ({...p, segmento: s.value}))}
                    className="text-left px-3 py-2.5 rounded-lg text-xs transition-all"
                    style={{
                      background: empresa.segmento===s.value ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${empresa.segmento===s.value ? "#f97316" : BORD}`,
                      color: empresa.segmento===s.value ? "#f97316" : "#9ca3af",
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição e horário */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-4">Informações do negócio</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>Descrição do negócio</label>
                  <textarea value={empresa.descricao_negocio||""} onChange={e => setEmpresa((p:any)=>({...p,descricao_negocio:e.target.value}))}
                    rows={2} placeholder="Ex: Hamburgueria artesanal com entrega rápida..."
                    className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none resize-none"
                    style={inp}
                    onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                    onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>Horário de funcionamento</label>
                    <input className={inpCls} style={inp} value={empresa.horario_funcionamento||""} placeholder="Seg-Sex 9h-18h"
                      onChange={e=>setEmpresa((p:any)=>({...p,horario_funcionamento:e.target.value}))}
                      onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                      onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>Formas de pagamento</label>
                    <input className={inpCls} style={inp} value={empresa.formas_pagamento||""} placeholder="Pix, cartão, dinheiro"
                      onChange={e=>setEmpresa((p:any)=>({...p,formas_pagamento:e.target.value}))}
                      onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                      onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-xl p-5" style={{ background:SURF, border:`1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-4">Entrega</p>
              <div className="flex gap-4 mb-3">
                {[["aceita_delivery","🛵 Delivery"],["aceita_retirada","🏪 Retirada"]].map(([k,l]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!empresa[k]} onChange={e=>setEmpresa((p:any)=>({...p,[k]:e.target.checked}))} className="w-4 h-4"/>
                    <span className="text-sm" style={{ color:"#9ca3af" }}>{l}</span>
                  </label>
                ))}
              </div>
              {empresa.aceita_delivery && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>Taxa entrega (R$)</label>
                    <input type="number" className={inpCls} style={inp} value={empresa.taxa_entrega||""} placeholder="5.00"
                      onChange={e=>setEmpresa((p:any)=>({...p,taxa_entrega:e.target.value}))}
                      onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                      onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#9ca3af" }}>Tempo estimado</label>
                    <input className={inpCls} style={inp} value={empresa.tempo_entrega||""} placeholder="30-45 min"
                      onChange={e=>setEmpresa((p:any)=>({...p,tempo_entrega:e.target.value}))}
                      onFocus={e=>e.currentTarget.style.borderColor="#f97316"}
                      onBlur={e=>e.currentTarget.style.borderColor=BORD}/>
                  </div>
                </div>
              )}
            </div>

            <button onClick={salvarEmpresa} disabled={salvando}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background:"linear-gradient(135deg,#1e40af,#f97316)" }}>
              <Save size={15}/>{salvando ? "Salvando..." : "Salvar negócio"}
            </button>
          </div>)}

        </div>
      </div>
    </div>
  );
}
