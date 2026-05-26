from sqlalchemy.orm import Session

from app.models.tipo_activo import TipoActivo
from app.schemas.tipo_activo_schema import TipoActivoCreate


def crear_tipo_activo(db: Session, tipo_activo_data: TipoActivoCreate) -> TipoActivo:
    nuevo_tipo_activo = TipoActivo(**tipo_activo_data.model_dump())
    
    db.add(nuevo_tipo_activo)
    db.commit()
    db.refresh(nuevo_tipo_activo)
    
    return nuevo_tipo_activo


def listar_tipos_activo(db: Session) -> list[TipoActivo]:
    return db.query(TipoActivo).all()


def obtener_tipo_activo_por_id(
    db: Session,
    id_tipo_activo: int,
) -> TipoActivo | None:
    return (
        db.query(TipoActivo)
        .filter(TipoActivo.id_tipo_activo == id_tipo_activo)
        .first()
    )