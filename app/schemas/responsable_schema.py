from pydantic import BaseModel, ConfigDict, EmailStr


class ResponsableBase(BaseModel):
    nombres: str
    apellidos: str
    correo: EmailStr
    telefono: str | None = None
    estado: str = "laborando"


class ResponsableCreate(ResponsableBase):
    pass


class ResponsableResponse(ResponsableBase):
    id_responsable: int

    model_config = ConfigDict(from_attributes=True)


class ResponsableEstadoUpdate(BaseModel):
    estado: str
