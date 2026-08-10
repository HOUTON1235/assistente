"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, MessageCircle, Search, Phone, WifiOff, RefreshCw } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

interface Conversa {
  numero: string;
  nome_contato: string;
  ultima_mensagem: string;
  ultima_vez: string;
  direcao: string;
  nao_lidas: number;
}

interface Mensagem {
  id: string;
  texto: string;
  direcao: "recebida" | "enviada";
  lida: boolean;
  criado_em: string;
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  const agora = new Date();
  const diff = agora.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("pt-BR", { weekday: "short" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatarNumero(num: string) {
  const n = num.replace(/\D/g, "");
  if (n.length === 13) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  if (n.length === 12) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,8)}-${n.slice(8)}`;
  return `+${n}`;
}

function Avatar({ nome, size = 36 }: { nome: string; size?: number }) {
  const letra = (nome || "?")[0].toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: "linear-gradient(135deg, #1e40af, #f97316)",
      }}>
      {letra}
    </div>
  );
}

export default function WhatsappInboxPage() {
  const [conversas, setConversas]       = useState<Conversa[]>([]);
  const [selecionada, setSelecionada]   = useState<Conversa | null>(null);
  const [mensagens, setMensagens]       = useState<Mensagem[]>([]);
  const [texto, setTexto]               = useState("");
  const [busca, setBusca]               = useState("");
  const [enviando, setEnviando]         = useState(false);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [conectado, setConectado]       = useState(false);
  const messagesEndRef                  = useRef<HTMLDivElement>(null);
  const pollingRef                      = useRef<NodeJS.Timeout | null>(null);

  const carregarConversas = useCallback(async () => {
    try {
      const res = await api.get("/whatsapp/conversas");
      setConversas(res.data.conversas || []);
    } catch {}
  }, []);

  const verificarConexao = useCallback(async () => {
    try {
      const res = await api.get("/whatsapp/instancia/status");
      setConectado(res.data.conectado);
    } catch {}
  }, []);

  useEffect(() => {
    carregarConversas();
    verificarConexao();
    pollingRef.current = setInterval(() => {
      carregarConversas();
      verificarConexao();
    }, 5000);
    return () => clearInterval(pollingRef.current!);
  }, [carregarConversas, verificarConexao]);

  // Recarrega mensagens quando troca de conversa
  useEffect(() => {
    if (!selecionada) return;
    carregarMensagens(selecionada.numero);
  }, [selecionada?.numero]);

  // Polling de mensagens da conversa aberta
  useEffect(() => {
    if (!selecionada) return;
    const t = setInterval(() => carregarMensagens(selecionada.numero, false), 3000);
    return () => clearInterval(t);
  }, [selecionada?.numero]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const carregarMensagens = async (numero: string, mostrarLoading = true) => {
    if (mostrarLoading) setLoadingMsgs(true);
    try {
      const res = await api.get(`/whatsapp/conversas/${numero}/mensagens`);
      setMensagens(res.data.mensagens || []);
      // Atualiza nao_lidas na lista
      setConversas(prev => prev.map(c =>
        c.numero === numero ? { ...c, nao_lidas: 0 } : c
      ));
    } catch {}
    finally { if (mostrarLoading) setLoadingMsgs(false); }
  };

  const enviarMensagem = async () => {
    if (!texto.trim() || !selecionada || enviando) return;
    const txt = texto.trim();
    setTexto("");
    setEnviando(true);

    // Otimista — adiciona na tela antes de confirmar
    const msgTemp: Mensagem = {
      id: `tmp-${Date.now()}`,
      texto: txt,
      direcao: "enviada",
      lida: true,
      criado_em: new Date().toISOString(),
    };
    setMensagens(prev => [...prev, msgTemp]);

    try {
      await api.post(`/whatsapp/conversas/${selecionada.numero}/enviar`, { texto: txt });
      await carregarMensagens(selecionada.numero, false);
    } catch {
      setMensagens(prev => prev.filter(m => m.id !== msgTemp.id));
      setTexto(txt);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
  };

  const conversasFiltradas = conversas.filter(c =>
    c.nome_contato.toLowerCase().includes(busca.toLowerCase()) ||
    c.numero.includes(busca)
  );

  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.nao_lidas, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />

      {/* ── Lista de conversas ── */}
      <div className="w-72 flex flex-col flex-shrink-0" style={{ borderRight: `1px solid ${BORD}` }}>
        {/* Header */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORD}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-white text-sm">WhatsApp</h1>
              {totalNaoLidas > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ background: "#f97316" }}>
                  {totalNaoLidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: conectado ? "#4ade80" : "#f87171" }} />
              <span className="text-xs" style={{ color: conectado ? "#4ade80" : "#f87171" }}>
                {conectado ? "Online" : "Offline"}
              </span>
              {!conectado && (
                <a href="/dashboard/configuracoes/whatsapp"
                  className="ml-2 text-xs px-2.5 py-1 rounded-lg font-medium text-white hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                  Conectar
                </a>
              )}
              <button onClick={() => { carregarConversas(); verificarConexao(); }}
                className="ml-1 transition-colors" style={{ color: "#6b7280" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f1f5f9"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
          {/* Busca */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: BG, border: `1px solid ${BORD}` }}>
            <Search size={13} style={{ color: "#6b7280" }} />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar conversa..."
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder-gray-600" />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {conversasFiltradas.length === 0 ? (
            <div className="p-6 text-center" style={{ color: "#6b7280" }}>
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">
                {busca ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
              </p>
              {!busca && (
                <p className="text-xs mt-1 opacity-60">
                  As mensagens aparecerão aqui quando alguém enviar um WhatsApp
                </p>
              )}
            </div>
          ) : (
            conversasFiltradas.map(c => (
              <button key={c.numero} onClick={() => setSelecionada(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{
                  background: selecionada?.numero === c.numero ? "rgba(249,115,22,0.08)" : "transparent",
                  borderBottom: `1px solid ${BORD}`,
                  borderLeft: selecionada?.numero === c.numero ? "2px solid #f97316" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (selecionada?.numero !== c.numero) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (selecionada?.numero !== c.numero) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div className="relative">
                  <Avatar nome={c.nome_contato} size={40} />
                  {c.nao_lidas > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                      style={{ background: "#f97316" }}>
                      {c.nao_lidas}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{c.nome_contato}</p>
                    <p className="text-xs flex-shrink-0 ml-1" style={{ color: "#6b7280" }}>
                      {formatarHora(c.ultima_vez)}
                    </p>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: c.nao_lidas > 0 ? "#9ca3af" : "#6b7280" }}>
                    {c.direcao === "enviada" && <span style={{ color: "#4ade80" }}>✓ </span>}
                    {c.ultima_mensagem}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat ── */}
      {selecionada ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header da conversa */}
          <div className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0"
            style={{ borderBottom: `1px solid ${BORD}`, background: SURF }}>
            <Avatar nome={selecionada.nome_contato} size={36} />
            <div className="flex-1">
              <p className="font-medium text-white text-sm">{selecionada.nome_contato}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                {formatarNumero(selecionada.numero)}
              </p>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{ background: "#0d1628" }}>
            {loadingMsgs ? (
              <div className="flex justify-center pt-8">
                <div className="flex gap-1">
                  {[0,150,300].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: "#f97316", animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            ) : mensagens.length === 0 ? (
              <div className="text-center pt-12" style={{ color: "#6b7280" }}>
                <MessageCircle size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma mensagem ainda</p>
              </div>
            ) : (
              mensagens.map((m, i) => {
                const enviada = m.direcao === "enviada";
                const showDate = i === 0 || new Date(m.criado_em).toDateString() !== new Date(mensagens[i-1].criado_em).toDateString();
                return (
                  <div key={m.id}>
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="text-xs px-3 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>
                          {new Date(m.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${enviada ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[70%] rounded-2xl px-3.5 py-2.5"
                        style={enviada
                          ? { background: "linear-gradient(135deg, #1e40af, #f97316)", color: "#fff", borderBottomRightRadius: 4 }
                          : { background: "#1f2937", color: "#f1f5f9", borderBottomLeftRadius: 4 }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                        <p className="text-xs mt-1 text-right opacity-70">
                          {new Date(m.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {enviada && (m.lida ? " ✓✓" : " ✓")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${BORD}`, background: SURF }}>
            {!conectado ? (
              <div className="flex items-center gap-2 justify-center py-2 text-sm" style={{ color: "#f87171" }}>
                <WifiOff size={14} /> WhatsApp desconectado — reconecte em Configurações
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: BG, border: `1px solid ${BORD}` }}>
                  <textarea
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none leading-relaxed"
                    style={{ maxHeight: 100 }}
                  />
                </div>
                <button onClick={enviarMensagem} disabled={!texto.trim() || enviando}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                  <Send size={16} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tela vazia */
        <div className="flex-1 flex items-center justify-center flex-col gap-4"
          style={{ background: "#0d1628" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <MessageCircle size={32} className="text-white" />
          </div>
          <div className="text-center">
            <p className="font-medium text-white">Caixa de entrada WhatsApp</p>
            {conectado ? (
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                Selecione uma conversa para começar
              </p>
            ) : (
              <>
                <p className="text-sm mt-1" style={{ color: "#f87171" }}>
                  WhatsApp desconectado
                </p>
                <a href="/dashboard/configuracoes/whatsapp"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                  <Phone size={15} /> Conectar WhatsApp agora
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
