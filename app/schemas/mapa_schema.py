from pydantic import BaseModel, ConfigDict

from app.schemas.activo_schema import ActivoResponse
from app.schemas.area_mapa_schema import AreaMapaResponse


class AlertaActivoFueraEmpresa(BaseModel):
    id_activo: int
    codigo: str
    responsable: str
    estado_conexion: str
    mensaje: str


class MapaDatosResponse(BaseModel):
    areas: list[AreaMapaResponse]
    activos: list[ActivoResponse]
    alertas: list[AlertaActivoFueraEmpresa]

    model_config = ConfigDict(from_attributes=True)