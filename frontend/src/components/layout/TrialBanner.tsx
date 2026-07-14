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

  const cor = dias <= 3
    ? { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", text: "#f87171" }
    : dias <= 7
    ? { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", text: "#f97316" }
    : { bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.25)", text: "#facc15" };

  return (
    <div className="flex items-center justify-between px-5 py-2.5 text-sm flex-shrink-0"
      style={{ background: cor.bg, borderBottom: `1px solid ${cor.border}`, color: cor.text }}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} />
        <span>
          {dias === 0 ? "Seu trial expirou." : `Trial expira em ${dias} dia${dias !== 1 ? "s" : ""}.`}
          {" "}
          <Link href="/dashboard/configuracoes/planos"
            className="underline font-medium hover:opacity-80">
            Ver planos →
          </Link>
        </span>
      </div>
      <button onClick={() => setFechado(true)}
        className="opacity-60 hover:opacity-100 transition-opacity ml-4">
        <X size={14} />
      </button>
    </div>
  );
}
