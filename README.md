# Sistema web para inventario y rastreo simulado de activos TI

Proyecto academico para registrar, consultar y visualizar activos tecnologicos dentro de un plano empresarial. El sistema permite simular movimiento, consultar historial de ubicacion, detectar activos fuera de empresa y gestionar reasignaciones.

## Funcionalidades principales

- Autenticacion con JWT.
- Registro guiado de responsables, asignaciones laborales, activos y usuarios.
- Visualizacion de activos en un mapa empresarial.
- Busqueda de activo por codigo y resaltado en el plano.
- Tooltip y ficha detallada del activo seleccionado.
- Historial de ubicacion por activo.
- Simulacion de movimiento para celulares, laptops y activos fijos marcados como moviles.
- Alertas de activos fuera de empresa.
- Gestion de mantenimiento, baja y reasignacion de activos.
- Deshabilitacion de usuario cuando el responsable queda fuera de labores.
- Reportes visuales por area, estado y tipo de activo.
- Dockerizacion con PostgreSQL, backend y frontend.

## Stack tecnico

- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- Base de datos: PostgreSQL
- Migraciones: Alembic
- Tiempo real: WebSocket con FastAPI
- Frontend: React, TypeScript, Vite
- DevOps: Docker, Docker Compose
- Arquitectura: capas

## Arquitectura del backend

- `app/main.py`: punto de entrada de FastAPI.
- `app/config`: configuracion general.
- `app/db`: conexion y sesion de base de datos.
- `app/models`: modelos ORM de SQLAlchemy.
- `app/schemas`: DTOs de entrada y salida con Pydantic.
- `app/repositories`: acceso a datos.
- `app/services`: reglas de negocio.
- `app/controllers`: endpoints REST.
- `app/websocket`: comunicacion en tiempo real.
- `app/utils`: funciones auxiliares.

## Reglas de negocio destacadas

- El usuario no ingresa coordenadas manualmente.
- Al registrar un activo, se selecciona un area y el sistema genera coordenadas aleatorias dentro del rango.
- Cada cambio de ubicacion actualiza el activo y registra una fila en el historial.
- La asignacion laboral representa el area de trabajo del responsable, no la ubicacion fisica del activo.
- Banos no puede usarse como area inicial de registro.
- Un responsable fuera de labores no puede recibir nuevos activos.
- Si un responsable queda fuera de labores, sus activos pasan a pendiente de reasignacion.
- Si un activo se da de baja, queda desconectado y fuera de empresa.

## Ejecucion local

Backend:

```bat
cd C:\Users\ERIC PC\Desktop\PYTHON-BACKEND\projects\rastreo_activos_diae
venv\Scripts\activate.bat
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

Frontend:

```bat
cd C:\Users\ERIC PC\Desktop\PYTHON-BACKEND\projects\rastreo_activos_diae\frontend
npm.cmd install
npm.cmd run dev
```

URLs:

- Backend: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- Frontend: `http://localhost:5173`

## Ejecucion con Docker

```bat
docker compose down
docker compose up --build
```

Luego abrir:

```text
http://localhost:5173
```

## Flujo recomendado de demostracion

1. Iniciar sesion.
2. Revisar el mapa general y las alertas.
3. Buscar un activo por codigo.
4. Seleccionar un activo en el mapa y revisar su ficha e historial.
5. Registrar un responsable.
6. Crear su asignacion laboral.
7. Registrar un activo asociado al responsable.
8. Iniciar o ejecutar la simulacion.
9. Marcar un responsable como fuera de labores.
10. Reasignar un activo pendiente desde mantenimiento.
11. Revisar reportes.

## Endpoints principales

- `POST /auth/login`
- `POST /auth/register`
- `GET /mapa/datos`
- `GET /activos`
- `GET /activos/buscar?codigo=...`
- `GET /activos/{id_activo}/historial`
- `PUT /activos/{id_activo}/estado`
- `PUT /activos/{id_activo}/reasignar`
- `POST /simulacion/iniciar`
- `POST /simulacion/detener`
- `GET /simulacion/estado`
- `WS /ws/activos`

## Nota academica

El proyecto mantiene una arquitectura en capas para separar responsabilidades: los controladores reciben solicitudes HTTP, los servicios aplican reglas de negocio, los repositorios acceden a datos y los schemas controlan validacion y respuesta.
