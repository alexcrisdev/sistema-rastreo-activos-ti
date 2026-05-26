from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.area_mapa_repository import obtener_area_mapa_por_id
from app.repositories.asignacion_trabajo_repository import (
    crear_asignacion_trabajo,
    listar_asignaciones_por_responsable,
    listar_asignaciones_trabajo,
    obtener_asignacion_trabajo_por_id,
)
from app.repositories.responsable_repository import obtener_responsable_por_id
from app.schemas.asignacion_trabajo_schema import AsignacionTrabajoCreate


def crear_asignacion_trabajo_service(
    db: Session,
    asignacion_data: AsignacionTrabajoCreate,
):
    responsable = obtener_responsable_por_id(db, asignacion_data.id_responsable)
    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )
        
    if responsable.estado == "fuera_de_labores":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede crear una asignación para un responsable fuera de labores",
        )        

    area = obtener_area_mapa_por_id(db, asignacion_data.id_area)
    if area is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Área de mapa no encontrada",
        )

    return crear_asignacion_trabajo(db, asignacion_data)


def listar_asignaciones_trabajo_service(db: Session):
    return listar_asignaciones_trabajo(db)


def obtener_asignacion_trabajo_service(db: Session, id_asignacion: int):
    asignacion = obtener_asignacion_trabajo_por_id(db, id_asignacion)

    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación de trabajo no encontrada",
        )

    return asignacion


def listar_asignaciones_por_responsable_service(
    db: Session,
    id_responsable: int,
):
    responsable = obtener_responsable_por_id(db, id_responsable)

    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )

    return listar_asignaciones_por_responsable(db, id_responsable)
