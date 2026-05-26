from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.activo_repository import (
    listar_activos_por_responsable,
    marcar_activos_pendiente_reasignacion,
)
from app.repositories.asignacion_trabajo_repository import (
    finalizar_asignaciones_trabajo,
    listar_asignaciones_activas_por_responsable,
)
from app.repositories.responsable_repository import (
    actualizar_estado_responsable,
    crear_responsable,
    listar_responsables,
    obtener_responsable_por_id,
)
from app.schemas.responsable_schema import ResponsableCreate, ResponsableEstadoUpdate


def crear_responsable_service(db: Session, responsable_data: ResponsableCreate):
    return crear_responsable(db, responsable_data)


def listar_responsables_service(db: Session):
    return listar_responsables(db)


def obtener_responsable_service(db: Session, id_responsable: int):
    responsable = obtener_responsable_por_id(db, id_responsable)
    
    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )
        
    return responsable


def actualizar_estado_responsable_service(
    db: Session,
    id_responsable: int,
    estado_data: ResponsableEstadoUpdate,
):
    estados_validos = ["laborando", "fuera_de_labores"]

    if estado_data.estado not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de responsable inválido",
        )

    responsable = obtener_responsable_por_id(db, id_responsable)

    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )

    responsable_actualizado = actualizar_estado_responsable(
        db=db,
        responsable=responsable,
        estado=estado_data.estado,
    )

    if estado_data.estado == "fuera_de_labores":
        activos = listar_activos_por_responsable(db, id_responsable)
        marcar_activos_pendiente_reasignacion(db, activos)

        asignaciones = listar_asignaciones_activas_por_responsable(
            db,
            id_responsable,
        )
        finalizar_asignaciones_trabajo(db, asignaciones)

    return responsable_actualizado