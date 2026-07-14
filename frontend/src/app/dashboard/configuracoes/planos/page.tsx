"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, CheckCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

const PLANOS = [
  {
    id: "starter", nome: "Starter", valor: 79.90,
    descricao: "Ideal para MEI e autônomos",
    recursos: ["1 usuário","500 transações/mês","Chat IA ilimitado","Gestão financeira","Controle de estoque","Gestão de clientes","Suporte por email"],
    destaque: false,
  },
  {
    id: "professional", nome: "Professional", valor: 179.90,
    descricao: "Para pequenas empresas em crescimento",
    recursos: ["5 usuários","Transações ilimitadas","Chat IA ilimitado","Tudo do Starter","Relatórios avançados","Previsão financeira IA","Suporte prioritário"],
    destaque: true,
  },
  {
    id: "business", nome: "Business", valor: 349.90,
    descricao: "Para empresas com equipe maior",
    recursos: ["15 usuários","Transações ilimitadas","Tudo do Professional","Integração WhatsApp","API de acesso","Gerente de conta","SLA garantido"],
    destaque: false,
  },
];

export default function PlanosPage() {
  const searchParams = useSearchParams();
  const [statusAtual, setStatusAtual] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get("/pagamentos/status").then(r => setStatusAtual(r.data)).catch(() => {});
    const status = searchParams.get("status");
    const plano  = searchParams.get("plano");
    if (status === "success") toast.sucesso(`Plano ${plano || ""} ativado!`);
    else if (status === "failure") toast.erro("Pagamento não aprovado. Tente novamente.");
    else if (status === "pending") toast.aviso("Pagamento pendente. Confirmaremos por email.");
  }, []);

  const assinar = async (plano: string) => {
    setLoading(plano);
    try {
      const res = await api.post("/pagamentos/assinar", { plano });
      if (res.data.init_point) window.location.href = res.data.init_point;
    } catch (err: any) {
      toast.erro(err.response?.data?.detail || "Erro ao processar pagamento");
    } finally { setLoading(null); }
  };

  const planoAtual  = statusAtual?.plano;
  const ehTrial     = planoAtual === "trial";
  const temAtivo    = !ehTrial && planoAtual && statusAtual?.status === "ativa";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORD}` }}>
          <h1 className="text-lg font-semibold text-white">Planos</h1>
          {statusAtual && (
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              Plano atual:{" "}
              <span className="capitalize font-medium" style={{ color: "#f97316" }}>{planoAtual}</span>
              {statusAtual.trial_ativo && ` · ${statusAtual.trial_dias_restantes} dias restantes`}
              {temAtivo && " · Ativo ✓"}
            </p>
          )}
        </header>

        <div className="p-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">
              {temAtivo ? "Seu plano" : "Escolha seu plano"}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#6b7280" }}>
              {temAtivo ? "Para upgrade, escolha outro plano abaixo." : "Sem fidelidade. Cancele quando quiser."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANOS.map(plano => {
              const ePlanoAtual = planoAtual === plano.id;
              return (
                <div key={plano.id} className="relative rounded-2xl p-6 flex flex-col transition-all"
                  style={{
                    background: SURF,
                    border: `1px solid ${ePlanoAtual ? "rgba(74,222,128,0.4)" : plano.destaque ? "#f97316" : BORD}`,
                    boxShadow: plano.destaque && !ePlanoAtual ? "0 0 30px rgba(249,115,22,0.1)" : "none",
                  }}>

                  {ePlanoAtual && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium"
                        style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
                        <CheckCircle size={11} /> Plano atual
                      </span>
                    </div>
                  )}

                  {plano.destaque && !ePlanoAtual && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium text-white"
                        style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                        <Zap size={11} /> Mais popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="font-bold text-lg text-white">{plano.nome}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{plano.descricao}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">
                        R$ {plano.valor.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-sm" style={{ color: "#6b7280" }}>/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plano.recursos.map(r => (
                      <li key={r} className="flex items-center gap-2 text-sm" style={{ color: "#d1d5db" }}>
                        <Check size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
                        {r}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !ePlanoAtual && assinar(plano.id)}
                    disabled={!!loading || ePlanoAtual}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                    style={ePlanoAtual
                      ? { background: "rgba(74,222,128,0.1)", color: "#4ade80", cursor: "default" }
                      : { background: "linear-gradient(135deg, #1e40af, #f97316)", color: "#fff" }}>
                    {loading === plano.id ? "Redirecionando..." : ePlanoAtual ? "✓ Plano atual" : temAtivo ? "Fazer upgrade" : "Assinar agora"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs mt-8" style={{ color: "#4b5563" }}>
            Pagamento seguro via Mercado Pago · Pix, cartão de crédito e débito
          </p>
        </div>
      </div>
    </div>
  );
}
