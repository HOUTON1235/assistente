"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, CheckCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const PLANOS = [
  {
    id: "starter",
    nome: "Starter",
    valor: 79.90,
    descricao: "Ideal para MEI e autônomos",
    recursos: [
      "1 usuário",
      "500 transações/mês",
      "Chat IA ilimitado",
      "Gestão financeira",
      "Controle de estoque",
      "Gestão de clientes",
      "Suporte por email",
    ],
    destaque: false,
  },
  {
    id: "professional",
    nome: "Professional",
    valor: 179.90,
    descricao: "Para pequenas empresas em crescimento",
    recursos: [
      "5 usuários",
      "Transações ilimitadas",
      "Chat IA ilimitado",
      "Tudo do Starter",
      "Relatórios avançados",
      "Previsão financeira IA",
      "Suporte prioritário",
    ],
    destaque: true,
  },
  {
    id: "business",
    nome: "Business",
    valor: 349.90,
    descricao: "Para empresas com equipe maior",
    recursos: [
      "15 usuários",
      "Transações ilimitadas",
      "Tudo do Professional",
      "Integração WhatsApp",
      "API de acesso",
      "Gerente de conta",
      "SLA garantido",
    ],
    destaque: false,
  },
];

export default function PlanosPage() {
  const searchParams = useSearchParams();
  const [statusAtual, setStatusAtual] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get("/pagamentos/status").then(r => setStatusAtual(r.data)).catch(() => {});

    // Trata retorno do Mercado Pago
    const status = searchParams.get("status");
    const plano = searchParams.get("plano");
    if (status === "success") {
      toast.sucesso(`Pagamento aprovado! Plano ${plano || ""} ativado com sucesso.`);
      // Atualiza o status
      setTimeout(() => {
        api.get("/pagamentos/status").then(r => setStatusAtual(r.data)).catch(() => {});
      }, 2000);
    } else if (status === "failure") {
      toast.erro("Pagamento não aprovado. Tente novamente.");
    } else if (status === "pending") {
      toast.aviso("Pagamento pendente. Você receberá uma confirmação por email.");
    }
  }, []);

  const assinar = async (plano: string) => {
    setLoading(plano);
    try {
      const res = await api.post("/pagamentos/assinar", { plano });
      if (res.data.init_point) {
        // Redireciona para o checkout do Mercado Pago
        window.location.href = res.data.init_point;
      }
    } catch (err: any) {
      toast.erro(err.response?.data?.detail || "Erro ao processar pagamento");
    } finally { setLoading(null); }
  };

  const planoAtual = statusAtual?.plano;
  const ehTrial = planoAtual === "trial";
  const temPlanoAtivo = !ehTrial && planoAtual && statusAtual?.status === "ativa";

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="border-b border-[#2e2e2e] px-6 py-4">
          <h1 className="text-lg font-semibold">Planos</h1>
          {statusAtual && (
            <p className="text-sm text-gray-400 mt-0.5">
              Plano atual:{" "}
              <span className="text-indigo-400 font-medium capitalize">{planoAtual}</span>
              {statusAtual.trial_ativo && ` · ${statusAtual.trial_dias_restantes} dias de trial restantes`}
              {temPlanoAtivo && " · Ativo ✓"}
            </p>
          )}
        </header>

        <div className="p-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">
              {temPlanoAtivo ? "Seu plano" : "Escolha seu plano"}
            </h2>
            <p className="text-gray-400 mt-2">
              {temPlanoAtivo
                ? "Você já tem um plano ativo. Para fazer upgrade, escolha outro plano abaixo."
                : "Sem fidelidade. Cancele quando quiser."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANOS.map(plano => {
              const ePlanoAtual = planoAtual === plano.id;

              return (
                <div key={plano.id}
                  className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                    ePlanoAtual
                      ? "border-green-500/40 bg-green-500/5"
                      : plano.destaque
                      ? "border-indigo-500 bg-indigo-500/5"
                      : "border-[#2e2e2e] bg-[#1a1a1a]"
                  }`}>

                  {/* Badge plano atual */}
                  {ePlanoAtual && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={11} /> Seu plano atual
                      </span>
                    </div>
                  )}

                  {/* Badge mais popular */}
                  {plano.destaque && !ePlanoAtual && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap size={11} /> Mais popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="font-bold text-lg">{plano.nome}</h3>
                    <p className="text-gray-500 text-sm mt-0.5">{plano.descricao}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        R$ {plano.valor.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-gray-500 text-sm">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plano.recursos.map(r => (
                      <li key={r} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check size={14} className={ePlanoAtual ? "text-green-400" : "text-green-400"} />
                        {r}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !ePlanoAtual && assinar(plano.id)}
                    disabled={!!loading || ePlanoAtual}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      ePlanoAtual
                        ? "bg-green-500/10 text-green-400 cursor-default"
                        : plano.destaque
                        ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                        : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                    } disabled:opacity-60`}>
                    {loading === plano.id
                      ? "Redirecionando..."
                      : ePlanoAtual
                      ? "✓ Plano atual"
                      : temPlanoAtivo
                      ? "Fazer upgrade"
                      : "Assinar agora"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">
            Pagamento seguro via Mercado Pago · Pix, cartão de crédito e débito
          </p>
        </div>
      </div>
    </div>
  );
}
