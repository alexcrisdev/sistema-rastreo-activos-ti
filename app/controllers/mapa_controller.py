from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.mapa_schema import MapaDatosResponse
from app.services.mapa_service import obtener_datos_mapa_service


router = APIRouter(
    prefix="/mapa",
    tags=["Mapa"],
)


@router.get("/datos", response_model=MapaDatosResponse)
def obtener_datos_mapa(db: Session = Depends(get_db)):
    return obtener_datos_mapa_service(db)