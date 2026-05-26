from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.asignacion_trabajo_schema import (
    AsignacionTrabajoCreate,
    AsignacionTrabajoResponse,
)
from app.services.asignacion_trabajo_service import (
    crear_asignacion_trabajo_service,
    listar_asignaciones_por_responsable_service,
    listar_asignaciones_trabajo_service,
    obtener_asignacion_trabajo_service,
)

from app.models.usuario import Usuario
from app.utils.auth_dependencies import obtener_usuario_actual


router = APIRouter(
    prefix="/asignaciones-trabajo",
    tags=["Asignaciones de trabajo"],
)


@router.post(
    "",
    response_model=AsignacionTrabajoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_asignacion_trabajo(
    asignacion_data: AsignacionTrabajoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return crear_asignacion_trabajo_service(db, asignacion_data)


@router.get("", response_model=list[AsignacionTrabajoResponse])
def listar_asignaciones_trabajo(db: Session = Depends(get_db)):
    return listar_asignaciones_trabajo_service(db)


@router.get(
    "/responsable/{id_responsable}",
    response_model=list[AsignacionTrabajoResponse],
)
def listar_asignaciones_por_responsable(
    id_responsable: int,
    db: Session = Depends(get_db),
):
    return listar_asignaciones_por_responsable_service(db, id_responsable)


@router.get("/{id_asignacion}", response_model=AsignacionTrabajoResponse)
def obtener_asignacion_trabajo(
    id_asignacion: int,
    db: Session = Depends(get_db),
):
    return obtener_asignacion_trabajo_service(db, id_asignacion)
