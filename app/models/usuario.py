from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    activo = Column(Boolean, nullable=False, default=True)

    id_responsable = Column(
        Integer,
        ForeignKey("responsable.id_responsable"),
        nullable=True,
        unique=True,
    )

    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)

    responsable = relationship("Responsable")