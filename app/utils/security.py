from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.config.settings import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generar_hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verificar_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def crear_access_token(data: dict) -> str:
    datos_token = data.copy()

    expiracion = datetime.utcnow() + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    datos_token.update({"exp": expiracion})

    return jwt.encode(
        datos_token,
        settings.secret_key,
        algorithm=settings.algorithm,
    )