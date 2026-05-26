from sqlalchemy.orm import Session

from app.models.responsable import Responsable
from app.schemas.responsable_schema import ResponsableCreate


def crear_responsable(
    db: Session,
    responsable_data: ResponsableCreate,
) -> Responsable:
    nuevo_responsable = Responsable(**responsable_data.model_dump())

    db.add(nuevo_responsable)
    db.commit()
    db.refresh(nuevo_responsable)

    return nuevo_responsable


def listar_responsables(db: Session) -> list[Responsable]:
    return db.query(Responsable).all()


def obtener_responsable_por_id(
    db: Session,
    id_responsable: int,
) -> Responsable | None:
    return (
        db.query(Responsable)
        .filter(Responsable.id_responsable == id_responsable)
        .first()
    )


def actualizar_estado_responsable(
    db: Session,
    responsable: Responsable,
    estado: str,
) -> Responsable:
    responsable.estado = estado

    db.commit()
    db.refresh(responsable)

    return responsable