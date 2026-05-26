from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.area_mapa_repository import (
    crear_area_mapa,
    listar_areas_mapa,
    obtener_area_mapa_por_id,
)
from app.schemas.area_mapa_schema import AreaMapaCreate


def crear_area_mapa_service(db: Session, area_data: AreaMapaCreate):
    return crear_area_mapa(db, area_data)


def listar_areas_mapa_service(db: Session):
    return listar_areas_mapa(db)


def obtener_area_mapa_service(db: Session, id_area: int):
    area = obtener_area_mapa_por_id(db, id_area)

    if area is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Área de mapa no encontrada",
        )

    return area
