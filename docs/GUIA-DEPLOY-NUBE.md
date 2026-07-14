# Guía simple — subir Axones a internet

**Para quien paga y hace el deploy** (sin ser programadora).  
**Para el desarrollador:** envía este archivo + el enlace del proyecto + el archivo `.env` ya rellenado (ver sección 0).

Tiempo estimado: **1–2 horas** la primera vez.

---

## 0. Antes de empezar — qué pedirle al desarrollador

Tu amigo/a de desarrollo te debe enviar **antes** de que compres nada:

| Qué | Para qué |
|-----|----------|
| Carpeta del proyecto (ZIP) **o** enlace de GitHub | El código de la app |
| Archivo `.env` ya configurado | Contraseñas y ajustes (no lo inventes tú) |
| Esta guía | Los pasos que estás leyendo |

**No compartas el `.env` por WhatsApp público.** Envíalo por correo o mensaje privado.

---

## 1. Qué comprar (2 cosas)

### A) Dominio (~10–15 USD/año)

Un nombre para entrar a la app, por ejemplo: `axonesacarigua.com`

| Dónde | Por qué |
|-------|---------|
| [Namecheap](https://www.namecheap.com) | Fácil, barato |
| [Hostinger](https://www.hostinger.com) | Interfaz en español |
| [Cloudflare](https://www.cloudflare.com/products/registrar/) | Buen DNS incluido |

Elige cualquier `.com` disponible. No hace falta hosting web aparte — solo el **dominio**.

### B) Servidor VPS (~6–12 USD/mes)

Una “computadora en internet” donde corre la app.

| Dónde | Plan mínimo | Notas |
|-------|-------------|-------|
| [Hostinger VPS](https://www.hostinger.com/vps-hosting) | KVM 1 (2 GB RAM) | Español, tarjeta internacional |
| [DigitalOcean](https://www.digitalocean.com) | Droplet $6 (1 GB) o $12 (2 GB) | Muy usado, tutoriales en inglés |
| [Vultr](https://www.vultr.com) | $6 — elige **Miami** | Buena conexión desde Venezuela |

**Al crear el servidor elige:**
- Sistema: **Ubuntu 24.04**
- Región: **Miami** o la más cercana a Acarigua
- Mínimo **2 GB de RAM** (recomendado)

Anota la **IP pública** del servidor (ejemplo: `45.76.123.45`).

---

## 2. Conectar el dominio al servidor

En el panel del dominio (Namecheap, Hostinger, etc.) → **DNS** → agrega:

| Tipo | Nombre | Valor |
|------|--------|-------|
| **A** | `@` | IP del servidor |
| **A** | `www` | IP del servidor |

Guarda y espera **5–30 minutos** (a veces hasta 2 horas).

Prueba en el navegador: `http://TU-DOMINIO.com` — puede no cargar aún; es normal hasta el paso 6.

---

## 3. Entrar al servidor (SSH)

### En Windows

1. Descarga [PuTTY](https://www.putty.org/) o usa **PowerShell**.
2. El proveedor del VPS te dio: **IP**, **usuario** (casi siempre `root`) y **contraseña** (o llave).

En PowerShell:

```powershell
ssh root@TU-IP-DEL-SERVIDOR
```

Acepta la pregunta de confianza (`yes`) y escribe la contraseña (no se ve al escribir; es normal).

---

## 4. Instalar Docker (copiar y pegar)

Ya dentro del servidor, pega **todo este bloque** y espera a que termine:

```bash
apt update && apt install -y git curl
curl -fsSL https://get.docker.com | sh
```

Verifica:

```bash
docker --version
docker compose version
```

Debe mostrar versiones sin error.

---

## 5. Subir el proyecto

### Opción A — con GitHub (si el dev te pasó el enlace)

```bash
cd /opt
git clone ENLACE-QUE-TE-PASO axones
cd axones
```

### Opción B — con ZIP (si te mandaron carpeta comprimida)

1. Sube el ZIP con [WinSCP](https://winscp.net/) a `/opt/axones.zip`
2. En el servidor:

```bash
apt install -y unzip
mkdir -p /opt/axones
unzip /opt/axones.zip -d /opt/axones
cd /opt/axones
```

(Si el ZIP crea una subcarpeta extra, entra en ella: `cd axones` o el nombre que tenga.)

### Poner el archivo `.env`

El desarrollador te envió un `.env`. Súbelo a la **raíz** del proyecto (junto a `docker-compose.yml`).

Con WinSCP: arrastra el archivo a `/opt/axones/.env`

O créalo en el servidor:

```bash
nano /opt/axones/.env
```

Pega el contenido que te mandaron, guarda: `Ctrl+O`, Enter, `Ctrl+X`.

**Importante:** en `.env` debe decir tu dominio real, por ejemplo:

```env
CORS_ORIGINS=https://axonesacarigua.com,https://www.axonesacarigua.com
```

Si cambias el dominio, avisa al desarrollador para que ajuste esto.

---

## 6. Encender la aplicación

```bash
cd /opt/axones
docker compose up -d --build
```

La **primera vez tarda 5–15 minutos**. No cierres la ventana.

Ver si todo está bien:

```bash
docker compose ps
```

Las 3 filas (`db`, `api`, `web`) deben decir **running** o **healthy**.

Prueba en el navegador (sin HTTPS aún):

```
http://TU-IP:8080
```

Debe aparecer la pantalla de login de Axones.

---

## 7. HTTPS (candado verde) con Caddy

Sin esto la app funciona por IP pero el navegador dirá “no seguro”. Instala Caddy:

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

Crea la configuración (cambia el dominio):

```bash
nano /etc/caddy/Caddyfile
```

Pega esto (reemplaza `axonesacarigua.com` por tu dominio):

```
axonesacarigua.com, www.axonesacarigua.com {
    reverse_proxy localhost:8080
}
```

Guarda y reinicia Caddy:

```bash
systemctl reload caddy
```

Abre en el navegador:

```
https://axonesacarigua.com
```

Debe cargar con candado verde.

---

## 8. Usuarios de entrada (cambiar después)

| Usuario | Contraseña inicial | Notas |
|---------|-------------------|-------|
| `admin` | `password` | Acceso total |
| `inventario` | `inventario` | Materiales |

**Cambia estas contraseñas** en cuanto entren (o pídele al desarrollador que las cambie).

---

## 9. Comandos útiles (día a día)

```bash
cd /opt/axones

# Ver si está corriendo
docker compose ps

# Ver errores
docker compose logs -f

# Reiniciar tras una actualización
docker compose up -d --build

# Parar todo
docker compose down
```

### Backup de la base de datos (hacerlo cada semana)

```bash
cd /opt/axones
docker compose exec db mysqldump -u axones -p axones > backup.sql
```

Te pedirá la contraseña `MYSQL_PASSWORD` del `.env`.

---

## 10. Si algo sale mal

| Problema | Qué hacer |
|----------|-----------|
| No abre la web | `docker compose ps` — ¿están los 3 en running? |
| Error 502 | `docker compose logs api web` — copia el error y envíaselo al desarrollador |
| Dominio no carga | Espera 30 min; revisa que el registro **A** apunte a la IP correcta |
| “No seguro” sin candado | Falta el paso 7 (Caddy) o el DNS aún no propagó |
| Olvidé la contraseña SSH | Panel del VPS → reset password |

**Siempre puedes enviarle al desarrollador la salida de:**

```bash
docker compose ps
docker compose logs --tail=50
```

---

## 11. Resumen de costos

| Concepto | Precio aprox. |
|----------|---------------|
| Dominio `.com` | ~12 USD/año |
| VPS 2 GB | ~8–12 USD/mes |
| **Total primer año** | **~110–160 USD** |

---

## 12. Checklist rápido

- [ ] Dominio comprado
- [ ] VPS creado (Ubuntu, 2 GB RAM, Miami)
- [ ] DNS apunta a la IP del VPS
- [ ] `.env` del desarrollador en `/opt/axones/`
- [ ] `docker compose up -d --build` sin errores
- [ ] Login visible en `http://IP:8080`
- [ ] Caddy instalado → `https://tudominio.com` con candado
- [ ] Contraseñas de `admin` cambiadas

¡Listo!
