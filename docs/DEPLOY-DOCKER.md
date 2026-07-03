# Producción con Docker — Axones Acarigua

Guía para la **PC servidor de la empresa** (Windows con Docker Desktop).  
Incluye **MySQL**, **migraciones SQL automáticas**, API Python y frontend React en un solo comando.

No necesitas XAMPP, Python ni Node instalados en la PC de planta (solo Docker).

---

## 1. Qué instalar en la PC de la empresa

| Software | Obligatorio | Para qué |
|----------|-------------|----------|
| **Docker Desktop** | Sí | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Git** (opcional) | Recomendado | Actualizar el código |
| Cursor / XAMPP / Node / Python | **No** | Solo en tu PC de desarrollo |

---

## 2. Copiar el proyecto

Opción A — USB / AnyDesk: copia la carpeta `Axones Acarigua` completa.

Opción B — Git:

```powershell
git clone <url-del-repo> "C:\Axones Acarigua"
cd "C:\Axones Acarigua"
```

---

## 3. Configurar variables (.env)

En la **raíz** del proyecto (donde está `docker-compose.yml`):

```powershell
copy .env.docker.example .env
notepad .env
```

Edita **obligatoriamente**:

```env
MYSQL_ROOT_PASSWORD=UnaClaveRootMuySegura123!
MYSQL_PASSWORD=ClaveUsuarioAxones456!
JWT_SECRET=genera_una_cadena_de_al_menos_32_caracteres_aqui
CORS_ORIGINS=http://192.168.0.50:8080,http://localhost:8080
APP_PORT=8080
```

- Sustituye `192.168.0.50` por la **IP real** de la PC servidor (cmd → `ipconfig`).
- `JWT_SECRET`: mínimo 32 caracteres. En PowerShell:  
  `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
- Evita `@`, `#` y `:` en las contraseñas de MySQL (simplifica la URL de conexión).

---

## 4. Levantar todo (primera vez)

Abre **PowerShell como administrador** (Docker Desktop debe estar abierto):

```powershell
cd "C:\Axones Acarigua"
docker compose up -d --build
```

La primera vez tarda varios minutos (descarga imágenes + compila frontend).

### Qué hace Docker automáticamente

1. **MySQL 8** — crea base `axones`, usuario y contraseña del `.env`
2. **Migraciones Alembic** — crea todas las tablas (`scripts/run_migrations.py`)
3. **Usuarios iniciales** — al arrancar la API (`admin`, `inventario`, etc.)
4. **Nginx** — sirve la web en el puerto `8080` y redirige `/api` al backend

---

## 5. Abrir la aplicación

En cualquier PC/tablet de la **misma red WiFi/LAN**:

```
http://IP-DE-LA-PC-SERVIDOR:8080
```

Ejemplo: `http://192.168.0.50:8080`

### Usuarios de prueba (cambiar contraseñas después)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `password` | Todo el sistema |
| `inventario` | `inventario` | Materiales, solicitudes |
| `produccion` | `produccion` | Producción, reportes |
| `despacho` | `despacho` | Despacho |
| `ordenes` | `ordenes` | Órdenes / clientes |

---

## 6. SQL — base de datos

### Creación automática (recomendado)

Docker ya ejecuta el equivalente a:

```sql
CREATE DATABASE axones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'axones'@'%' IDENTIFIED BY 'tu_clave_del_env';
GRANT ALL PRIVILEGES ON axones.* TO 'axones'@'%';
FLUSH PRIVILEGES;
```

Las tablas las crean las **migraciones** al iniciar el contenedor `api`.

### Ver estado

```powershell
docker compose ps
docker compose logs -f api
docker compose logs -f db
```

### Backup SQL (hacerlo a diario)

```powershell
docker compose exec db mysqldump -u axones -p axones > backup_axones_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

(Te pedirá la contraseña `MYSQL_PASSWORD` del `.env`.)

### Restaurar backup

```powershell
Get-Content backup_axones.sql | docker compose exec -T db mysql -u axones -p axones
```

### Vaciar datos (dejar solo usuarios)

Desde tu PC de desarrollo (con Python y `.env` apuntando a MySQL):

```powershell
cd backend
.\.venv\Scripts\python scripts\truncate_keep_users.py
```

O conectar con **DBeaver** / **phpMyAdmin** al puerto 3306 (descomenta `ports: 3306:3306` en `docker-compose.yml` bajo `db`).

---

## 7. Comandos del día a día

```powershell
cd "C:\Axones Acarigua"

# Arrancar (al encender la PC, si Docker Desktop inicia automático)
docker compose up -d

# Parar
docker compose down

# Ver logs en vivo
docker compose logs -f

# Reconstruir tras actualizar código
docker compose up -d --build

# Reiniciar solo la API
docker compose restart api
```

### Arranque automático al encender Windows

1. Docker Desktop → Settings → General → **Start Docker Desktop when you sign in**
2. Opcional: Programador de tareas de Windows que ejecute  
   `docker compose -f "C:\Axones Acarigua\docker-compose.yml" up -d`  
   al iniciar sesión.

---

## 8. Actualizar la aplicación

```powershell
cd "C:\Axones Acarigua"
git pull
docker compose up -d --build
```

Las migraciones nuevas se aplican solas al reiniciar `api`.

---

## 9. Firewall Windows

Permite el puerto **8080** (entrada) para que tablets accedan:

```powershell
New-NetFirewallRule -DisplayName "Axones Web" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

## 10. Solución de problemas

| Síntoma | Qué hacer |
|---------|-----------|
| `JWT_SECRET debe ser...` | `.env` → `JWT_SECRET` con ≥32 caracteres |
| Pantalla en blanco / 502 | `docker compose logs web api` |
| Error de base de datos | `docker compose logs db` — espera 1 min en primer arranque |
| No entra desde tablet | Revisa IP, firewall, `CORS_ORIGINS` en `.env`, luego `docker compose up -d --build` |
| Puerto 8080 ocupado | Cambia `APP_PORT=8081` en `.env` |

### Reset total (borra todos los datos)

```powershell
docker compose down -v
docker compose up -d --build
```

`-v` elimina volúmenes MySQL y fotos subidas. **Haz backup antes.**

---

## 11. Arquitectura

```
Tablet / PC navegador
        │
        ▼  :8080
   [ contenedor web — Nginx ]
        │ /api  /uploads
        ▼
   [ contenedor api — FastAPI + Uvicorn ]
        │
        ▼
   [ contenedor db — MySQL 8 ]
```

---

## 12. Producción en internet (opcional)

Para dominio público con HTTPS, delante de Docker puedes poner **Caddy** o **Nginx** con Let's Encrypt.  
No uses `trycloudflare.com` en producción real.

Ver también: `backend/docs/DEPLOY.md` (despliegue sin Docker en Linux).
