"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, MessageSquare, Users, Package,
  DollarSign, Settings, LogOut, BarChart2, CreditCard, Bot,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",                     label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/chat",                label: "Chat IA",     icon: MessageSquare },
  { href: "/dashboard/clientes",            label: "Clientes",    icon: Users },
  { href: "/dashboard/estoque",             label: "Estoque",     icon: Package },
  { href: "/dashboard/financeiro",          label: "Financeiro",  icon: DollarSign },
  { href: "/dashboard/relatorios",          label: "Relatórios",  icon: BarChart2 },
  { href: "/dashboard/configuracoes/planos",label: "Planos",      icon: CreditCard },
  { href: "/dashboard/configuracoes/whatsapp", label: "WhatsApp", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router  = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("plano");
    localStorage.removeItem("trial_dias");
    router.push("/login");
  };

  return (
    <aside
      className="w-56 flex flex-col flex-shrink-0"
      style={{ background: "#0a0f1e", borderRight: "1px solid #1f2937" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid #1f2937" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}
        >
          <Bot size={16} className="text-white" />
        </div>
        <span className="font-bold text-white tracking-wide text-sm">Orbita</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={
                isActive
                  ? {
                      background: "rgba(249,115,22,0.1)",
                      borderLeft: "2px solid #f97316",
                      paddingLeft: "10px",
                      color: "#f97316",
                      fontWeight: 500,
                    }
                  : { color: "#6b7280" }
              }
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid #1f2937" }}>
        <Link
          href="/dashboard/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "#6b7280" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#f1f5f9")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#6b7280")}
        >
          <Settings size={15} />
          Configurações
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "#6b7280" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "#f87171";
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "#6b7280";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );
}
