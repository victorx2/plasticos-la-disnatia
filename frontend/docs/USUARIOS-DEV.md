# Usuarios de prueba — Axones Acarigua

Credenciales para **desarrollo y pruebas**. Se crean solas al arrancar el backend (`app/seed.py` → `seed_users`).

**No usar en producción.** Cambiar contraseñas antes de salir a internet real.

---

## Tabla rápida (copiar y pegar)

| Usuario | Contraseña | Rol en menú | Para probar qué |
|---------|------------|-------------|-----------------|
| `admin` | `password` | **administrador** | Todo el sistema (smoke test completo) |
| `inventario` | `inventario` | **inventario** | Materiales, recepciones, movimientos, devoluciones, solicitudes de área |
| `produccion` | `produccion` | **produccion** | Programación, mezcla, extrusión, sellado, reportes |
| `despacho` | `despacho` | **despacho** | Módulo Despacho (paletas, salida de planta) |
| `ordenes` | `ordenes` | **ordenes** | Clientes, productos y órdenes de producción (vista comercial) |

### Detalle por cuenta

| Usuario | Nombre mostrado | Email (solo referencia) | Rol en API |
|---------|-----------------|-------------------------|------------|
| `admin` | Administrador | `admin@dinastia.local` | `administrador` |
| `inventario` | Inventario | `inventario@dinastia.local` | `inventario` |
| `produccion` | Producción | `produccion@dinastia.local` | `produccion` |
| `despacho` | Despacho | `despacho@dinastia.local` | `despacho` |
| `ordenes` | Órdenes de producción | `ordenes@dinastia.local` | `produccion`* |

\* El usuario `ordenes` tiene rol `produccion` en la base de datos, pero el frontend lo trata como rol **`ordenes`** por su nombre de usuario (`config/permissions.ts` → `getSessionAppRole`).

---

## Cómo entrar

1. Abrir la URL del frontend (local o túnel Cloudflare).
2. En el campo **Usuario**, escribir solo el login de la tabla (`admin`, `inventario`, etc.). **No** usar el correo.
3. Contraseña exacta de la tabla (minúsculas, sin espacios).
4. Tras login correcto redirige a `/resumen`.

---

## Qué revisar con cada rol

Usar distintos roles valida que cada área de la planta vea **solo su menú** y que el flujo Alba funcione por etapas.

| Rol | Flujo / pantallas sugeridas |
|-----|----------------------------|
| **ordenes** o **admin** | Crear orden de producción → `/orden-produccion/nueva` |
| **inventario** | Autorizar y despachar insumos → `/solicitudes-area/insumos/:id` |
| **produccion** o **admin** | Mezcla → extrusión → sellado → `/mezcla/produccion`, `/extrusion` |
| **despacho** | Armar paletas → `/despacho` |
| **admin** | Datos maestros, proveedores, órdenes de compra, todo el menú |

Checklist completo: [`CHECKLIST-PRUEBA-ALBA.md`](./CHECKLIST-PRUEBA-ALBA.md).

Permisos del menú: `src/config/permissions.ts` → `MENU_ROLE_ACCESS`.

---

## Acceso por túnel Cloudflare (`*.trycloudflare.com`)

Para que **cualquier rol** pueda entrar desde un enlace remoto:

### En la PC que hospeda el sistema

1. **Backend** encendido (ej. puerto `8001`).
2. **Frontend** encendido: `npm run dev` en `frontend/` (puerto `5174`).
3. **Un solo túnel** apuntando al **frontend** (`5174`), no solo al backend.
   - El visitante usa `https://xxxx.trycloudflare.com` → Vite sirve la app.
   - Las llamadas van a `/api` en el **mismo dominio**; Vite hace proxy al backend local (`vite.config.ts`).

4. En `frontend/.env.local` (opcional si el backend no está en `8001`):

   ```env
   VITE_DEV_API_URL=http://127.0.0.1:8001
   ```

5. Reiniciar frontend después de cambiar `.env.local`.

### Si `admin` entra pero `inventario` no

| Síntoma | Causa probable | Qué hacer |
|---------|----------------|-----------|
| «Usuario o contraseña incorrectos» | Typo o espacio extra | Usuario: `inventario` · Contraseña: `inventario` (todo minúsculas) |
| Mismo error en todos los roles | Backend caído o proxy mal | Verificar que `http://127.0.0.1:8001/api/health` (o docs) responda en la PC anfitriona |
| Solo funciona en localhost | Túnel al puerto equivocado | Túnel → **5174** (frontend), no solo 8001 |
| Funcionaba y dejó de ir | Base de datos distinta / sin seed | Reiniciar backend; si hace falta, recrear DB y seed (ver `HANDOFF-NEXT-SPRINT.md`) |
| Error de red / CORS en consola (F12) | URL del API incorrecta | En dev, el frontend debe llamar a `https://tu-tunel.trycloudflare.com/api`, no a `127.0.0.1` |

### Probar el login sin abrir la app

En la PC del servidor (reemplazar URL si usas túnel):

```bash
curl -s -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"inventario\",\"password\":\"inventario\"}"
```

Respuesta esperada: JSON con `token` y `user.role` = `"inventario"`.

---

## Roles canónicos (referencia)

Definidos en `src/config/permissions.ts`:

- `administrador` — acceso total
- `inventario` — almacén
- `produccion` — planta
- `despacho` — salida
- `ordenes` — comercial / órdenes de producción

El API también acepta alias (`admin`, `jefe_almacen`, `impresion`, `gate`, etc.) que se normalizan a uno de los cinco roles.

---

## Mensaje para quien prueba desde otra PC

> Entra a **[URL del túnel]**  
> Usuarios de prueba (usuario / contraseña iguales salvo admin):
>
> - **admin** / **password** — ve todo  
> - **inventario** / **inventario** — almacén  
> - **produccion** / **produccion** — planta  
> - **despacho** / **despacho** — despacho  
> - **ordenes** / **ordenes** — órdenes de producción  
>
> Cierra sesión (menú usuario abajo) y vuelve a entrar con otro rol para revisar permisos.

---

## Documentos relacionados

- [`HANDOFF-NEXT-SPRINT.md`](./HANDOFF-NEXT-SPRINT.md) — arranque dev y login `admin`
- [`CHECKLIST-PRUEBA-ALBA.md`](./CHECKLIST-PRUEBA-ALBA.md) — prueba end-to-end por fases
- [`API.md`](./API.md) — contrato login `POST /api/auth/login`
