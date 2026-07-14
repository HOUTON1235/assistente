"use client";

import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";

const BORD = "#1f2937";

export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0f1e", color: "#f1f5f9" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORD}` }}>
          <h1 className="text-lg font-semibold text-white">Chat IA</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Converse com seu assistente administrativo
          </p>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatInterface fullPage />
        </div>
      </div>
    </div>
  );
}
