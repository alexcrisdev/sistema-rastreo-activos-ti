from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.tipo_activo_repository import (
    crear_tipo_activo,
    listar_tipos_activo,
    obtener_tipo_activo_por_id,
)
from app.schemas.tipo_activo_schema import TipoActivoCreate


def crear_tipo_activo_service(db: Session, tipo_activo_data: TipoActivoCreate):
    return crear_tipo_activo(db, tipo_activo_data)


def listar_tipos_activo_service(db: Session):
    return listar_tipos_activo(db)


def obtener_tipo_activo_service(db: Session, id_tipo_activo: int):
    tipo_activo = obtener_tipo_activo_por_id(db, id_tipo_activo)
    
    if tipo_activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de activo no encontrado",
        )
        
    return tipo_activo