"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { D } from "@/lib/design";

export default function TrialBanner() {
  const [dias, setDias] = useState<number | null>(null);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem("trial_dias");
    if (d) setDias(parseInt(d));
  }, []);

  if (fechado || dias === null || dias > 14) return null;

  const cor = dias <= 3 ? "#ef4444" : dias <= 7 ? D.accent : D.warning;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", borderBottom: `1px solid ${D.border}`, background: `${cor}0d`, flexShrink: 0 }}>
      <p style={{ fontSize: 12, color: cor, margin: 0 }}>
        {dias === 0 ? "Seu trial expirou." : `Trial expira em ${dias} dia${dias !== 1 ? "s" : ""}.`}
        {" "}<Link href="/dashboard/configuracoes/planos" style={{ color: cor, fontWeight: 600, textDecoration: "underline" }}>Ver planos →</Link>
      </p>
      <button onClick={() => setFechado(true)} style={{ background: "none", border: "none", cursor: "pointer", color: cor, padding: 4 }}>
        <X size={12} />
      </button>
    </div>
  );
}
