"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastTipo = "sucesso" | "erro" | "aviso" | "info";

export interface ToastData {
  id: string;
  mensagem: string;
  tipo: ToastTipo;
}

// Store global simples — sem Redux/Zustand
const listeners: Array<(toasts: ToastData[]) => void> = [];
let toastsState: ToastData[] = [];

function notificar() {
  listeners.forEach(fn => fn([...toastsState]));
}

export const toast = {
  sucesso: (mensagem: string) => adicionar(mensagem, "sucesso"),
  erro: (mensagem: string) => adicionar(mensagem, "erro"),
  aviso: (mensagem: string) => adicionar(mensagem, "aviso"),
  info: (mensagem: string) => adicionar(mensagem, "info"),
};

function adicionar(mensagem: string, tipo: ToastTipo) {
  const id = Math.random().toString(36).slice(2);
  toastsState = [...toastsState, { id, mensagem, tipo }];
  notificar();
  setTimeout(() => remover(id), 4000);
}

function remover(id: string) {
  toastsState = toastsState.filter(t => t.id !== id);
  notificar();
}

const icones: Record<ToastTipo, React.ReactNode> = {
  sucesso: <CheckCircle size={16} className="text-green-400 flex-shrink-0" />,
  erro: <XCircle size={16} className="text-red-400 flex-shrink-0" />,
  aviso: <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />,
  info: <Info size={16} className="text-blue-400 flex-shrink-0" />,
};

const estilos: Record<ToastTipo, string> = {
  sucesso: "bg-[#1a1a1a] border-green-500/30",
  erro: "bg-[#1a1a1a] border-red-500/30",
  aviso: "bg-[#1a1a1a] border-yellow-500/30",
  info: "bg-[#1a1a1a] border-blue-500/30",
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm text-white animate-in slide-in-from-right-5 fade-in ${estilos[t.tipo]}`}>
          {icones[t.tipo]}
          <span className="flex-1 leading-relaxed">{t.mensagem}</span>
          <button onClick={() => remover(t.id)}
            className="text-gray-500 hover:text-white transition-colors mt-0.5">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
