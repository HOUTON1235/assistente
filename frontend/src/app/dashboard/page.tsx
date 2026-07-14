"use client";

import ChatInterface from "@/components/chat/ChatInterface";
import DashboardCards from "@/components/dashboard/DashboardCards";
import Sidebar from "@/components/layout/Sidebar";
import TrialBanner from "@/components/layout/TrialBanner";
import NotificacoesSino from "@/components/layout/NotificacoesSino";

const BG   = "#0a0f1e";
const SURF = "#111827";
const BORD = "#1f2937";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG, color: "#f1f5f9" }}>
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* Painel central */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TrialBanner />

          <header className="px-6 py-4 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: `1px solid ${BORD}` }}>
            <div>
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <NotificacoesSino />
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <DashboardCards />
          </div>
        </div>

        {/* Chat lateral */}
        <div className="w-96 flex flex-col flex-shrink-0"
          style={{ borderLeft: `1px solid ${BORD}` }}>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
