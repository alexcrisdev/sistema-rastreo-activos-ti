from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivoBase(BaseModel):
    codigo: str
    nombre: str
    marca: str | None = None
    modelo: str | None = None
    numero_serie: str | None = None
    estado: str = "activo"
    estado_conexion: str = "conectado"
    fuera_empresa: bool = False
    id_tipo_activo: int
    id_responsable: int
    id_area: int
    es_movil: bool = False


class ActivoCreate(ActivoBase):
    pass


class ActivoResponse(ActivoBase):
    id_activo: int
    coord_x_actual: float
    coord_y_actual: float
    fecha_registro: datetime
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivoMovimiento(BaseModel):
    id_area: int
    tipo_movimiento: str = "movimiento_sistema"


class ActivoReubicacion(BaseModel):
    id_area: int


class ActivoReasignacion(BaseModel):
    id_responsable: int
    id_area: int


class ActivoEstadoUpdate(BaseModel):
    estado: str
