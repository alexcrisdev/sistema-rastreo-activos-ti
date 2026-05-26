import random

from app.models.area_mapa import AreaMapa


def generar_coordenadas_en_area(area: AreaMapa) -> tuple[float, float]:
    coord_x = random.uniform(area.coord_x_inicio, area.coord_x_fin)
    coord_y = random.uniform(area.coord_y_inicio, area.coord_y_fin)

    return round(coord_x, 2), round(coord_y, 2)
