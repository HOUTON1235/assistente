"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader, Bot } from "lucide-react";
import { api } from "@/lib/api";

function VerificarEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    api.post("/auth/verificar-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="text-center max-w-sm">
      {status === "loading" && (
        <>
          <div className="flex justify-center mb-4">
            <div className="flex gap-1.5">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: "#f97316", animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
          <p className="text-white text-lg font-medium">Verificando seu email...</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#4ade80" }} />
          <h1 className="text-white text-xl font-bold mb-2">Email verificado!</h1>
          <p className="mb-6 text-sm" style={{ color: "#6b7280" }}>Sua conta está ativa. Bem-vindo à Orbita!</p>
          <button onClick={() => router.push("/dashboard")}
            className="text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            Ir para o dashboard
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle size={48} className="mx-auto mb-4" style={{ color: "#f87171" }} />
          <h1 className="text-white text-xl font-bold mb-2">Link inválido</h1>
          <p className="mb-6 text-sm" style={{ color: "#6b7280" }}>Este link expirou ou já foi usado.</p>
          <button onClick={() => router.push("/login")}
            className="text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
            Fazer login
          </button>
        </>
      )}
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0f1e" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#1e40af", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#f97316", filter: "blur(120px)" }} />
      </div>
      <Suspense fallback={null}>
        <VerificarEmailForm />
      </Suspense>
    </main>
  );
}
