from sqlalchemy.orm import Session

from app.models.usuario import Usuario


def obtener_usuario_por_nombre(db: Session, usuario: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.usuario == usuario).first()


def crear_usuario(
    db: Session,
    usuario: str,
    password_hash: str,
    id_responsable: int | None = None,
) -> Usuario:
    nuevo_usuario = Usuario(
        usuario=usuario,
        password_hash=password_hash,
        id_responsable=id_responsable,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


def obtener_usuario_por_responsable(
    db: Session,
    id_responsable: int,
) -> Usuario | None:
    return (
        db.query(Usuario)
        .filter(Usuario.id_responsable == id_responsable)
        .first()
    )