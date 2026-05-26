from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.tipo_activo_schema import TipoActivoCreate, TipoActivoResponse
from app.services.tipo_activo_service import (
    crear_tipo_activo_service,
    listar_tipos_activo_service,
    obtener_tipo_activo_service,
)


router = APIRouter(
    prefix="/tipos-activo",
    tags=["Tipos de activo"],
)


@router.post(
    "",
    response_model=TipoActivoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_tipo_activo(
    tipo_activo_data: TipoActivoCreate,
    db: Session = Depends(get_db),
):
    return crear_tipo_activo_service(db, tipo_activo_data)


@router.get("", response_model=list[TipoActivoResponse])
def listar_tipos_activo(db: Session = Depends(get_db)):
    return listar_tipos_activo_service(db)


@router.get("/{id_tipo_activo}", response_model=TipoActivoResponse)
def obtener_tipo_activo(
    id_tipo_activo: int,
    db: Session = Depends(get_db),
):
    return obtener_tipo_activo_service(db, id_tipo_activo)
