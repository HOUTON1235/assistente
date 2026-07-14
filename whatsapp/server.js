/**
 * Orbita WhatsApp Server — Baileys + Express
 * Porta: 8080
 * Endpoints:
 *   POST /instancia/criar        — inicia sessão e gera QR Code
 *   GET  /instancia/qrcode       — retorna QR Code base64
 *   GET  /instancia/status       — verifica se está conectado
 *   DELETE /instancia/deletar    — desconecta
 *   POST /mensagem/enviar        — envia mensagem
 *   POST /webhook (incoming)     — Evolution-like webhook para o backend Python
 */

import express from "express";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import QRCode from "qrcode";

// Baileys imports
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import pino from "pino";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = path.join(__dirname, "sessions");
const PORT = 8080;
const BACKEND_WEBHOOK = process.env.BACKEND_WEBHOOK || "http://localhost:8000/api/v1/whatsapp/webhook";

if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });

const app = express();
app.use(express.json());

// Estado global da sessão
const state = {
  socket: null,
  qrBase64: null,
  connected: false,
  numero: null,
  instancia: null,
  tentandoReconectar: false,
};

const logger = pino({ level: "silent" });

// ── Inicia sessão Baileys ─────────────────────────────────────────────────────
async function iniciarSessao(nomeInstancia) {
  const sessaoDir = path.join(SESSIONS_DIR, nomeInstancia);
  if (!existsSync(sessaoDir)) mkdirSync(sessaoDir, { recursive: true });

  const { state: authState, saveCreds } = await useMultiFileAuthState(sessaoDir);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`[WA] Iniciando sessão ${nomeInstancia} com Baileys v${version.join(".")}`);

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger),
    },
    printQRInTerminal: true,
    browser: ["Orbita", "Chrome", "120.0.0.0"],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  state.socket = sock;
  state.instancia = nomeInstancia;

  // QR Code
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.qrBase64 = await QRCode.toDataURL(qr);
      state.connected = false;
      console.log("[WA] QR Code gerado — escaneie com o WhatsApp");
      // Notifica backend
      notificarBackend({ event: "QRCODE_UPDATED", qr: state.qrBase64 });
    }

    if (connection === "open") {
      state.connected = true;
      state.qrBase64 = null;
      state.numero = sock.user?.id?.split(":")[0] || null;
      console.log(`[WA] Conectado! Número: ${state.numero}`);
      notificarBackend({ event: "CONNECTION_UPDATE", status: "open", numero: state.numero });
    }

    if (connection === "close") {
      state.connected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const deveReconectar = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WA] Desconectado. Código: ${statusCode}. Reconectar: ${deveReconectar}`);
      notificarBackend({ event: "CONNECTION_UPDATE", status: "close", statusCode });

      if (deveReconectar && !state.tentandoReconectar) {
        state.tentandoReconectar = true;
        setTimeout(async () => {
          state.tentandoReconectar = false;
          await iniciarSessao(nomeInstancia);
        }, 5000);
      }
    }
  });

  // Salva credenciais
  sock.ev.on("creds.update", saveCreds);

  // Mensagens recebidas — encaminha para o backend Python
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (isJidBroadcast(msg.key.remoteJid || "")) continue;

      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      if (!texto) continue;

      console.log(`[WA] Mensagem de ${msg.key.remoteJid}: ${texto.slice(0, 50)}`);
      notificarBackend({
        event: "messages.upsert",
        instance: nomeInstancia,
        data: { key: msg.key, message: msg.message },
      });
    }
  });

  return sock;
}

async function notificarBackend(payload) {
  try {
    await axios.post(BACKEND_WEBHOOK, payload, { timeout: 5000 });
  } catch (e) {
    // Backend pode estar offline — ignora silenciosamente
  }
}

// ── Endpoints REST ────────────────────────────────────────────────────────────

// Criar/iniciar sessão
app.post("/instancia/criar", async (req, res) => {
  const { nome = "orbita_default" } = req.body;
  if (state.socket && state.connected) {
    return res.json({ ok: true, mensagem: "Já conectado", numero: state.numero });
  }
  try {
    await iniciarSessao(nome);
    res.json({ ok: true, mensagem: "Sessão iniciada. Aguarde o QR Code." });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});

// QR Code
app.get("/instancia/qrcode", (req, res) => {
  if (state.connected) {
    return res.json({ conectado: true, numero: state.numero });
  }
  if (!state.qrBase64) {
    return res.json({ qrcode: null, mensagem: "QR ainda sendo gerado. Tente em 3 segundos." });
  }
  res.json({ qrcode: state.qrBase64 });
});

// Status
app.get("/instancia/status", (req, res) => {
  res.json({
    conectado: state.connected,
    numero: state.numero,
    instancia: state.instancia,
    temQr: !!state.qrBase64,
  });
});

// Deletar/desconectar
app.delete("/instancia/deletar", async (req, res) => {
  if (state.socket) {
    try { await state.socket.logout(); } catch {}
    state.socket = null;
  }
  state.connected = false;
  state.qrBase64 = null;
  state.numero = null;
  res.json({ ok: true, mensagem: "Desconectado" });
});

// Enviar mensagem
app.post("/mensagem/enviar", async (req, res) => {
  const { numero, mensagem } = req.body;
  if (!state.connected || !state.socket) {
    return res.status(400).json({ ok: false, erro: "WhatsApp não conectado" });
  }
  try {
    const jid = numero.replace(/\D/g, "") + "@s.whatsapp.net";
    await state.socket.sendMessage(jid, { text: mensagem });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});

// Health
app.get("/health", (req, res) => {
  res.json({ ok: true, versao: "1.0.0", conectado: state.connected });
});

app.listen(PORT, () => {
  console.log(`[Orbita WA] Servidor rodando na porta ${PORT}`);
  console.log(`[Orbita WA] Backend webhook: ${BACKEND_WEBHOOK}`);
});
