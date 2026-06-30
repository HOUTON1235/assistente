"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[#2e2e2e] px-6 py-4">
          <h1 className="text-lg font-semibold">Configurações</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl space-y-6">
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-6">
              <h2 className="font-medium mb-4">Integração Groq (IA Gratuita)</h2>
              <p className="text-sm text-gray-400 mb-4">
                Para ativar o chat com IA, crie uma chave gratuita em{" "}
                <a href="https://console.groq.com" target="_blank" className="text-indigo-400 hover:underline">console.groq.com</a>
                {" "}e adicione no arquivo{" "}
                <code className="bg-[#252525] px-1.5 py-0.5 rounded text-indigo-400 text-xs">backend/.env</code>
              </p>
              <div className="bg-[#252525] rounded-lg p-3 font-mono text-xs text-gray-300 space-y-1">
                <div>GROQ_API_KEY=gsk_...sua-chave-aqui</div>
                <div className="text-gray-500">GROQ_MODEL=llama-3.3-70b-versatile</div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Após adicionar, reinicie o backend. O Groq é gratuito e mais rápido que a OpenAI.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-6">
              <h2 className="font-medium mb-4">Integração WhatsApp</h2>
              <p className="text-sm text-gray-400">
                Configure o WhatsApp Business API para receber comandos pelo WhatsApp.
                Disponível nos planos Professional e superiores.
              </p>
              <span className="inline-block mt-3 text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">Em breve</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
