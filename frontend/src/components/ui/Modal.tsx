"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  largura?: string;
}

export default function Modal({ aberto, onFechar, titulo, children, largura = "max-w-md" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onFechar} />
      <div className={`relative w-full ${largura} rounded-2xl shadow-2xl`}
        style={{ background: "#111827", border: "1px solid #1f2937" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #1f2937" }}>
          <h2 className="font-semibold text-white">{titulo}</h2>
          <button onClick={onFechar}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6b7280"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <X size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
