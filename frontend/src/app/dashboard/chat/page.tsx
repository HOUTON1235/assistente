"use client";

import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[#2e2e2e] px-6 py-4">
          <h1 className="text-lg font-semibold">Chat IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Converse com seu assistente administrativo</p>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatInterface fullPage />
        </div>
      </div>
    </div>
  );
}
