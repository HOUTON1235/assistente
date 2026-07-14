"""Testa fluxo completo do WhatsApp."""
import asyncio
import sys
sys.path.insert(0, "/Users/ifmatimontimon/Documents/assistente/backend")

import httpx

BASE = "http://localhost:8000/api/v1"

async def main():
    async with httpx.AsyncClient(timeout=60) as c:
        # Login
        r = await c.post(f"{BASE}/auth/login", json={"email":"rioscarloseduardo298@gmail.com","senha":"1234567"})
        token = r.json()["access_token"]
        H = {"Authorization": f"Bearer {token}"}
        print(f"Login OK")

        # Limpa instancia antiga
        await c.delete(f"{BASE}/whatsapp/instancia/desconectar", headers=H)
        print("Instancia antiga removida")

        # Cria instancia
        r = await c.post(f"{BASE}/whatsapp/instancia/criar", headers=H)
        print(f"Criar: {r.json().get('mensagem','')}")

        # Pega QR Code (aguarda até 40s)
        print("Aguardando QR Code...")
        r = await c.get(f"{BASE}/whatsapp/instancia/qrcode", headers=H, timeout=60)
        d = r.json()
        b64 = d.get("base64","")

        if b64:
            print(f"QR CODE OK! base64[:50]: {b64[:50]}")
        else:
            print(f"Sem QR. Resposta: {str(d)[:200]}")

asyncio.run(main())
