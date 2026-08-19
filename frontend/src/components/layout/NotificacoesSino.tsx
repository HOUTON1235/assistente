"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { D } from "@/lib/design";

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  criado_em: string;
}

export default function NotificacoesSino() {
  const [aberto, setAberto]     = useState(false);
  const [notifs, setNotifs]     = useState<Notif[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const carregar = async () => {
    try {
      const r = await api.get("/notificacoes/");
      setNotifs(r.data.notificacoes);
      setNaoLidas(r.data.total_nao_lidas);
    } catch {}
  };

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const marcarTodas = async () => {
    await api.patch("/notificacoes/marcar-todas-lidas");
    setNaoLidas(0);
    setNotifs(p => p.map(n => ({ ...n, lida: true })));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setAberto(!aberto)}
        style={{ position: "relative", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: D.muted }}
        onMouseEnter={(e: any) => { e.currentTarget.style.background = D.surface; e.currentTarget.style.color = D.text; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = D.muted; }}>
        <Bell size={15} strokeWidth={1.5} />
        {naoLidas > 0 && (
          <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: D.accent }} />
        )}
      </button>

      {aberto && (
        <div style={{ position: "absolute", right: 0, top: 40, width: 320, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.7)", overflow: "hidden", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${D.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: 0 }}>Notificações</p>
            <div style={{ display: "flex", gap: 4 }}>
              {naoLidas > 0 && (
                <button onClick={marcarTodas} style={{ background: "none", border: "none", cursor: "pointer", color: D.muted, padding: 4 }}>
                  <CheckCheck size={13} />
                </button>
              )}
              <button onClick={() => setAberto(false)} style={{ background: "none", border: "none", cursor: "pointer", color: D.muted, padding: 4 }}>
                <X size={13} />
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <p style={{ fontSize: 13, color: D.muted, textAlign: "center", padding: "28px 16px", margin: 0 }}>Nenhuma notificação</p>
            ) : (
              notifs.map(n => (
                <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, background: !n.lida ? `${D.accent}08` : "transparent", cursor: "pointer" }}
                  onMouseEnter={(e: any) => e.currentTarget.style.background = D.surface2}
                  onMouseLeave={(e: any) => e.currentTarget.style.background = !n.lida ? `${D.accent}08` : "transparent"}>
                  <p style={{ fontSize: 13, fontWeight: n.lida ? 400 : 500, color: n.lida ? D.muted : D.text, margin: "0 0 2px" }}>{n.titulo}</p>
                  <p style={{ fontSize: 12, color: D.muted, margin: 0, lineHeight: 1.5 }}>{n.mensagem}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
