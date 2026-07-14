#!/bin/bash
cd /Users/ifmatimontimon/Documents/assistente/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
