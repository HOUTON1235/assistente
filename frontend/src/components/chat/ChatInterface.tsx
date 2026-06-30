"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatInterface({ fullPage = false }: { fullPage?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Olá! Sou seu assistente administrativo. Posso ajudar com **finanças**, **estoque**, **clientes** e muito mais. Como posso ajudar hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const enviarMensagem = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/chat/", {
        mensagem: userMessage.content,
        conversa_id: conversaId,
      });

      const data = response.data;
      setConversaId(data.conversa_id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.resposta,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      let msg = "Desculpe, ocorreu um erro. Tente novamente.";

      if (status === 401) {
        msg = "Sessão expirada. Por favor, faça login novamente.";
        // Não redireciona automaticamente — deixa o usuário ver a mensagem
        localStorage.removeItem("access_token");
      } else if (status === 422) {
        msg = "Erro de validação na requisição.";
      } else if (!err?.response) {
        msg = "Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8000.";
      } else if (detail?.toLowerCase().includes("openai") || detail?.toLowerCase().includes("api_key")) {
        msg = "⚠️ Chave da OpenAI não configurada. Acesse **Configurações** para ativar a IA.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: msg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <Bot size={16} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium">Assistente IA</p>
          <p className="text-xs text-green-400">● Online</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                message.role === "assistant"
                  ? "bg-indigo-500/20"
                  : "bg-white/10"
              }`}
            >
              {message.role === "assistant" ? (
                <Bot size={14} className="text-indigo-400" />
              ) : (
                <User size={14} className="text-gray-300" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "assistant"
                  ? "bg-[#252525] text-gray-100"
                  : "bg-indigo-500 text-white"
              }`}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="bg-[#252525] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2e2e2e]">
        <div className="flex gap-2 bg-[#252525] rounded-xl px-3 py-2 border border-[#2e2e2e] focus-within:border-indigo-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo ou dê um comando..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none leading-relaxed"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={enviarMensagem}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors self-end"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
