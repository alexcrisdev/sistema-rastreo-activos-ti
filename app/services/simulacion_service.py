import random

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.activo import Activo
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
):
    areas = listar_areas_mapa(db)

    if not areas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay áreas registradas para simular movimiento",
        )

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


def simular_movimiento_activos_service(db: Session):
    activos_moviles = listar_activos_moviles(db)

    if not activos_moviles:
        return {
            "message": "No hay activos móviles para simular",
            "total_movidos": 0,
            "activos": [],
        }

    activos_actualizados = [
        _mover_activo_a_area_aleatoria(
            db=db,
            activo=activo,
            tipo_movimiento="simulado",
        )
        for activo in activos_moviles
    ]

    return {
        "message": "Simulación ejecutada correctamente",
        "total_movidos": len(activos_actualizados),
        "activos": activos_actualizados,
    }


def ejecutar_reglas_simulacion_service(db: Session):
    activos_actualizados = []

    celulares = listar_activos_por_tipo(db, "Celular")
    laptops = listar_activos_por_tipo(db, "Laptop")
    fijos_marcados_moviles = listar_activos_fijos_marcados_moviles(db)

    for celular in celulares:
        activos_actualizados.append(
            _mover_activo_a_area_aleatoria(
                db=db,
                activo=celular,
                tipo_movimiento="simulado_celular",
            )
        )

    for laptop in laptops:
        debe_moverse = random.choice([True, False])

        if debe_moverse:
            activos_actualizados.append(
                _mover_activo_a_area_aleatoria(
                    db=db,
                    activo=laptop,
                    tipo_movimiento="simulado_laptop",
                )
            )

    for activo in fijos_marcados_moviles:
        activos_actualizados.append(
            _mover_activo_a_area_aleatoria(
                db=db,
                activo=activo,
                tipo_movimiento="simulado_activo_movil",
            )
        )

    return {
        "message": "Reglas de simulación ejecutadas correctamente",
        "total_movidos": len(activos_actualizados),
        "activos": activos_actualizados,
    }