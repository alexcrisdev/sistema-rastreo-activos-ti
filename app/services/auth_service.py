from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.repositories.asignacion_trabajo_repository import (
    obtener_asignacion_activa_responsable_por_area_nombre,
)
from app.repositories.responsable_repository import obtener_responsable_por_id
from app.repositories.usuario_repository import (
    crear_usuario,
    obtener_usuario_por_nombre,
    obtener_usuario_por_responsable,
)
from app.schemas.auth_schema import UsuarioLogin, UsuarioRegister
from app.utils.security import (
    crear_access_token,
    generar_hash_password,
    verificar_password,
)


def registrar_usuario_service(db: Session, usuario_data: UsuarioRegister):
    if usuario_data.codigo_registro != settings.register_code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Código de registro inválido",
        )

    usuario_existente = obtener_usuario_por_nombre(db, usuario_data.usuario)

    if usuario_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya existe",
        )

    responsable = obtener_responsable_por_id(db, usuario_data.id_responsable)

    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )

    if responsable.estado != "laborando":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede crear usuario a responsables que estén laborando",
        )

    asignacion_sistemas = obtener_asignacion_activa_responsable_por_area_nombre(
        db=db,
        id_responsable=usuario_data.id_responsable,
        nombre_area="TI / Sistemas",
    )

    if asignacion_sistemas is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo responsables asignados al área TI / Sistemas pueden tener usuario",
        )

    usuario_responsable = obtener_usuario_por_responsable(
        db,
        usuario_data.id_responsable,
    )

    if usuario_responsable is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El responsable ya tiene un usuario asociado",
        )

    password_hash = generar_hash_password(usuario_data.password)

    return crear_usuario(
        db=db,
        usuario=usuario_data.usuario,
        password_hash=password_hash,
        id_responsable=usuario_data.id_responsable,
    )


def login_usuario_service(db: Session, login_data: UsuarioLogin):
    usuario = obtener_usuario_por_nombre(db, login_data.usuario)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario deshabilitado",
        )

    password_valido = verificar_password(
        login_data.password,
        usuario.password_hash,
    )

    if not password_valido:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token = crear_access_token(
        data={
            "sub": usuario.usuario,
            "id_usuario": usuario.id_usuario,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }