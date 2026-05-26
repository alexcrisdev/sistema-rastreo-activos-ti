from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ubicacion_historial_schema import UbicacionHistorialResponse
from app.services.ubicacion_historial_service import (
    listar_historial_por_activo_service,
)


router = APIRouter(
    prefix="/activos",
    tags=["Historial de ubicación"],
)


@router.get(
    "/{id_activo}/historial",
    response_model=list[UbicacionHistorialResponse],
)
def listar_historial_por_activo(
    id_activo: int,
    db: Session = Depends(get_db),
):
    return listar_historial_por_activo_service(db, id_activo)
