# Despliegue en producción — Axones Acarigua

Guía para publicar frontend + backend con HTTPS y MySQL.

## Requisitos

- Servidor Linux (Ubuntu 22.04+ recomendado)
- MySQL 8+
- Python 3.11+
- Node.js 20+ (solo para build del frontend)
- Nginx + Certbot (Let's Encrypt)

## 1. Base de datos

```sql
CREATE DATABASE axones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'axones'@'localhost' IDENTIFIED BY 'CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON axones.* TO 'axones'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env: DATABASE_URL, JWT_SECRET (≥32 chars), ENVIRONMENT=production, CORS_ORIGINS
python scripts/run_migrations.py
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Variables críticas en `.env`:

| Variable | Producción |
|----------|------------|
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | `mysql+pymysql://axones:...@127.0.0.1:3306/axones` |
| `JWT_SECRET` | Cadena aleatoria ≥32 caracteres |
| `API_REQUIRE_AUTH` | `true` |
| `CORS_ORIGINS` | URL del frontend (`https://app.tudominio.com`) |

Usuarios iniciales (creados al arrancar si no existen):

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `password` | administrador |
| `inventario` | `inventario` | inventario |

**Cambie las contraseñas** tras el primer despliegue.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.production
# VITE_API_BASE_URL=https://app.tudominio.com/api
npm ci
npm run build
# Servir dist/ con Nginx (ver abajo)
```

## 4. Nginx + HTTPS

Ejemplo `/etc/nginx/sites-available/axones`:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/app.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.tudominio.com/privkey.pem;

    root /var/www/axones/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Certificado:

```bash
sudo certbot --nginx -d app.tudominio.com
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Systemd (API)

`/etc/systemd/system/axones-api.service`:

```ini
[Unit]
Description=Axones Acarigua API
After=network.target mysql.service

[Service]
User=www-data
WorkingDirectory=/var/www/axones/backend
EnvironmentFile=/var/www/axones/backend/.env
ExecStart=/var/www/axones/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now axones-api
```

## 6. Verificación post-despliegue

```bash
cd backend
python scripts/smoke_purchase_flow.py
curl -s https://app.tudominio.com/up
curl -s -o /dev/null -w "%{http_code}" https://app.tudominio.com/api/clients
# Debe devolver 401 sin token
```

## 7. Salir del tunnel de desarrollo

No use `trycloudflare.com` en producción. Sustituya por dominio propio con certificado válido según los pasos anteriores.

## Migraciones en actualizaciones

```bash
cd backend
source .venv/bin/activate
python scripts/run_migrations.py
sudo systemctl restart axones-api
```
