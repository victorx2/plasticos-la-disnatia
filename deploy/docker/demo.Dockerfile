# Demo all-in-one: frontend (nginx) + backend (uvicorn) + SQLite
# Build context: raíz del monorepo
#   docker build -f deploy/docker/demo.Dockerfile -t axones-demo .

# --- Frontend build ---
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
ARG VITE_API_BASE_URL=/api
ARG VITE_DEMO_AUTO_LOGIN=true
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DEMO_AUTO_LOGIN=$VITE_DEMO_AUTO_LOGIN
RUN npm run build

# --- Runtime: API + nginx ---
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=demo \
    DATABASE_URL=sqlite:////tmp/axones_demo.db \
    API_REQUIRE_AUTH=true \
    CORS_ORIGINS=* \
    PORT=10000

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx gettext-base wget \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend /app/dist /usr/share/nginx/html

COPY deploy/nginx/demo.conf /etc/nginx/templates/demo.conf.template
COPY deploy/docker/demo-entrypoint.sh /app/demo-entrypoint.sh
RUN chmod +x /app/demo-entrypoint.sh \
    && mkdir -p /var/log/nginx /var/lib/nginx /tmp

WORKDIR /app/backend
EXPOSE 10000

ENTRYPOINT ["/app/demo-entrypoint.sh"]
