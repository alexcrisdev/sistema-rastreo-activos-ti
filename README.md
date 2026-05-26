# Sistema web para inventario y rastreo simulado de activos TI

Proyecto academico construido con Python, FastAPI, SQLAlchemy, PostgreSQL y React.

## Estructura inicial

- `app/main.py`: punto de entrada de FastAPI.
- `app/config`: configuracion general del proyecto.
- `app/db`: conexion a base de datos y sesion de SQLAlchemy.
- `app/models`: modelos ORM.
- `app/schemas`: DTOs de entrada y salida con Pydantic.
- `app/repositories`: acceso a datos.
- `app/services`: reglas de negocio.
- `app/controllers`: endpoints REST.
- `app/websocket`: comunicacion en tiempo real.
- `app/utils`: funciones auxiliares.
