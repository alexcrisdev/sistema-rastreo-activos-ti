from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UbicacionHistorialBase(BaseModel):
    id_activo: int
    id_area: int
    coord_x: float
    coord_y: float
    tipo_movimiento: str


class UbicacionHistorialCreate(UbicacionHistorialBase):
    pass


class UbicacionHistorialResponse(UbicacionHistorialBase):
    id_historial: int
    fecha_hora: datetime

    model_config = ConfigDict(from_attributes=True)
