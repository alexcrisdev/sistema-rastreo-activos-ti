from sqlalchemy.orm import Session

from app.models.area_mapa import AreaMapa
from app.schemas.area_mapa_schema import AreaMapaCreate


def crear_area_mapa(db: Session, area_data: AreaMapaCreate) -> AreaMapa:
    nueva_area = AreaMapa(**area_data.model_dump())

    db.add(nueva_area)
    db.commit()
    db.refresh(nueva_area)

    return nueva_area


def listar_areas_mapa(db: Session) -> list[AreaMapa]:
    return db.query(AreaMapa).all()


def obtener_area_mapa_por_id(
    db: Session,
    id_area: int,
) -> AreaMapa | None:
    return (
        db.query(AreaMapa)
        .filter(AreaMapa.id_area == id_area)
        .first()
    )


def listar_todas_las_areas(db: Session) -> list[AreaMapa]:
    return db.query(AreaMapa).all()
