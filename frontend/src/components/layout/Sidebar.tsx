"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, MessageSquare, Users, Package,
  DollarSign, Settings, LogOut, BarChart2, CreditCard, Phone,
} from "lucide-react";
import { D } from "@/lib/design";

const nav = [
  { href: "/dashboard",                      label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/chat",                  label: "Chat IA",    icon: MessageSquare },
  { href: "/dashboard/whatsapp",              label: "WhatsApp",   icon: Phone },
  { href: "/dashboard/clientes",              label: "Clientes",   icon: Users },
  { href: "/dashboard/estoque",               label: "Estoque",    icon: Package },
  { href: "/dashboard/financeiro",            label: "Financeiro", icon: DollarSign },
  { href: "/dashboard/relatorios",            label: "Relatórios", icon: BarChart2 },
  { href: "/dashboard/configuracoes/planos",  label: "Planos",     icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("plano");
    localStorage.removeItem("trial_dias");
    router.push("/login");
  };

  return (
    <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", background: D.bg, borderRight: `1px solid ${D.border}` }}>
      {/* Logo */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: D.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>O</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: D.text }}>Orbita</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {nav.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
                borderRadius: 8, textDecoration: "none", marginBottom: 1, fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? D.text : D.muted,
                background: active ? D.surface : "transparent",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e: any) => { if (!active) { e.currentTarget.style.color = D.text2; e.currentTarget.style.background = D.surface; } }}
              onMouseLeave={(e: any) => { if (!active) { e.currentTarget.style.color = D.muted; e.currentTarget.style.background = "transparent"; } }}>
              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "8px 8px", borderTop: `1px solid ${D.border}` }}>
        <Link href="/dashboard/configuracoes"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 8, textDecoration: "none", color: D.muted, fontSize: 13, marginBottom: 1 }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = D.text2; e.currentTarget.style.background = D.surface; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = D.muted; e.currentTarget.style.background = "transparent"; }}>
          <Settings size={14} strokeWidth={1.5} /> Configurações
        </Link>
        <button onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 8, background: "transparent", border: "none", color: D.muted, fontSize: 13, cursor: "pointer", textAlign: "left" }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = D.muted; e.currentTarget.style.background = "transparent"; }}>
          <LogOut size={14} strokeWidth={1.5} /> Sair
        </button>
      </div>
    </aside>
  );
}
