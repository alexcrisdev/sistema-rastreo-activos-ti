from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.activo_repository import (
    actualizar_ubicacion_activo,
    crear_activo,
    listar_activos,
    marcar_activo_fuera_empresa,
    obtener_activo_por_codigo,
    obtener_activo_por_id,
    reubicar_activo_en_empresa,
)

from app.repositories.area_mapa_repository import obtener_area_mapa_por_id
from app.repositories.responsable_repository import obtener_responsable_por_id
from app.repositories.tipo_activo_repository import obtener_tipo_activo_por_id
from app.repositories.ubicacion_historial_repository import crear_historial_ubicacion
from app.schemas.activo_schema import ActivoCreate, ActivoMovimiento, ActivoReubicacion
from app.utils.coordenadas import generar_coordenadas_en_area


def crear_activo_service(db: Session, activo_data: ActivoCreate):
    tipo_activo = obtener_tipo_activo_por_id(db, activo_data.id_tipo_activo)
    if tipo_activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de activo no encontrado",
        )

    responsable = obtener_responsable_por_id(db, activo_data.id_responsable)
    if responsable is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Responsable no encontrado",
        )
        
    if responsable.estado == "fuera_de_labores":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede asignar un activo a un responsable fuera de labores",
        )        

    area = obtener_area_mapa_por_id(db, activo_data.id_area)
    if area is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Área de mapa no encontrada",
        )

    activo_existente = obtener_activo_por_codigo(db, activo_data.codigo)
    if activo_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un activo con ese código",
        )

    coord_x, coord_y = generar_coordenadas_en_area(area)

    nuevo_activo = crear_activo(
        db=db,
        activo_data=activo_data,
        coord_x=coord_x,
        coord_y=coord_y,
    )

    crear_historial_ubicacion(
        db=db,
        id_activo=nuevo_activo.id_activo,
        id_area=nuevo_activo.id_area,
        coord_x=nuevo_activo.coord_x_actual,
        coord_y=nuevo_activo.coord_y_actual,
        tipo_movimiento="registro_inicial",
    )

    return nuevo_activo


def listar_activos_service(db: Session):
    return listar_activos(db)


def obtener_activo_service(db: Session, id_activo: int):
    activo = obtener_activo_por_id(db, id_activo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    return activo


def buscar_activo_por_codigo_service(db: Session, codigo: str):
    activo = obtener_activo_por_codigo(db, codigo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    return activo


def mover_activo_service(
    db: Session,
    id_activo: int,
    movimiento_data: ActivoMovimiento,
):
    activo = obtener_activo_por_id(db, id_activo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    area = obtener_area_mapa_por_id(db, movimiento_data.id_area)

    if area is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Área de mapa no encontrada",
        )

    coord_x, coord_y = generar_coordenadas_en_area(area)

    activo_actualizado = actualizar_ubicacion_activo(
        db=db,
        activo=activo,
        id_area=area.id_area,
        coord_x=coord_x,
        coord_y=coord_y,
    )

    crear_historial_ubicacion(
        db=db,
        id_activo=activo_actualizado.id_activo,
        id_area=activo_actualizado.id_area,
        coord_x=activo_actualizado.coord_x_actual,
        coord_y=activo_actualizado.coord_y_actual,
        tipo_movimiento=movimiento_data.tipo_movimiento,
    )

    return activo_actualizado


def marcar_activo_fuera_empresa_service(db: Session, id_activo: int):
    activo = obtener_activo_por_id(db, id_activo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    activo_actualizado = marcar_activo_fuera_empresa(db, activo)

    crear_historial_ubicacion(
        db=db,
        id_activo=activo_actualizado.id_activo,
        id_area=activo_actualizado.id_area,
        coord_x=activo_actualizado.coord_x_actual,
        coord_y=activo_actualizado.coord_y_actual,
        tipo_movimiento="fuera_empresa",
    )

    return activo_actualizado


def reubicar_activo_en_empresa_service(
    db: Session,
    id_activo: int,
    reubicacion_data: ActivoReubicacion,
):
    activo = obtener_activo_por_id(db, id_activo)

    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activo no encontrado",
        )

    area = obtener_area_mapa_por_id(db, reubicacion_data.id_area)

    if area is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Área de mapa no encontrada",
        )

    coord_x, coord_y = generar_coordenadas_en_area(area)

    activo_actualizado = reubicar_activo_en_empresa(
        db=db,
        activo=activo,
        id_area=area.id_area,
        coord_x=coord_x,
        coord_y=coord_y,
    )

    crear_historial_ubicacion(
        db=db,
        id_activo=activo_actualizado.id_activo,
        id_area=activo_actualizado.id_area,
        coord_x=activo_actualizado.coord_x_actual,
        coord_y=activo_actualizado.coord_y_actual,
        tipo_movimiento="reubicado_empresa",
    )

    return activo_actualizado