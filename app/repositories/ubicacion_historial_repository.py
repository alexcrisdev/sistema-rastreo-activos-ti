from sqlalchemy.orm import Session

from app.models.ubicacion_historial import UbicacionHistorial


def crear_historial_ubicacion(
    db: Session,
    id_activo: int,
    id_area: int,
    coord_x: float,
    coord_y: float,
    tipo_movimiento: str,
) -> UbicacionHistorial:
    nuevo_historial = UbicacionHistorial(
        id_activo=id_activo,
        id_area=id_area,
        coord_x=coord_x,
        coord_y=coord_y,
        tipo_movimiento=tipo_movimiento,
    )

    db.add(nuevo_historial)
    db.commit()
    db.refresh(nuevo_historial)

    return nuevo_historial


def listar_historial_por_activo(
    db: Session,
    id_activo: int,
) -> list[UbicacionHistorial]:
    return (
        db.query(UbicacionHistorial)
        .filter(UbicacionHistorial.id_activo == id_activo)
        .order_by(UbicacionHistorial.fecha_hora.desc())
        .all()
    )
