"use client";

import Sidebar from "@/components/layout/Sidebar";
import DashboardCards from "@/components/dashboard/DashboardCards";
import ChatInterface from "@/components/chat/ChatInterface";
import TrialBanner from "@/components/layout/TrialBanner";
import NotificacoesSino from "@/components/layout/NotificacoesSino";
import { D } from "@/lib/design";

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: D.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TrialBanner />
          <header style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 600, color: D.text, margin: 0 }}>Dashboard</h1>
            </div>
            <NotificacoesSino />
          </header>
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <DashboardCards />
          </div>
        </div>
        {/* Chat */}
        <div style={{ width: 360, borderLeft: `1px solid ${D.border}`, flexShrink: 0 }}>
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
