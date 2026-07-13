"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import DashboardCards from "@/components/dashboard/DashboardCards";
import Sidebar from "@/components/layout/Sidebar";
import TrialBanner from "@/components/layout/TrialBanner";
import NotificacoesSino from "@/components/layout/NotificacoesSino";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel central */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TrialBanner />
          <header className="border-b border-[#2e2e2e] px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              <NotificacoesSino />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <DashboardCards />
          </div>
        </div>

        {/* Chat lateral */}
        <div className="w-96 border-l border-[#2e2e2e] flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
