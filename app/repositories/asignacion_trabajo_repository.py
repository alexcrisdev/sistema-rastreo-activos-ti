from sqlalchemy.orm import Session

from app.models.asignacion_trabajo import AsignacionTrabajo
from app.schemas.asignacion_trabajo_schema import AsignacionTrabajoCreate
from app.models.area_mapa import AreaMapa


def crear_asignacion_trabajo(
    db: Session,
    asignacion_data: AsignacionTrabajoCreate,
) -> AsignacionTrabajo:
    nueva_asignacion = AsignacionTrabajo(**asignacion_data.model_dump())

    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)

    return nueva_asignacion


def listar_asignaciones_trabajo(db: Session) -> list[AsignacionTrabajo]:
    return db.query(AsignacionTrabajo).all()


def obtener_asignacion_trabajo_por_id(
    db: Session,
    id_asignacion: int,
) -> AsignacionTrabajo | None:
    return (
        db.query(AsignacionTrabajo)
        .filter(AsignacionTrabajo.id_asignacion == id_asignacion)
        .first()
    )


def listar_asignaciones_por_responsable(
    db: Session,
    id_responsable: int,
) -> list[AsignacionTrabajo]:
    return (
        db.query(AsignacionTrabajo)
        .filter(AsignacionTrabajo.id_responsable == id_responsable)
        .all()
    )


def listar_asignaciones_activas_por_responsable(
    db: Session,
    id_responsable: int,
) -> list[AsignacionTrabajo]:
    return (
        db.query(AsignacionTrabajo)
        .filter(AsignacionTrabajo.id_responsable == id_responsable)
        .filter(AsignacionTrabajo.estado == "activo")
        .all()
    )


def finalizar_asignaciones_trabajo(
    db: Session,
    asignaciones: list[AsignacionTrabajo],
) -> list[AsignacionTrabajo]:
    for asignacion in asignaciones:
        asignacion.estado = "finalizado"

    db.commit()

    for asignacion in asignaciones:
        db.refresh(asignacion)

    return asignaciones


def obtener_asignacion_activa_responsable_por_area_nombre(
    db: Session,
    id_responsable: int,
    nombre_area: str,
) -> AsignacionTrabajo | None:
    return (
        db.query(AsignacionTrabajo)
        .join(AreaMapa, AsignacionTrabajo.id_area == AreaMapa.id_area)
        .filter(AsignacionTrabajo.id_responsable == id_responsable)
        .filter(AsignacionTrabajo.estado == "activo")
        .filter(AreaMapa.nombre == nombre_area)
        .first()
    )