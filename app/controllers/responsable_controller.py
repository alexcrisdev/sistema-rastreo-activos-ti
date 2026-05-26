from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.responsable_schema import (
    ResponsableCreate,
    ResponsableEstadoUpdate,
    ResponsableResponse,
)
from app.services.responsable_service import (
    crear_responsable_service,
    listar_responsables_service,
    obtener_responsable_service,
    actualizar_estado_responsable_service,
)

from app.models.usuario import Usuario
from app.utils.auth_dependencies import obtener_usuario_actual

router = APIRouter(
    prefix="/responsables",
    tags=["Responsables"],
)


@router.post(
    "",
    response_model=ResponsableResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_responsable(
    responsable_data: ResponsableCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return crear_responsable_service(db, responsable_data)


@router.get("", response_model=list[ResponsableResponse])
def listar_responsables(db: Session = Depends(get_db)):
    return listar_responsables_service(db)


@router.get("/{id_responsable}", response_model=ResponsableResponse)
def obtener_responsable(
    id_responsable: int,
    db: Session = Depends(get_db),
):
    return obtener_responsable_service(db, id_responsable)


@router.put("/{id_responsable}/estado", response_model=ResponsableResponse)
def actualizar_estado_responsable(
    id_responsable: int,
    estado_data: ResponsableEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    return actualizar_estado_responsable_service(db, id_responsable, estado_data)