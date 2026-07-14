# Checklist — qué preparar tú (desarrollador) antes de que tu amiga haga el deploy

Envíale a ella: **`docs/GUIA-DEPLOY-NUBE.md`** + los archivos de abajo.

---

## 1. Archivo `.env` listo

Copia `.env.docker.example` → `.env` y rellena con valores **reales** (genera claves nuevas, no uses las de ejemplo):

```env
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=axones
MYSQL_USER=axones
MYSQL_PASSWORD=...

JWT_SECRET=...   # mínimo 32 caracteres

# Dominio que ella compre (ajusta cuando lo sepan)
CORS_ORIGINS=https://axonesacarigua.com,https://www.axonesacarigua.com

APP_PORT=8080
```

Generar `JWT_SECRET` en PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Evita** `@`, `#` y `:` en las contraseñas de MySQL.

---

## 2. Código del proyecto

Una de estas opciones:

| Opción | Cómo |
|--------|------|
| **GitHub** (recomendado) | Repo privado; invítala como colaboradora o pásale el enlace `git clone` |
| **ZIP** | Comprime la carpeta del monorepo (sin `node_modules`, sin `.venv`, sin `backend/.env`) |

---

## 3. Qué NO enviar

- Tu `.env` local de desarrollo con datos de prueba
- Credenciales de tu PC personal
- La carpeta `node_modules` ni `.venv` (Docker las construye solo)

---

## 4. Después del deploy — verificar contigo

Pídele que te confirme:

1. `https://dominio.com` carga el login
2. Entra con `admin` / `password`
3. Cambia la contraseña de `admin` (o hazlo tú por SSH si tienes acceso)

Smoke test opcional (si tienes acceso SSH):

```bash
cd /opt/axones/backend
docker compose exec api python scripts/smoke_purchase_flow.py
```

---

## 5. Mensaje modelo para enviarle por WhatsApp

```
Hola! Para subir Axones a internet necesitas:

1. Comprar un dominio (.com) ~12 USD/año
2. Comprar un VPS Ubuntu 2GB ~8 USD/mes (Hostinger o Vultr Miami)
3. Seguir la guía que te adjunto (GUIA-DEPLOY-NUBE.md)

Yo te mando el archivo .env con las claves — no lo reenvíes a nadie.

Cuando tengas la IP del servidor y el dominio, avísame 
para revisar el CORS_ORIGINS del .env.

Si te atoras en algún paso, mándame captura de pantalla 
o el resultado de: docker compose logs --tail=30
```

---

## 6. Si prefieren que tú hagas el deploy remoto

Ella solo compra dominio + VPS y te pasa:

- IP del servidor
- Usuario/contraseña SSH (o llave)
- Dominio elegido

Tú entras por SSH y ejecutas los pasos 4–7 de la guía. Tiempo: ~30 min.
