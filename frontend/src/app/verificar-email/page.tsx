"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { api } from "@/lib/api";

export default function VerificarEmailPage() {
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
    <main className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <Loader size={48} className="text-indigo-400 mx-auto mb-4 animate-spin" />
            <p className="text-white text-lg font-medium">Verificando seu email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h1 className="text-white text-xl font-bold mb-2">Email verificado!</h1>
            <p className="text-gray-400 mb-6">Sua conta está ativa. Bem-vindo ao Assistente IA.</p>
            <button onClick={() => router.push("/dashboard")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              Ir para o dashboard
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-white text-xl font-bold mb-2">Link inválido</h1>
            <p className="text-gray-400 mb-6">Este link expirou ou já foi usado.</p>
            <button onClick={() => router.push("/login")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
              Fazer login
            </button>
          </>
        )}
      </div>
    </main>
  );
}
