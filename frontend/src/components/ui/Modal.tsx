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
  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onFechar} />

      {/* Modal */}
      <div className={`relative w-full ${largura} bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e2e]">
          <h2 className="font-semibold text-white">{titulo}</h2>
          <button onClick={onFechar}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
