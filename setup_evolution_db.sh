#!/bin/bash
PSQL=/opt/homebrew/opt/postgresql@16/bin/psql

echo "==> Criando banco evolution..."
$PSQL postgres -c "CREATE DATABASE evolution;" 2>/dev/null || echo "banco ja existe"

echo "==> Permissoes..."
$PSQL postgres -c "GRANT ALL PRIVILEGES ON DATABASE evolution TO \"user\";"
$PSQL postgres -c "ALTER DATABASE evolution OWNER TO \"user\";"
$PSQL postgres -c "ALTER USER \"user\" CREATEDB;"
$PSQL evolution -c "GRANT ALL ON SCHEMA public TO \"user\";"
$PSQL evolution -c "ALTER SCHEMA public OWNER TO \"user\";"

echo "==> Verificando..."
$PSQL postgres -c "\l" | grep evolution

echo "CONCLUIDO!"
