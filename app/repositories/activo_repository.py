from sqlalchemy.orm import Session

from app.models.activo import Activo
from app.schemas.activo_schema import ActivoCreate
from app.models.tipo_activo import TipoActivo


def crear_activo(
    db: Session,
    activo_data: ActivoCreate,
    coord_x: float,
    coord_y: float,
) -> Activo:
    nuevo_activo = Activo(
        **activo_data.model_dump(),
        coord_x_actual=coord_x,
        coord_y_actual=coord_y,
    )

    db.add(nuevo_activo)
    db.commit()
    db.refresh(nuevo_activo)

    return nuevo_activo


def listar_activos(db: Session) -> list[Activo]:
    return db.query(Activo).all()


def obtener_activo_por_id(db: Session, id_activo: int) -> Activo | None:
    return db.query(Activo).filter(Activo.id_activo == id_activo).first()


def obtener_activo_por_codigo(db: Session, codigo: str) -> Activo | None:
    return db.query(Activo).filter(Activo.codigo == codigo).first()


def actualizar_ubicacion_activo(
    db: Session,
    activo: Activo,
    id_area: int,
    coord_x: float,
    coord_y: float,
) -> Activo:
    activo.id_area = id_area
    activo.coord_x_actual = coord_x
    activo.coord_y_actual = coord_y

    db.commit()
    db.refresh(activo)

    return activo


def listar_activos_moviles(db: Session) -> list[Activo]:
    return db.query(Activo).filter(Activo.es_movil.is_(True)).all()


def listar_activos_por_tipo_nombre(
    db: Session,
    nombre_tipo: str,
) -> list[Activo]:
    return (
        db.query(Activo)
        .join(Activo.tipo_activo)
        .filter(Activo.tipo_activo.has(nombre=nombre_tipo))
        .all()
    )


def listar_activos_por_tipo(
    db: Session,
    nombre_tipo: str,
) -> list[Activo]:
    return (
        db.query(Activo)
        .join(Activo.tipo_activo)
        .filter(TipoActivo.nombre == nombre_tipo)
        .all()
    )


def listar_activos_fijos_marcados_moviles(db: Session) -> list[Activo]:
    tipos_fijos = ["PC", "Router", "Impresora"]

    return (
        db.query(Activo)
        .join(Activo.tipo_activo)
        .filter(TipoActivo.nombre.in_(tipos_fijos))
        .filter(Activo.es_movil.is_(True))
        .all()
    )
    

def marcar_activo_fuera_empresa(db: Session, activo: Activo) -> Activo:
    activo.estado_conexion = "desconectado"
    activo.fuera_empresa = True

    db.commit()
    db.refresh(activo)

    return activo


def reubicar_activo_en_empresa(
    db: Session,
    activo: Activo,
    id_area: int,
    coord_x: float,
    coord_y: float,
) -> Activo:
    activo.id_area = id_area
    activo.coord_x_actual = coord_x
    activo.coord_y_actual = coord_y
    activo.estado_conexion = "conectado"
    activo.fuera_empresa = False

    db.commit()
    db.refresh(activo)

    return activo


def listar_activos_por_responsable(
    db: Session,
    id_responsable: int,
) -> list[Activo]:
    return (
        db.query(Activo)
        .filter(Activo.id_responsable == id_responsable)
        .all()
    )


def marcar_activos_pendiente_reasignacion(
    db: Session,
    activos: list[Activo],
) -> list[Activo]:
    for activo in activos:
        activo.estado = "pendiente_reasignacion"

    db.commit()

    for activo in activos:
        db.refresh(activo)

    return activos