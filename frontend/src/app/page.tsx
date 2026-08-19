import Link from "next/link";
import { D } from "@/lib/design";

const features = [
  { icon: "⌘", label: "Chat com IA", desc: "Converse em linguagem natural. A Orbita executa." },
  { icon: "◈", label: "Financeiro",  desc: "Receitas, despesas e fluxo de caixa em tempo real." },
  { icon: "▦", label: "Estoque",     desc: "Controle entradas, saídas e alertas de reposição." },
  { icon: "◎", label: "Clientes",    desc: "CRM integrado com histórico e pendências." },
  { icon: "⊞", label: "Relatórios",  desc: "DRE e análises geradas automaticamente." },
  { icon: "◉", label: "WhatsApp",    desc: "Atendimento automático adaptado ao seu negócio." },
];

export default function Home() {
  return (
    <main style={{ background: D.bg, color: D.text, minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${D.border}`, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>Orbita</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/login"
              style={{ color: D.muted, fontSize: 14, padding: "6px 14px", borderRadius: 8, textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e: any) => e.currentTarget.style.color = D.text}
              onMouseLeave={(e: any) => e.currentTarget.style.color = D.muted}>
              Entrar
            </Link>
            <Link href="/register"
              style={{ background: D.text, color: D.bg, fontSize: 14, fontWeight: 600, padding: "7px 16px", borderRadius: 8, textDecoration: "none" }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, border: `1px solid ${D.border}`, marginBottom: 32, fontSize: 12, color: D.muted }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.success, display: "inline-block" }} />
          30 dias grátis · sem cartão
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.05, margin: "0 0 20px 0", color: D.text }}>
          O operador inteligente<br />
          <span style={{ color: D.accent }}>da sua empresa</span>
        </h1>

        <p style={{ fontSize: 18, color: D.muted, lineHeight: 1.6, margin: "0 auto 48px", maxWidth: 480 }}>
          Fale com a Orbita e ela gerencia. Finanças, estoque, clientes e WhatsApp — tudo em um só lugar.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register"
            style={{ background: D.accent, color: "#fff", fontWeight: 600, fontSize: 15, padding: "11px 28px", borderRadius: 10, textDecoration: "none" }}>
            Criar conta grátis →
          </Link>
          <Link href="/login"
            style={{ background: D.surface, color: D.text2, fontSize: 15, padding: "11px 28px", borderRadius: 10, border: `1px solid ${D.border}`, textDecoration: "none" }}>
            Fazer login
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${D.border}, transparent)` }} />
      </div>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 120px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: D.muted, textTransform: "uppercase", textAlign: "center", marginBottom: 48 }}>
          Tudo que sua empresa precisa
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1, border: `1px solid ${D.border}`, borderRadius: 14, overflow: "hidden" }}>
          {features.map((f, i) => (
            <div key={f.label}
              style={{ padding: "32px 28px", borderRight: i % 2 === 0 ? `1px solid ${D.border}` : "none", borderBottom: i < 4 ? `1px solid ${D.border}` : "none" }}
              onMouseEnter={(e: any) => e.currentTarget.style.background = D.surface}
              onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontSize: 24, marginBottom: 14, color: D.accent }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px", color: D.text }}>{f.label}</h3>
              <p style={{ fontSize: 13, color: D.muted, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: `1px solid ${D.border}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.8px", margin: "0 0 16px", color: D.text }}>
            Pronto para começar?
          </h2>
          <p style={{ color: D.muted, fontSize: 15, margin: "0 0 32px" }}>
            30 dias gratuitos. Sem cartão de crédito.
          </p>
          <Link href="/register"
            style={{ display: "inline-block", background: D.text, color: D.bg, fontWeight: 700, fontSize: 15, padding: "12px 32px", borderRadius: 10, textDecoration: "none" }}>
            Começar agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${D.border}`, padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: D.muted2, margin: 0 }}>
          © 2026 Orbita · Criado por <span style={{ color: D.muted }}>Marcelo Rian (Houton)</span>
        </p>
      </footer>
    </main>
  );
}
