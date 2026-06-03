import random

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activo import Activo
from app.models.area_mapa import AreaMapa
from app.repositories.activo_repository import (
    actualizar_ubicacion_activo,
    listar_activos_fijos_marcados_moviles,
    listar_activos_moviles,
    listar_activos_por_tipo,
)
from app.repositories.area_mapa_repository import listar_areas_mapa
from app.repositories.ubicacion_historial_repository import crear_historial_ubicacion
from app.utils.coordenadas import generar_coordenadas_en_area


def _mover_activo_a_area_aleatoria(
    db: Session,
    activo: Activo,
    tipo_movimiento: str,
    area_destino: AreaMapa | None = None,
):
    areas = listar_areas_mapa(db)

    if not areas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay áreas registradas para simular movimiento",
        )

    if area_destino is None:
        area_destino = random.choice(areas)
    coord_x, coord_y = generar_coordenadas_en_area(area_destino)

    activo_actualizado = actualizar_ubicacion_activo(
        db=db,
        activo=activo,
        id_area=area_destino.id_area,
        coord_x=coord_x,
        coord_y=coord_y,
    )

    crear_historial_ubicacion(
        db=db,
        id_activo=activo_actualizado.id_activo,
        id_area=activo_actualizado.id_area,
        coord_x=activo_actualizado.coord_x_actual,
        coord_y=activo_actualizado.coord_y_actual,
        tipo_movimiento=tipo_movimiento,
    )

    return {
        "id_activo": activo_actualizado.id_activo,
        "codigo": activo_actualizado.codigo,
        "id_area": activo_actualizado.id_area,
        "coord_x_actual": activo_actualizado.coord_x_actual,
        "coord_y_actual": activo_actualizado.coord_y_actual,
        "tipo_movimiento": tipo_movimiento,
    }


def _mover_activos_con_coherencia_por_responsable(
    db: Session,
    activos_con_tipo_movimiento: list[tuple[Activo, str]],
):
    areas = listar_areas_mapa(db)

    if not areas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay áreas registradas para simular movimiento",
        )

    areas_por_responsable = {}
    activos_actualizados = []

    for activo, tipo_movimiento in activos_con_tipo_movimiento:
        area_destino = None

        if activo.id_responsable is not None:
            area_destino = areas_por_responsable.get(activo.id_responsable)

            if area_destino is None:
                area_destino = random.choice(areas)
                areas_por_responsable[activo.id_responsable] = area_destino

        activos_actualizados.append(
            _mover_activo_a_area_aleatoria(
                db=db,
                activo=activo,
                tipo_movimiento=tipo_movimiento,
                area_destino=area_destino,
            )
        )

    return activos_actualizados


def simular_movimiento_activos_service(db: Session):
    activos_moviles = listar_activos_moviles(db)

    if not activos_moviles:
        return {
            "message": "No hay activos móviles para simular",
            "total_movidos": 0,
            "activos": [],
        }

    activos_actualizados = _mover_activos_con_coherencia_por_responsable(
        db=db,
        activos_con_tipo_movimiento=[
            (activo, "simulado")
            for activo in activos_moviles
        ],
    )

    return {
        "message": "Simulación ejecutada correctamente",
        "total_movidos": len(activos_actualizados),
        "activos": activos_actualizados,
    }


def ejecutar_reglas_simulacion_service(db: Session):
    activos_para_mover = []

    celulares = listar_activos_por_tipo(db, "Celular")
    laptops = listar_activos_por_tipo(db, "Laptop")
    fijos_marcados_moviles = listar_activos_fijos_marcados_moviles(db)

    for celular in celulares:
        activos_para_mover.append((celular, "simulado_celular"))

    for laptop in laptops:
        debe_moverse = random.choice([True, False])

        if debe_moverse:
            activos_para_mover.append((laptop, "simulado_laptop"))

    for activo in fijos_marcados_moviles:
        activos_para_mover.append((activo, "simulado_activo_movil"))

    activos_actualizados = _mover_activos_con_coherencia_por_responsable(
        db=db,
        activos_con_tipo_movimiento=activos_para_mover,
    )

    return {
        "message": "Reglas de simulación ejecutadas correctamente",
        "total_movidos": len(activos_actualizados),
        "activos": activos_actualizados,
    }
