"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export default function TrialBanner() {
  const [dias, setDias] = useState<number | null>(null);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem("trial_dias");
    if (d) setDias(parseInt(d));
  }, []);

  if (fechado || dias === null || dias > 14) return null;

  const cor = dias <= 3 ? "bg-red-500/15 border-red-500/30 text-red-300"
    : dias <= 7 ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
    : "bg-yellow-500/15 border-yellow-500/30 text-yellow-300";

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-b text-sm ${cor}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} />
        <span>
          {dias === 0
            ? "Seu trial expirou."
            : `Seu trial expira em ${dias} dia${dias !== 1 ? "s" : ""}.`}
          {" "}
          <Link href="/dashboard/configuracoes/planos" className="underline font-medium hover:opacity-80">
            Ver planos
          </Link>
        </span>
      </div>
      <button onClick={() => setFechado(true)} className="opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
