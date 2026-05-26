from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.activo_repository import obtener_activo_por_id
from app.repositories.ubicacion_historial_repository import (
    listar_historial_por_activo,
)


def listar_historial_por_activo_service(db: Session, id_activo: int):
    activo = obtener_activo_por_id(db, id_activo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    return listar_historial_por_activo(db, id_activo)
