from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class Activo(Base):
    __tablename__ = "activo"

    id_activo = Column(Integer, primary_key=True, index=True)

    codigo = Column(String(50), nullable=False, unique=True, index=True)
    nombre = Column(String(100), nullable=False)
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    numero_serie = Column(String(100), nullable=True, unique=True)
    estado = Column(String(50), nullable=False, default="activo")
    estado_conexion = Column(String(30), nullable=False, default="conectado")
    fuera_empresa = Column(Boolean, nullable=False, default=False)

    id_tipo_activo = Column(
        Integer,
        ForeignKey("tipo_activo.id_tipo_activo"),
        nullable=False,
    )
    id_responsable = Column(
        Integer,
        ForeignKey("responsable.id_responsable"),
        nullable=False,
    )
    id_area = Column(
        Integer,
        ForeignKey("area_mapa.id_area"),
        nullable=False,
    )

    es_movil = Column(Boolean, nullable=False, default=False)

    coord_x_actual = Column(Float, nullable=False)
    coord_y_actual = Column(Float, nullable=False)

    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)
    fecha_actualizacion = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    tipo_activo = relationship("TipoActivo")
    responsable = relationship("Responsable")
    area = relationship("AreaMapa")
