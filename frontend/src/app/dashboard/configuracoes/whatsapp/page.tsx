"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Wifi, WifiOff, QrCode, Trash2, RefreshCw, CheckCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import Image from "next/image";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

export default function WhatsappPage() {
  const [status, setStatus] = useState<any>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [criando, setCriando] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const verificarStatus = async () => {
    try {
      const res = await api.get("/whatsapp/instancia/status");
      setStatus(res.data);
      if (res.data.conectado) {
        setQrcode(null);
        pararPolling();
      }
    } catch {}
  };

  useEffect(() => {
    verificarStatus();
    return () => pararPolling();
  }, []);

  const iniciarPolling = () => {
    pararPolling();
    pollingRef.current = setInterval(verificarStatus, 4000);
  };

  const pararPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const criarInstancia = async () => {
    setCriando(true);
    try {
      await api.post("/whatsapp/instancia/criar");
      toast.sucesso("Instância criada! Carregando QR Code...");
      await carregarQrCode();
    } catch (err: any) {
      toast.erro(err.response?.data?.detail || "Erro ao criar instância");
    } finally {
      setCriando(false);
    }
  };

  const carregarQrCode = async () => {
    setLoading(true);
    try {
      const res = await api.get("/whatsapp/instancia/qrcode");
      const base64 = res.data?.base64 || res.data?.qrcode?.base64;
      if (base64) {
        setQrcode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
        iniciarPolling();
      } else {
        toast.aviso("QR Code não disponível ainda. Aguarde alguns segundos e tente novamente.");
      }
    } catch (err: any) {
      toast.erro("Erro ao carregar QR Code");
    } finally {
      setLoading(false);
    }
  };

  const desconectar = async () => {
    if (!confirm("Deseja desconectar o WhatsApp?")) return;
    try {
      await api.delete("/whatsapp/instancia/desconectar");
      setStatus(null);
      setQrcode(null);
      pararPolling();
      toast.sucesso("WhatsApp desconectado");
    } catch (err: any) {
      toast.erro(err.response?.data?.detail || "Erro ao desconectar");
    }
  };

  const temInstancia = status?.instancia !== null && status?.instancia !== undefined;
  const conectado    = status?.conectado === true;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORD}` }}>
          <h1 className="text-lg font-semibold text-white">WhatsApp</h1>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            Receba e responda mensagens direto no WhatsApp
          </p>
        </header>

        <div className="p-6 max-w-xl space-y-5">
          {/* Status card */}
          <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: conectado ? "rgba(74,222,128,0.1)" : "rgba(107,114,128,0.1)" }}>
                  <MessageCircle size={18} style={{ color: conectado ? "#4ade80" : "#6b7280" }} />
                </div>
                <div>
                  <p className="font-medium text-white">Conexão WhatsApp</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {conectado
                      ? <><Wifi size={12} style={{ color: "#4ade80" }} /><span className="text-xs" style={{ color: "#4ade80" }}>Conectado</span></>
                      : <><WifiOff size={12} style={{ color: "#6b7280" }} /><span className="text-xs" style={{ color: "#6b7280" }}>Desconectado</span></>
                    }
                  </div>
                </div>
              </div>

              {temInstancia && (
                <button onClick={verificarStatus}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: "#6b7280" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f1f5f9"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6b7280"}>
                  <RefreshCw size={14} />
                </button>
              )}
            </div>

            {/* Número conectado */}
            {conectado && status?.numero && (
              <div className="rounded-lg px-4 py-3 mb-4"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: "#4ade80" }} />
                  <p className="text-sm" style={{ color: "#4ade80" }}>
                    +{status.numero} conectado
                  </p>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              {!temInstancia ? (
                <button onClick={criarInstancia} disabled={criando}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                  <MessageCircle size={15} />
                  {criando ? "Criando..." : "Conectar WhatsApp"}
                </button>
              ) : conectado ? (
                <button onClick={desconectar}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)"}>
                  <Trash2 size={14} /> Desconectar
                </button>
              ) : (
                <>
                  <button onClick={carregarQrCode} disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #1e40af, #f97316)" }}>
                    <QrCode size={15} />
                    {loading ? "Carregando..." : "Ver QR Code"}
                  </button>
                  <button onClick={desconectar}
                    className="px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ background: "transparent", border: `1px solid ${BORD}`, color: "#6b7280" }}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* QR Code */}
          {qrcode && !conectado && (
            <div className="rounded-xl p-5 text-center" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-1">Escaneie o QR Code</p>
              <p className="text-xs mb-5" style={{ color: "#6b7280" }}>
                Abra o WhatsApp → Menu → Dispositivos Conectados → Conectar dispositivo
              </p>
              <div className="inline-block p-3 rounded-xl bg-white">
                <img src={qrcode} alt="QR Code WhatsApp" width={220} height={220} />
              </div>
              <p className="text-xs mt-4 flex items-center justify-center gap-1.5"
                style={{ color: "#6b7280" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "#f97316" }} />
                Aguardando conexão...
              </p>
            </div>
          )}

          {/* Como funciona */}
          {!temInstancia && (
            <div className="rounded-xl p-5" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <p className="text-sm font-medium text-white mb-3">Como funciona</p>
              <ol className="space-y-2.5 text-sm" style={{ color: "#9ca3af" }}>
                {[
                  "Clique em Conectar WhatsApp",
                  "Escaneie o QR Code com seu celular",
                  "Seus clientes enviam mensagens para o número conectado",
                  "A Orbita responde automaticamente",
                  "Você gerencia tudo pelo dashboard",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-medium"
                      style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
