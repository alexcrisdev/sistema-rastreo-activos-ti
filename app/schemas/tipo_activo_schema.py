from pydantic import BaseModel, ConfigDict


class TipoActivoBase(BaseModel):
    nombre: str
    
    
class TipoActivoCreate(TipoActivoBase):
    pass


class TipoActivoResponse(TipoActivoBase):
    id_tipo_activo: int
    
    model_config = ConfigDict(from_attributes=True)