from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services import simulacion_estado
from app.services.simulacion_service import (
    ejecutar_reglas_simulacion_service,
    simular_movimiento_activos_service,
)
from app.websocket.connection_manager import manager

from app.models.usuario import Usuario
from app.utils.auth_dependencies import obtener_usuario_actual

router = APIRouter(
    prefix="/simulacion",
    tags=["Simulación"],
)


@router.post("/mover-activos")
async def simular_movimiento_activos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    resultado = simular_movimiento_activos_service(db)

    if resultado["total_movidos"] > 0:
        await manager.broadcast(
            {
                "type": "activos_actualizados",
                "data": resultado["activos"],
            }
        )

    return resultado


@router.post("/ejecutar-reglas")
async def ejecutar_reglas_simulacion(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    resultado = ejecutar_reglas_simulacion_service(db)

    if resultado["total_movidos"] > 0:
        await manager.broadcast(
            {
                "type": "activos_actualizados",
                "data": resultado["activos"],
            }
        )

    return resultado


@router.post("/iniciar")
def iniciar_simulacion(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    simulacion_estado.simulacion_activa = True

    return {
        "message": "Simulación automática iniciada",
        "activa": simulacion_estado.simulacion_activa,
    }


@router.post("/detener")
def detener_simulacion(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    simulacion_estado.simulacion_activa = False

    return {
        "message": "Simulación automática detenida",
        "activa": simulacion_estado.simulacion_activa,
    }


@router.get("/estado")
def obtener_estado_simulacion():
    return {
        "activa": simulacion_estado.simulacion_activa,
    }