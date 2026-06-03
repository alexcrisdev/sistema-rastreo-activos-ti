from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuario import Usuario
from app.repositories.activo_repository import (
    listar_activos_por_responsable,
    marcar_activos_pendiente_reasignacion,
    obtener_activo_por_id,
)
from app.repositories.responsable_repository import obtener_responsable_por_id
from app.repositories.usuario_repository import obtener_usuario_por_responsable
from app.schemas.activo_schema import ActivoEstadoUpdate, ActivoResponse
from app.schemas.responsable_schema import ResponsableEstadoUpdate, ResponsableResponse
from app.utils.auth_dependencies import obtener_usuario_actual


router = APIRouter(tags=["Estados"])


@router.put("/activos/{id_activo}/estado", response_model=ActivoResponse)
def actualizar_estado_activo(
    id_activo: int,
    estado_data: ActivoEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    estados_permitidos = {
        "activo",
        "mantenimiento",
        "baja",
        "pendiente_reasignacion",
    }

    if estado_data.estado not in estados_permitidos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de activo no permitido",
        )

    activo = obtener_activo_por_id(db, id_activo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    activo.estado = estado_data.estado

    if estado_data.estado == "baja":
        activo.estado_conexion = "desconectado"
        activo.fuera_empresa = True

    db.commit()
    db.refresh(activo)

    return activo


@router.put("/responsables/{id_responsable}/estado", response_model=ResponsableResponse)
def actualizar_estado_responsable(
    id_responsable: int,
    estado_data: ResponsableEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    estados_permitidos = {"laborando", "fuera_de_labores"}

    if estado_data.estado not in estados_permitidos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de responsable no permitido",
        )

    responsable = obtener_responsable_por_id(db, id_responsable)

    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )

    responsable.estado = estado_data.estado

    if estado_data.estado == "fuera_de_labores":
        usuario = obtener_usuario_por_responsable(db, id_responsable)

        if usuario is not None:
            usuario.activo = False

        activos = listar_activos_por_responsable(db, id_responsable)
        marcar_activos_pendiente_reasignacion(db, activos)

    db.commit()
    db.refresh(responsable)

    return responsable
