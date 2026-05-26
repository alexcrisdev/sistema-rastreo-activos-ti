from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.database import Base


class AsignacionTrabajo(Base):
    __tablename__ = "asignacion_trabajo"

    id_asignacion = Column(Integer, primary_key=True, index=True)

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

    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(String(50), nullable=False, default="activo")

    responsable = relationship("Responsable")
    area = relationship("AreaMapa")
