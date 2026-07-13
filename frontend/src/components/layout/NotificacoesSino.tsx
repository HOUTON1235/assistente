"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, AlertTriangle, Package, Clock, CreditCard, Info } from "lucide-react";
import { api } from "@/lib/api";

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  criado_em: string;
}

const icones: Record<string, React.ReactNode> = {
  vencimento: <AlertTriangle size={14} className="text-orange-400" />,
  estoque_baixo: <Package size={14} className="text-yellow-400" />,
  trial: <Clock size={14} className="text-blue-400" />,
  pagamento: <CreditCard size={14} className="text-green-400" />,
  sistema: <Info size={14} className="text-gray-400" />,
};

export default function NotificacoesSino() {
  const [aberto, setAberto] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const carregar = async () => {
    try {
      const res = await api.get("/notificacoes/");
      setNotifs(res.data.notificacoes);
      setNaoLidas(res.data.total_nao_lidas);
    } catch {}
  };

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60000); // Atualiza a cada 1 min
    return () => clearInterval(interval);
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const marcarTodasLidas = async () => {
    await api.patch("/notificacoes/marcar-todas-lidas");
    setNaoLidas(0);
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const marcarLida = async (id: string) => {
    await api.patch(`/notificacoes/${id}/lida`);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setNaoLidas(prev => Math.max(0, prev - 1));
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setAberto(!aberto)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
        <Bell size={16} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-10 w-80 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e]">
            <p className="text-sm font-medium text-white">
              Notificações {naoLidas > 0 && <span className="text-xs text-gray-500">({naoLidas} novas)</span>}
            </p>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} title="Marcar todas como lidas"
                  className="text-gray-500 hover:text-indigo-400 transition-colors">
                  <CheckCheck size={15} />
                </button>
              )}
              <button onClick={() => setAberto(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : (
              notifs.map(n => (
                <div key={n.id}
                  onClick={() => { marcarLida(n.id); if (n.link) window.location.href = n.link; }}
                  className={`flex gap-3 px-4 py-3 border-b border-[#252525] cursor-pointer hover:bg-[#252525] transition-colors ${!n.lida ? "bg-indigo-500/5" : ""}`}>
                  <div className="mt-0.5 flex-shrink-0">{icones[n.tipo] || icones.sistema}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.lida ? "text-gray-400" : "text-white"}`}>{n.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.mensagem}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(n.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.lida && <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
