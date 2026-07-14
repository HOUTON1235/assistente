#!/bin/bash
PSQL=/opt/homebrew/opt/postgresql@16/bin/psql

$PSQL postgres -c "GRANT ALL PRIVILEGES ON DATABASE assistente_ia TO \"user\";"
$PSQL postgres -c "ALTER DATABASE assistente_ia OWNER TO \"user\";"
$PSQL postgres -c "\l" | grep assistente_ia

echo "DB setup done."
