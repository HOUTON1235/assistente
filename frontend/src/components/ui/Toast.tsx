"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

interface Toast {
  id: string;
  mensagem: string;
  tipo: "sucesso" | "erro" | "aviso";
}

let addToast: (t: Omit<Toast, "id">) => void = () => {};

export const toast = {
  sucesso: (mensagem: string) => addToast({ mensagem, tipo: "sucesso" }),
  erro:    (mensagem: string) => addToast({ mensagem, tipo: "erro" }),
  aviso:   (mensagem: string) => addToast({ mensagem, tipo: "aviso" }),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToast = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { ...t, id }]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    };
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(x => x.id !== id));

  const cores = {
    sucesso: { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)",  color: "#4ade80",  Icon: CheckCircle },
    erro:    { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", color: "#f87171",  Icon: XCircle },
    aviso:   { bg: "rgba(250,204,21,0.1)",  border: "rgba(250,204,21,0.3)",  color: "#facc15",  Icon: AlertTriangle },
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map(t => {
        const { bg, border, color, Icon } = cores[t.tipo];
        return (
          <div key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm max-w-xs"
            style={{ background: "#111827", border: `1px solid ${border}` }}>
            <Icon size={15} style={{ color, flexShrink: 0 }} />
            <span className="text-white flex-1">{t.mensagem}</span>
            <button onClick={() => remove(t.id)} style={{ color: "#6b7280" }}>
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
