"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageSquare, Users, Package,
  DollarSign, Settings, LogOut, BarChart2, CreditCard,
} from "lucide-react";
import { clsx } from "clsx";
import Logo from "@/components/brand/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "Chat IA", icon: MessageSquare },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/estoque", label: "Estoque", icon: Package },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart2 },
  { href: "/dashboard/configuracoes/planos", label: "Planos", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("plano");
    localStorage.removeItem("trial_dias");
    router.push("/login");
  };

  return (
    <aside className="w-56 flex flex-col flex-shrink-0"
      style={{ background: "#0d1423", borderRight: "1px solid #1f2937" }}>

      {/* Logo */}
      <div className="p-5" style={{ borderBottom: "1px solid #1f2937" }}>
        <Logo size="md" />
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isActive ? "text-white font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              style={isActive ? {
                background: "linear-gradient(90deg, rgba(30,64,175,0.2), rgba(30,64,175,0.05))",
                borderLeft: "2px solid #f97316",
                paddingLeft: "10px",
              } : {}}>
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid #1f2937" }}>
        <Link href="/dashboard/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
          <Settings size={15} />
          Configurações
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );
}
