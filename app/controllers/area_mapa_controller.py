from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.area_mapa_schema import AreaMapaCreate, AreaMapaResponse
from app.services.area_mapa_service import (
    crear_area_mapa_service,
    listar_areas_mapa_service,
    obtener_area_mapa_service,
)


router = APIRouter(
    prefix="/areas-mapa",
    tags=["Áreas del mapa"],
)


@router.post(
    "",
    response_model=AreaMapaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_area_mapa(
    area_data: AreaMapaCreate,
    db: Session = Depends(get_db),
):
    return crear_area_mapa_service(db, area_data)


@router.get("", response_model=list[AreaMapaResponse])
def listar_areas_mapa(db: Session = Depends(get_db)):
    return listar_areas_mapa_service(db)


@router.get("/{id_area}", response_model=AreaMapaResponse)
def obtener_area_mapa(
    id_area: int,
    db: Session = Depends(get_db),
):
    return obtener_area_mapa_service(db, id_area)
