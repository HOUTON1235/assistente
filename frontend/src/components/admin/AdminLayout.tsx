"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Clock, LogOut, Shield } from "lucide-react";
import { clsx } from "clsx";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/trials", label: "Trials", icon: Clock },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <div className="p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
              <Shield size={15} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-xs text-gray-500">Assistente IA</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={clsx("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active ? "bg-red-500/10 text-red-400" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
                <Icon size={16} />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1a1a1a]">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
