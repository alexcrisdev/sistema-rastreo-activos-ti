# Docker del proyecto

Este proyecto puede levantarse con Docker usando tres servicios:

- `db`: PostgreSQL.
- `backend`: FastAPI con Alembic y seed inicial.
- `frontend`: React + Vite.

## Requisito

Instala Docker Desktop y verifica en una terminal:

```bat
docker --version
docker compose version
```

## Levantar por primera vez

Desde la carpeta del proyecto:

```bat
cd "C:\Users\ERIC PC\Desktop\PYTHON-BACKEND\projects\rastreo_activos_diae"
docker compose up --build
```

Docker hará lo siguiente:

1. Creará PostgreSQL.
2. Construirá la imagen del backend.
3. Ejecutará migraciones con Alembic.
4. Ejecutará `seed.py`.
5. Levantará FastAPI.
6. Levantará Vite para el frontend.

URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000/docs
Postgres: localhost:5433
```

Usuario inicial:

```text
usuario: admin
password: admin123
```

## Detener

```bat
docker compose down
```

## Reiniciar sin reconstruir

```bat
docker compose up
```

## Reconstruir imagen

Usa esto cuando cambies dependencias, Dockerfile o configuración base:

```bat
docker compose up --build
```

No siempre tienes que reconstruir. Con la configuración actual, cambios en:

- `app/`
- `alembic/`
- `seed.py`
- `frontend/src`
- `frontend/public`

se montan como volumen y se reflejan en desarrollo.

Sí conviene reconstruir si cambias:

- `requirements.txt`
- `frontend/package.json`
- `frontend/package-lock.json`
- `Dockerfile.backend`
- `frontend/Dockerfile`
- `docker-compose.yml`

## Borrar base de datos Docker

Si quieres reiniciar PostgreSQL desde cero:

```bat
docker compose down -v
docker compose up --build
```

`-v` elimina el volumen donde Docker guarda los datos de PostgreSQL.
