from pydantic import BaseModel, ConfigDict


class UsuarioRegister(BaseModel):
    usuario: str
    password: str
    codigo_registro: str
    id_responsable: int


class UsuarioLogin(BaseModel):
    usuario: str
    password: str


class UsuarioResponse(BaseModel):
    id_usuario: int
    usuario: str
    activo: bool
    id_responsable: int

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"