"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { D } from "@/lib/design";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  largura?: string;
}

export default function Modal({ aberto, onFechar, titulo, children, largura = "max-w-md" }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onFechar]);

  if (!aberto) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onFechar} />
      <div className={`relative w-full ${largura}`} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${D.border}` }}>
          <h2 style={{ fontWeight: 600, fontSize: 15, color: D.text, margin: 0 }}>{titulo}</h2>
          <button onClick={onFechar}
            style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: D.muted }}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = D.surface2; e.currentTarget.style.color = D.text; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = D.muted; }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
