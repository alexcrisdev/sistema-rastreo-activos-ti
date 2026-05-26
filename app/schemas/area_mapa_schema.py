from pydantic import BaseModel, ConfigDict


class AreaMapaBase(BaseModel):
    nombre: str
    coord_x_inicio: int
    coord_y_inicio: int
    coord_x_fin: int
    coord_y_fin: int


class AreaMapaCreate(AreaMapaBase):
    pass


class AreaMapaResponse(AreaMapaBase):
    id_area: int

    model_config = ConfigDict(from_attributes=True)
