from sqlalchemy import Column, Integer, String

from app.db.database import Base


class Responsable(Base):
    __tablename__ = "responsable"

    id_responsable = Column(Integer, primary_key=True, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    correo = Column(String(150), nullable=False, unique=True, index=True)
    telefono = Column(String(20), nullable=True)
    estado = Column(String(50), nullable=False, default="laborando")
    