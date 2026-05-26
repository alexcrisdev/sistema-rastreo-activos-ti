from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth_schema import (
    TokenResponse,
    UsuarioLogin,
    UsuarioRegister,
    UsuarioResponse,
)
from app.services.auth_service import (
    login_usuario_service,
    registrar_usuario_service,
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)


@router.post(
    "/register",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_usuario(
    usuario_data: UsuarioRegister,
    db: Session = Depends(get_db),
):
    return registrar_usuario_service(db, usuario_data)


@router.post("/login", response_model=TokenResponse)
def login_usuario(
    login_data: UsuarioLogin,
    db: Session = Depends(get_db),
):
    return login_usuario_service(db, login_data)