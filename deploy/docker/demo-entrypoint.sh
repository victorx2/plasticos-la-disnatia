#!/bin/sh
set -e

PORT="${PORT:-10000}"
export PORT

envsubst '${PORT}' < /etc/nginx/templates/demo.conf.template > /etc/nginx/conf.d/default.conf

echo "Iniciando API (SQLite demo) en :8000..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
API_PID=$!

ready=0
i=0
while [ "$i" -lt 60 ]; do
  if wget -q -O /dev/null "http://127.0.0.1:8000/up" 2>/dev/null; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "La API no respondió a /up a tiempo" >&2
  kill -TERM "$API_PID" 2>/dev/null || true
  exit 1
fi

echo "Iniciando nginx en :${PORT}..."
nginx -g 'daemon off;' &
NGINX_PID=$!

terminate() {
  kill -TERM "$API_PID" "$NGINX_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  wait "$NGINX_PID" 2>/dev/null || true
}
trap terminate TERM INT

# Mantener el contenedor vivo mientras ambos procesos sigan activos
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 2
done

echo "Un proceso del proceso salió; cerrando contenedor." >&2
terminate
exit 1
