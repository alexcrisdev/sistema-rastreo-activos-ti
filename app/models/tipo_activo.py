from sqlalchemy import Column, Integer, String

from app.db.database import Base


class TipoActivo(Base):
    __tablename__ = "tipo_activo"
    
    id_tipo_activo = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)