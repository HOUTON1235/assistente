FROM python:3.12-slim

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y gcc libffi-dev && rm -rf /var/lib/apt/lists/*

# Copia e instala requirements
COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copia o código
COPY backend/ .

# Porta
EXPOSE 8000

# Start
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
