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

const SURF = "#111827";
const BORD = "#1f2937";

const icones: Record<string, React.ReactNode> = {
  vencimento:   <AlertTriangle size={13} style={{ color: "#f97316" }} />,
  estoque_baixo:<Package      size={13} style={{ color: "#facc15" }} />,
  trial:        <Clock        size={13} style={{ color: "#60a5fa" }} />,
  pagamento:    <CreditCard   size={13} style={{ color: "#4ade80" }} />,
  sistema:      <Info         size={13} style={{ color: "#9ca3af" }} />,
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
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, []);

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
      <button
        onClick={() => setAberto(!aberto)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{ color: "#6b7280" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6b7280"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        <Bell size={16} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
            style={{ background: "#f97316" }}>
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-10 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: SURF, border: `1px solid ${BORD}` }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${BORD}` }}>
            <p className="text-sm font-medium text-white">
              Notificações{" "}
              {naoLidas > 0 && <span className="text-xs" style={{ color: "#6b7280" }}>({naoLidas} novas)</span>}
            </p>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} title="Marcar todas como lidas"
                  className="transition-colors"
                  style={{ color: "#6b7280" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f97316"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
                  <CheckCheck size={15} />
                </button>
              )}
              <button onClick={() => setAberto(false)}
                style={{ color: "#6b7280" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f1f5f9"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "#6b7280" }}>
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : (
              notifs.map(n => (
                <div key={n.id}
                  onClick={() => { marcarLida(n.id); if (n.link) window.location.href = n.link; }}
                  className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: `1px solid ${BORD}`,
                    background: !n.lida ? "rgba(249,115,22,0.04)" : "transparent",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = BORD)}
                  onMouseLeave={e => (e.currentTarget.style.background = !n.lida ? "rgba(249,115,22,0.04)" : "transparent")}>
                  <div className="mt-0.5 flex-shrink-0">{icones[n.tipo] || icones.sistema}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: n.lida ? "#6b7280" : "#f1f5f9" }}>
                      {n.titulo}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9ca3af" }}>{n.mensagem}</p>
                    <p className="text-xs mt-1" style={{ color: "#4b5563" }}>
                      {new Date(n.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.lida && (
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: "#f97316" }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
