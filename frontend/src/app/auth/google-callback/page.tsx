"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session) {
      const token = (session as any).accessToken;

      if (token) {
        // Token do backend via next-auth callback
        localStorage.setItem("access_token", token);
        localStorage.setItem("plano", "trial");
        localStorage.setItem("trial_dias", "30");
        router.push("/dashboard");
      } else {
        // Fallback: chama o backend diretamente
        const googleId = (session as any).user?.sub || (session as any).token?.sub || "";
        api.post("/auth/google", {
          email: session.user?.email,
          nome: session.user?.name,
          google_id: googleId,
          foto: session.user?.image,
        }).then(res => {
          localStorage.setItem("access_token", res.data.access_token);
          localStorage.setItem("plano", res.data.plano);
          localStorage.setItem("trial_dias", String(res.data.trial_dias_restantes));
          router.push("/dashboard");
        }).catch(() => {
          router.push("/login?mensagem=Erro ao entrar com Google");
        });
      }
    }
  }, [session, status, router]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0f1e" }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
          <Bot size={28} className="text-white" />
        </div>
        <div className="flex gap-1.5 justify-center">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ background: "#f97316", animationDelay: `${d}ms` }} />
          ))}
        </div>
        <p className="text-sm mt-4" style={{ color: "#6b7280" }}>Entrando com Google...</p>
      </div>
    </main>
  );
}
