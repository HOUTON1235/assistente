"use client";

import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { D } from "@/lib/design";

export default function ChatPage() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: D.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          <h1 style={{ fontSize: 14, fontWeight: 600, color: D.text, margin: 0 }}>Chat IA</h1>
        </header>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <ChatInterface fullPage />
        </div>
      </div>
    </div>
  );
}
