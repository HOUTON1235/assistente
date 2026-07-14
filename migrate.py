"""Migração manual."""
import asyncio
import sys
sys.path.insert(0, "/Users/ifmatimontimon/Documents/assistente/backend")

from app.core.database import engine
from sqlalchemy import text


async def migrar():
    stmts = [
        "ALTER TABLE conversas ADD COLUMN IF NOT EXISTS summary TEXT",
        """CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(36) PRIMARY KEY, empresa_id VARCHAR(36),
            usuario_id VARCHAR(36), acao VARCHAR(100) NOT NULL,
            recurso VARCHAR(100) NOT NULL, recurso_id VARCHAR(36),
            dados_antes JSON, dados_depois JSON, ip VARCHAR(45),
            user_agent VARCHAR(255), request_id VARCHAR(36),
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_audit_empresa ON audit_logs(empresa_id)",
        "CREATE INDEX IF NOT EXISTS ix_audit_usuario ON audit_logs(usuario_id)",
        "CREATE INDEX IF NOT EXISTS ix_audit_criado  ON audit_logs(criado_em)",
        """CREATE TABLE IF NOT EXISTS whatsapp_instancias (
            id VARCHAR(36) PRIMARY KEY,
            empresa_id VARCHAR(36) NOT NULL,
            nome_instancia VARCHAR(100) NOT NULL,
            numero VARCHAR(20),
            conectado BOOLEAN DEFAULT FALSE,
            ativo BOOLEAN DEFAULT TRUE,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_wa_empresa ON whatsapp_instancias(empresa_id)",
    ]
    async with engine.begin() as conn:
        for s in stmts:
            s = s.strip()
            try:
                await conn.execute(text(s))
                print(f"OK: {s[:60].replace(chr(10),' ')}")
            except Exception as e:
                print(f"SKIP: {str(e)[:80]}")
    print("Migracao concluida!")

asyncio.run(migrar())
