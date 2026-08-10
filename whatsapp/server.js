/**
 * Orbita WhatsApp Server — Baileys + Express
 * Porta: 8080
 */

import express from "express";
import { existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import QRCode from "qrcode";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import pino from "pino";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(__dirname, "sessions");
const PORT         = process.env.PORT || 8080;
const BACKEND_WEBHOOK = process.env.BACKEND_WEBHOOK || "http://localhost:8000/api/v1/whatsapp/webhook";

if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });

const app    = express();
const logger = pino({ level: "silent" });
app.use(express.json());

// ── Estado global ─────────────────────────────────────────────────────────────
const state = {
  socket: null,
  qrBase64: null,
  connected: false,
  numero: null,
  instancia: null,
  reconectando: false,
};

// Deduplicação de mensagens — evita processar a mesma mensagem duas vezes
const _processadas = new Set();

// ── Baileys ───────────────────────────────────────────────────────────────────
async function iniciarSessao(nomeInstancia) {
  const sessaoDir = path.join(SESSIONS_DIR, nomeInstancia);
  if (!existsSync(sessaoDir)) mkdirSync(sessaoDir, { recursive: true });

  const { state: authState, saveCreds } = await useMultiFileAuthState(sessaoDir);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`[WA] Iniciando sessão: ${nomeInstancia} (Baileys v${version.join(".")})`);

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger),
    },
    browser: ["Orbita", "Chrome", "120.0.0.0"],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: "" }),
    keepAliveIntervalMs: 25000,    // ping a cada 25s para manter conexão
    retryRequestDelayMs: 2000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    emitOwnEvents: false,
  });

  state.socket   = sock;
  state.instancia = nomeInstancia;

  // Conexão
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.qrBase64   = await QRCode.toDataURL(qr);
      state.connected  = false;
      console.log("[WA] QR Code gerado");
      notificar({ event: "QRCODE_UPDATED", qr: state.qrBase64, instance: nomeInstancia });
    }

    if (connection === "open") {
      state.connected  = true;
      state.qrBase64   = null;
      state.reconectando = false;
      state.numero     = sock.user?.id?.split(":")[0] || null;
      console.log(`[WA] ✅ Conectado! Número: ${state.numero}`);
      notificar({ event: "CONNECTION_UPDATE", status: "open", numero: state.numero, instancia: nomeInstancia, instance: nomeInstancia });
    }

    if (connection === "close") {
      state.connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;

      // 408 = timeout/sessão duplicada → limpa sessão e pede novo QR
      // 401 = loggedOut → não reconecta
      // outros → tenta reconectar
      const loggedOut = code === DisconnectReason.loggedOut || code === 401;
      const sessionConflict = code === 408 || code === 440 || code === 515;

      console.log(`[WA] Desconectado. Código: ${code}. loggedOut: ${loggedOut}`);
      notificar({ event: "CONNECTION_UPDATE", status: "close", statusCode: code, instancia: nomeInstancia, instance: nomeInstancia });

      if (loggedOut) {
        console.log("[WA] Sessão encerrada. Escaneia o QR novamente.");
        // Deleta credenciais para forçar novo QR
        const sessaoDir = path.join(SESSIONS_DIR, nomeInstancia);
        try {
          const { rmSync } = await import("fs");
          rmSync(sessaoDir, { recursive: true, force: true });
          console.log("[WA] Sessão antiga removida.");
        } catch {}
        state.socket   = null;
        state.instancia = null;
        state.numero   = null;
        state.connected = false;
      } else if (!state.reconectando) {
        state.reconectando = true;
        const delay = sessionConflict ? 10000 : 5000;
        console.log(`[WA] Reconectando em ${delay/1000}s...`);
        setTimeout(async () => {
          state.reconectando = false;
          await iniciarSessao(nomeInstancia);
        }, delay);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Mensagens recebidas
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      const remoteJid = msg.key.remoteJid || "";
      const msgId     = msg.key.id || "";

      // Ignora mensagens enviadas por mim
      if (msg.key.fromMe) continue;

      // Ignora grupos (@g.us)
      if (remoteJid.endsWith("@g.us")) continue;

      // Ignora broadcasts e status
      if (isJidBroadcast(remoteJid)) continue;
      if (remoteJid === "status@broadcast") continue;

      // Deduplicação
      if (msgId && _processadas.has(msgId)) continue;
      if (msgId) {
        _processadas.add(msgId);
        if (_processadas.size > 500) {
          const first = _processadas.values().next().value;
          _processadas.delete(first);
        }
      }

      // Extrai texto
      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (!texto.trim()) continue;

      console.log(`[WA] 📨 De ${remoteJid.replace("@s.whatsapp.net", "")}: ${texto.slice(0, 60)}`);
      notificar({
        event: "messages.upsert",
        instance: state.instancia,
        data: { key: msg.key, message: msg.message },
      });
    }
  });

  return sock;
}

async function notificar(payload) {
  try {
    await axios.post(BACKEND_WEBHOOK, payload, { timeout: 5000 });
  } catch {}
}

// ── Auto-restaura sessão existente ao iniciar ─────────────────────────────────
async function restaurarSessoes() {
  if (!existsSync(SESSIONS_DIR)) return;
  const sessoes = readdirSync(SESSIONS_DIR).filter(d =>
    existsSync(path.join(SESSIONS_DIR, d, "creds.json"))
  );
  if (sessoes.length > 0) {
    console.log(`[WA] Restaurando sessão: ${sessoes[0]}`);
    await iniciarSessao(sessoes[0]);
  }
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

app.post("/instancia/criar", async (req, res) => {
  const { nome = "orbita_default" } = req.body;

  if (state.connected) {
    return res.json({ ok: true, mensagem: "Já conectado", numero: state.numero });
  }
  if (state.socket && state.instancia) {
    return res.json({ ok: true, mensagem: "Sessão em andamento. Aguarde o QR Code." });
  }

  try {
    await iniciarSessao(nome);
    res.json({ ok: true, mensagem: "Sessão iniciada. Aguarde o QR Code." });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});

app.get("/instancia/qrcode", (req, res) => {
  if (state.connected) return res.json({ conectado: true, numero: state.numero });
  if (!state.qrBase64) return res.json({ qrcode: null, mensagem: "QR ainda sendo gerado. Tente em 3 segundos." });
  res.json({ qrcode: state.qrBase64 });
});

app.get("/instancia/status", (req, res) => {
  res.json({
    conectado: state.connected,
    numero: state.numero,
    instancia: state.instancia,
    temQr: !!state.qrBase64,
  });
});

app.delete("/instancia/deletar", async (req, res) => {
  if (state.socket) {
    try { await state.socket.logout(); } catch {}
    state.socket = null;
  }
  state.connected = false;
  state.qrBase64  = null;
  state.numero    = null;
  state.instancia = null;
  res.json({ ok: true, mensagem: "Desconectado" });
});

app.post("/mensagem/enviar", async (req, res) => {
  const { numero, mensagem } = req.body;
  if (!state.connected || !state.socket) {
    return res.status(400).json({ ok: false, erro: "WhatsApp não conectado" });
  }
  try {
    // Aceita JID completo (@s.whatsapp.net, @lid, @g.us) ou número puro
    let jid;
    if (numero.includes("@")) {
      jid = numero; // já é JID completo — usa direto
    } else {
      jid = numero.replace(/\D/g, "") + "@s.whatsapp.net";
    }

    await state.socket.sendMessage(jid, { text: mensagem });
    console.log(`[WA] ✉️ Enviado para ${jid}: ${mensagem.slice(0, 40)}`);
    res.json({ ok: true, jid });
  } catch (e) {
    console.error(`[WA] Erro ao enviar para ${numero}:`, e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, versao: "1.0.0", conectado: state.connected, numero: state.numero });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[Orbita WA] Servidor rodando na porta ${PORT}`);
  console.log(`[Orbita WA] Webhook: ${BACKEND_WEBHOOK}`);
  await restaurarSessoes();
});
