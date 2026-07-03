#!/bin/sh
set -e

echo "Esperando MySQL..."
python - <<'PY'
import os
import sys
import time

from sqlalchemy import create_engine, text

url = os.environ.get("DATABASE_URL", "")
if not url:
    sys.exit("DATABASE_URL no definida")

for attempt in range(60):
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("MySQL listo.")
        break
    except Exception as exc:
        print(f"  intento {attempt + 1}/60: {exc}")
        time.sleep(2)
else:
    sys.exit("MySQL no respondió a tiempo.")
PY

echo "Aplicando migraciones Alembic..."
python scripts/run_migrations.py

echo "Iniciando API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
