from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class UbicacionHistorial(Base):
    __tablename__ = "ubicacion_historial"

    id_historial = Column(Integer, primary_key=True, index=True)

    id_activo = Column(
        Integer,
        ForeignKey("activo.id_activo"),
        nullable=False,
    )
    id_area = Column(
        Integer,
        ForeignKey("area_mapa.id_area"),
        nullable=False,
    )

    coord_x = Column(Float, nullable=False)
    coord_y = Column(Float, nullable=False)
    fecha_hora = Column(DateTime, nullable=False, default=datetime.utcnow)
    tipo_movimiento = Column(String(50), nullable=False)

    activo = relationship("Activo")
    area = relationship("AreaMapa")
