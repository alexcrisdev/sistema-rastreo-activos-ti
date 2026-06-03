from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.activo_schema import (
    ActivoCreate,
    ActivoMovimiento,
    ActivoReasignacion,
    ActivoResponse,
    ActivoReubicacion,
)

from app.services.activo_service import (
    buscar_activo_por_codigo_service,
    crear_activo_service,
    listar_activos_service,
    marcar_activo_fuera_empresa_service,
    mover_activo_service,
    obtener_activo_service,
    reasignar_activo_service,
    reubicar_activo_en_empresa_service,
)

from app.models.usuario import Usuario
from app.utils.auth_dependencies import obtener_usuario_actual

router = APIRouter(
    prefix="/activos",
    tags=["Activos"],
)


@router.post(
    "",
    response_model=ActivoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_activo(
    activo_data: ActivoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return crear_activo_service(db, activo_data)


@router.get("", response_model=list[ActivoResponse])
def listar_activos(db: Session = Depends(get_db)):
    return listar_activos_service(db)


@router.get("/buscar", response_model=ActivoResponse)
def buscar_activo_por_codigo(
    codigo: str,
    db: Session = Depends(get_db),
):
    return buscar_activo_por_codigo_service(db, codigo)


@router.put("/{id_activo}/mover", response_model=ActivoResponse)
def mover_activo(
    id_activo: int,
    movimiento_data: ActivoMovimiento,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return mover_activo_service(db, id_activo, movimiento_data)


@router.get("/{id_activo}", response_model=ActivoResponse)
def obtener_activo(
    id_activo: int,
    db: Session = Depends(get_db),
):
    return obtener_activo_service(db, id_activo)


@router.put("/{id_activo}/fuera-empresa", response_model=ActivoResponse)
def marcar_activo_fuera_empresa(
    id_activo: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return marcar_activo_fuera_empresa_service(db, id_activo)


@router.put("/{id_activo}/reubicar", response_model=ActivoResponse)
def reubicar_activo_en_empresa(
    id_activo: int,
    reubicacion_data: ActivoReubicacion,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return reubicar_activo_en_empresa_service(db, id_activo, reubicacion_data)


@router.put("/{id_activo}/reasignar", response_model=ActivoResponse)
def reasignar_activo(
    id_activo: int,
    reasignacion_data: ActivoReasignacion,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return reasignar_activo_service(db, id_activo, reasignacion_data)
