import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.controllers import (
    activo_router,
    area_mapa_router,
    asignacion_trabajo_router,
    estado_router,
    mapa_router,
    responsable_router,
    simulacion_router,
    tipo_activo_router,
    ubicacion_historial_router,
    websocket_router,
    auth_router,
)
from app.services.simulacion_background_service import ejecutar_simulacion_periodica


@asynccontextmanager
async def lifespan(app: FastAPI):
    tarea_simulacion = asyncio.create_task(ejecutar_simulacion_periodica())

    try:
        yield
    finally:
        tarea_simulacion.cancel()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

app.include_router(estado_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tipo_activo_router)
app.include_router(responsable_router)
app.include_router(area_mapa_router)
app.include_router(activo_router)
app.include_router(ubicacion_historial_router)
app.include_router(asignacion_trabajo_router)
app.include_router(simulacion_router)
app.include_router(websocket_router)
app.include_router(mapa_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Backend del sistema de rastreo de activos funcionando",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }
