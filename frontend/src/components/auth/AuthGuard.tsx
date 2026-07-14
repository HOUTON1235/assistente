"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
    } else {
      setVerificado(true);
    }
  }, [router]);

  if (!verificado) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0f1e" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            <Bot size={24} className="text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "#f97316", animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
