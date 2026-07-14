"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, AlertTriangle, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";

const SURF = "#111827";
const BORD = "#1f2937";
const BG   = "#0a0f1e";

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

function ConfirmacaoAcao({
  acao,
  onConfirmar,
  onCancelar,
}: {
  acao: AcaoPendente;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="rounded-xl p-4 my-2"
      style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}>
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle size={15} style={{ color: "#f97316", flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm text-white">{acao.resumo}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onConfirmar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
          <Check size={12} /> Confirmar
        </button>
        <button onClick={onCancelar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ background: "transparent", border: "1px solid #1f2937", color: "#6b7280" }}>
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}

export default function ChatInterface({ fullPage = false }: { fullPage?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get("/chat/historico");
        const conversas = res.data.conversas;
        if (conversas?.length > 0) {
          const ultima = conversas[0];
          setConversaId(ultima.id);
          const detRes = await api.get(`/chat/conversa/${ultima.id}`);
          const msgs: Message[] = detRes.data.mensagens.map((m: any) => ({
            id: m.id, role: m.role, content: m.conteudo, timestamp: new Date(m.criado_em),
          }));
          if (msgs.length > 0) { setMessages(msgs); return; }
        }
      } catch {}
      boasVindas();
    };
    carregar().finally(() => setCarregandoHistorico(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, acaoPendente]);

  const boasVindas = () => setMessages([{
    id: "bv", role: "assistant",
    content: "Olá! Sou a **Orbita**, sua assistente administrativa. Posso ajudar com **finanças**, **estoque**, **clientes** e muito mais. Como posso ajudar hoje?",
    timestamp: new Date(),
  }]);

  const novaConversa = () => { setConversaId(null); setAcaoPendente(null); boasVindas(); };

  const addMsg = (role: "user" | "assistant", content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content, timestamp: new Date() }]);
  };

  const enviar = async (mensagem: string, confirmado = false, acaoConf: AcaoPendente | null = null) => {
    if (!mensagem.trim() || isLoading) return;
    if (!confirmado) addMsg("user", mensagem);
    setIsLoading(true);
    try {
      const payload: any = { mensagem, conversa_id: conversaId };
      if (confirmado && acaoConf) {
        payload.confirmado = true;
        payload.acao_pendente = acaoConf;
      }
      const res = await api.post("/chat/", payload);
      setConversaId(res.data.conversa_id);
      if (res.data.requer_confirmacao && res.data.acao_pendente) {
        setAcaoPendente(res.data.acao_pendente);
      } else {
        setAcaoPendente(null);
      }
      addMsg("assistant", res.data.resposta);
    } catch (err: any) {
      const status = err?.response?.status;
      let texto = "Não consegui conectar ao servidor.";
      if (status === 401) texto = "Sessão expirada. Faça login novamente.";
      else if (status === 429) texto = "⚠️ Muitas mensagens. Aguarde um momento.";
      else if (err?.response?.data?.detail?.toLowerCase().includes("api_key"))
        texto = "⚠️ Chave do Groq não configurada. Adicione `GROQ_API_KEY` no `backend/.env`.";
      addMsg("assistant", texto);
    } finally { setIsLoading(false); }
  };

  const handleConfirmar = async () => {
    if (!acaoPendente) return;
    const acao = acaoPendente;
    setAcaoPendente(null);
    await enviar("Confirmado", true, acao);
  };

  const handleCancelar = () => {
    setAcaoPendente(null);
    addMsg("assistant", "Ação cancelada. Como mais posso ajudar?");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(input); setInput(""); }
  };

  const handleSend = () => { enviar(input); setInput(""); };

  return (
    <div className="flex flex-col h-full" style={{ background: SURF }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `1px solid ${BORD}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Orbita</p>
            <p className="text-xs" style={{ color: "#4ade80" }}>● Online</p>
          </div>
        </div>
        <button onClick={novaConversa} title="Nova conversa"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ color: "#6b7280" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6b7280"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {carregandoHistorico ? (
          <div className="flex justify-center pt-8">
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#f97316", animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        ) : messages.map(m => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: m.role === "assistant"
                  ? "linear-gradient(135deg, #1e40af, #f97316)"
                  : "rgba(255,255,255,0.08)",
              }}>
              {m.role === "assistant"
                ? <Bot size={13} className="text-white" />
                : <User size={13} style={{ color: "#9ca3af" }} />}
            </div>
            <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={m.role === "assistant"
                ? { background: BG, color: "#f1f5f9", border: `1px solid ${BORD}` }
                : { background: "linear-gradient(135deg, #1e40af, #f97316)", color: "#fff" }}>
              {m.role === "assistant"
                ? <ReactMarkdown>{m.content}</ReactMarkdown>
                : m.content}
            </div>
          </div>
        ))}

        {/* Confirmação de ação crítica */}
        {acaoPendente && (
          <ConfirmacaoAcao
            acao={acaoPendente}
            onConfirmar={handleConfirmar}
            onCancelar={handleCancelar}
          />
        )}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
              <Bot size={13} className="text-white" />
            </div>
            <div className="rounded-2xl px-3.5 py-3" style={{ background: BG, border: `1px solid ${BORD}` }}>
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "#f97316", animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${BORD}` }}>
        <div className="flex gap-2 rounded-xl px-3 py-2 transition-all"
          style={{ background: BG, border: `1px solid ${BORD}` }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={acaoPendente ? "Confirme ou cancele a ação acima..." : "Pergunte algo ou dê um comando..."}
            disabled={!!acaoPendente}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none leading-relaxed disabled:opacity-40"
            style={{ maxHeight: "120px" }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading || !!acaoPendente}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 self-end transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Send size={13} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-center mt-1.5" style={{ color: "#374151" }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
