"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, AlertTriangle, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { D } from "@/lib/design";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AcaoPendente {
  acao: string;
  dados: Record<string, unknown>;
  resumo: string;
}

function ConfirmacaoAcao({ acao, onConfirmar, onCancelar }: { acao: AcaoPendente; onConfirmar: () => void; onCancelar: () => void }) {
  return (
    <div style={{ margin: "8px 0", padding: "12px 14px", borderRadius: 8, background: `${D.warning}0d`, border: `1px solid ${D.warning}33` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <AlertTriangle size={13} style={{ color: D.warning, marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: D.text2, margin: 0 }}>{acao.resumo}</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onConfirmar}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: D.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          <Check size={11} /> Confirmar
        </button>
        <button onClick={onCancelar}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${D.border}`, color: D.muted, fontSize: 12, cursor: "pointer" }}>
          <X size={11} /> Cancelar
        </button>
      </div>
    </div>
  );
}

export default function ChatInterface({ fullPage = false }: { fullPage?: boolean }) {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [conversaId, setConversaId]       = useState<string | null>(null);
  const [carregando, setCarregando]       = useState(true);
  const [acaoPendente, setAcaoPendente]   = useState<AcaoPendente | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get("/chat/historico");
        const convs = r.data.conversas;
        if (convs?.length > 0) {
          const ultima = convs[0];
          setConversaId(ultima.id);
          const det = await api.get(`/chat/conversa/${ultima.id}`);
          const msgs: Message[] = det.data.mensagens.map((m: any) => ({
            id: m.id, role: m.role, content: m.conteudo, timestamp: new Date(m.criado_em),
          }));
          if (msgs.length > 0) { setMessages(msgs); return; }
        }
      } catch {}
      boasVindas();
    };
    load().finally(() => setCarregando(false));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, acaoPendente]);

  const boasVindas = () => setMessages([{
    id: "bv", role: "assistant",
    content: "Olá! Sou a **Orbita**. Como posso ajudar hoje?",
    timestamp: new Date(),
  }]);

  const novaConversa = () => { setConversaId(null); setAcaoPendente(null); boasVindas(); };
  const addMsg = (role: "user" | "assistant", content: string) =>
    setMessages(p => [...p, { id: Date.now().toString(), role, content, timestamp: new Date() }]);

  const enviar = async (msg: string, confirmado = false, acaoConf: AcaoPendente | null = null) => {
    if (!msg.trim() || isLoading) return;
    if (!confirmado) addMsg("user", msg);
    setIsLoading(true);
    try {
      const payload: any = { mensagem: msg, conversa_id: conversaId };
      if (confirmado && acaoConf) { payload.confirmado = true; payload.acao_pendente = acaoConf; }
      const r = await api.post("/chat/", payload);
      setConversaId(r.data.conversa_id);
      if (r.data.requer_confirmacao && r.data.acao_pendente) setAcaoPendente(r.data.acao_pendente);
      else setAcaoPendente(null);
      addMsg("assistant", r.data.resposta);
    } catch (err: any) {
      const s = err?.response?.status;
      let txt = "Erro de conexão.";
      if (s === 401) txt = "Sessão expirada. Faça login novamente.";
      else if (s === 429) txt = "Muitas mensagens. Aguarde.";
      addMsg("assistant", txt);
    } finally { setIsLoading(false); }
  };

  const handleConfirmar = async () => { if (!acaoPendente) return; const a = acaoPendente; setAcaoPendente(null); await enviar("Confirmado", true, a); };
  const handleCancelar = () => { setAcaoPendente(null); addMsg("assistant", "Cancelado."); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(input); setInput(""); } };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: D.bg }}>
      {/* Header */}
      <div style={{ padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: D.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={13} style={{ color: "#fff" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: D.text, margin: 0 }}>Orbita</p>
            <p style={{ fontSize: 11, color: D.success, margin: 0 }}>● Online</p>
          </div>
        </div>
        <button onClick={novaConversa} title="Nova conversa"
          style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: D.muted }}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = D.surface; e.currentTarget.style.color = D.text; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = D.muted; }}>
          <RotateCcw size={12} strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
        {carregando ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,150,300].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: D.muted, animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: m.role === "assistant" ? D.accent : D.surface2, border: m.role === "user" ? `1px solid ${D.border}` : "none" }}>
                  {m.role === "assistant" ? <Bot size={12} style={{ color: "#fff" }} /> : <User size={12} style={{ color: D.muted }} />}
                </div>
                <div style={{
                  maxWidth: "78%", padding: "8px 12px", borderRadius: 10, fontSize: 13, lineHeight: 1.6,
                  background: m.role === "assistant" ? D.surface : D.surface2,
                  border: `1px solid ${D.border}`,
                  color: D.text2,
                  borderTopLeftRadius: m.role === "assistant" ? 4 : 10,
                  borderTopRightRadius: m.role === "user" ? 4 : 10,
                }}>
                  {m.role === "assistant"
                    ? <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{m.content}</ReactMarkdown>
                    : m.content}
                </div>
              </div>
            ))}

            {acaoPendente && <ConfirmacaoAcao acao={acaoPendente} onConfirmar={handleConfirmar} onCancelar={handleCancelar} />}

            {isLoading && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: D.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={12} style={{ color: "#fff" }} />
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: D.surface, border: `1px solid ${D.border}`, display: "flex", gap: 3, alignItems: "center" }}>
                  {[0,100,200].map(d => <div key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: D.muted, animation: "bounce 1s infinite", animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${D.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: "8px 10px 8px 14px" }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={acaoPendente ? "Confirme ou cancele acima..." : "Pergunte ou dê um comando..."}
            disabled={!!acaoPendente}
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: D.text, fontSize: 13, resize: "none", lineHeight: 1.5, maxHeight: 100 }}
          />
          <button onClick={() => { enviar(input); setInput(""); }}
            disabled={!input.trim() || isLoading || !!acaoPendente}
            style={{ width: 30, height: 30, borderRadius: 7, background: D.accent, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, alignSelf: "flex-end", opacity: !input.trim() || isLoading || !!acaoPendente ? 0.4 : 1 }}>
            <Send size={12} style={{ color: "#fff" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
