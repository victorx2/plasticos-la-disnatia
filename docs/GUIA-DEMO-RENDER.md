# Guía — demo gratis en Render (front + back)

Una sola URL pública con la app completa (React + API + datos demo).  
Ideal para mostrar el potencial del sistema. **No es producción.**

Tiempo estimado: **15–25 minutos** la primera vez.

---

## Qué obtienes

| | |
|--|--|
| **URL** | `https://plasticos-la-disnatia.onrender.com` (o similar) |
| **Login** | **Auto**: entran directo al Resumen (sin pantella de login en la demo) |
| **Costo** | Plan free de Render |

**Limitaciones del free:**

- Tras ~15 min sin visitas, el servicio se duerme → la **primera** carga tarda ~1 minuto.
- La base SQLite **se reinicia** si el contenedor se recrea (usuarios demo vuelven).
- Ancho de banda y horas de instancia mensuales limitados.

---

## 0. Antes de empezar

1. El código con `render.yaml` y `deploy/docker/demo.Dockerfile` debe estar en **GitHub** (rama `main`).
2. Cuenta en [render.com](https://render.com) (puedes entrar con GitHub).

Si aún no subiste los cambios:

```powershell
cd "C:\Users\pc\Desktop\Axones Acarigua"
git add render.yaml deploy/docker deploy/nginx/demo.conf docs/GUIA-DEMO-RENDER.md backend/app/config.py backend/app/main.py
git status
git commit -m "Add free Render demo deploy (single container)"
git push origin main
```

---

## 1. Crear el servicio en Render

### Opción A — Blueprint (recomendada)

1. Entra a [Render Dashboard](https://dashboard.render.com).
2. **New** → **Blueprint**.
3. Conecta el repo de GitHub (el de este proyecto).
4. Render lee `render.yaml` → confirma el servicio `plasticos-la-disnatia`.
5. **Apply** / crear.

### Opción B — Web Service manual

1. **New** → **Web Service**.
2. Conecta el mismo repo.
3. Ajustes:
   - **Runtime:** Docker
   - **Dockerfile path:** `./deploy/docker/demo.Dockerfile`
   - **Docker context:** `.` (raíz)
   - **Instance type:** Free
   - **Health check path:** `/up`
4. Variables de entorno (igual que en `render.yaml`):

| Key | Value |
|-----|--------|
| `ENVIRONMENT` | `demo` |
| `DATABASE_URL` | `sqlite:////tmp/axones_demo.db` |
| `API_REQUIRE_AUTH` | `true` |
| `CORS_ORIGINS` | `*` |
| `JWT_SECRET` | Generate (botón de valor aleatorio, ≥32 caracteres) |
| `JWT_EXPIRE_MINUTES` | `480` |

5. **Create Web Service**.

---

## 2. Esperar el build

El primer build puede tardar **5–15 minutos** (instala Node, construye el frontend, instala Python).

Cuando el estado sea **Live**:

1. Abre la URL que muestra Render.
2. Debe aparecer la pantalla de login.

Si falla el build: **Logs** → copia el error y revísalo (a menudo falta push de `package-lock.json` o el Dockerfile path incorrecto).

---

## 3. Acceso demo (sin login)

La imagen demo se compila con `VITE_DEMO_AUTO_LOGIN=true`: al abrir la URL, la app inicia sesión sola como administrador y va a **Resumen**.

Usuarios seed (si algún día desactivas el auto-login):

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `password` | Administrador |
| `inventario` | `inventario` | Inventario |
| `produccion` | `produccion` | Producción |
| `despacho` | `despacho` | Despacho |
| `ordenes` | `ordenes` | Producción |

Hay un cliente y producto demo sembrados al arrancar.

---

## 4. Cómo presentarlo

1. **Antes** de la reunión, abre tú la URL y espera a que despierte (~1 min si estaba dormida).
2. Comparte el enlace ya “caliente”.
3. Entra con `admin` / `password` y recorre orden de producción → programación → mezcla → extrusión → despacho → reportes.

Texto corto para WhatsApp:

```
Hola — demo del sistema Plásticos La Dinastía (planta):
https://plasticos-la-disnatia.onrender.com

Entra directo (sin usuario/clave). Si tarda ~1 min la primera vez, es normal (servidor gratis).
```

---

## 5. Comandos útiles (local)

Probar la imagen demo en tu PC (necesitas Docker):

```powershell
cd "C:\Users\pc\Desktop\Axones Acarigua"
docker build -f deploy/docker/demo.Dockerfile -t axones-demo .
docker run --rm -p 8080:10000 -e JWT_SECRET=demo-secret-minimo-32-caracteres!! -e PORT=10000 axones-demo
```

Abre http://localhost:8080

---

## 6. Si algo sale mal

| Problema | Qué hacer |
|----------|-----------|
| Build falló en npm | Confirma que `frontend/package-lock.json` está en el repo |
| `JWT_SECRET` error | Genera un secreto ≥32 caracteres en Env vars |
| 502 / nginx | Revisa logs: la API debe responder `GET /up` |
| Página en blanco | Hard refresh; confirma `VITE_API_BASE_URL=/api` en el Dockerfile |
| Se duerme siempre | Normal en free; abre antes de enseñar |

---

## Producción real (después)

Cuando quieras algo estable 24/7 con MySQL: ver [`GUIA-DEPLOY-NUBE.md`](./GUIA-DEPLOY-NUBE.md) (VPS + dominio).
