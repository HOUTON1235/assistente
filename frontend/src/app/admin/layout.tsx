"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Shield } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    // Página de login não precisa de verificação
    if (pathname === "/admin/login") {
      setVerificado(true);
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    } else {
      setVerificado(true);
    }
  }, [pathname]);

  if (!verificado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center animate-pulse">
            <Shield size={24} className="text-red-400" />
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
