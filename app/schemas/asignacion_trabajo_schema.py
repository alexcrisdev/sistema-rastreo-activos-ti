from datetime import date

from pydantic import BaseModel, ConfigDict


class AsignacionTrabajoBase(BaseModel):
    id_responsable: int
    id_area: int
    fecha_inicio: date
    fecha_fin: date | None = None
    estado: str = "activo"


class AsignacionTrabajoCreate(AsignacionTrabajoBase):
    pass


class AsignacionTrabajoResponse(AsignacionTrabajoBase):
    id_asignacion: int

    model_config = ConfigDict(from_attributes=True)
