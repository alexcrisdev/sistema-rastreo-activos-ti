from sqlalchemy import Column, Integer, String

from app.db.database import Base


class AreaMapa(Base):
    __tablename__ = "area_mapa"
    
    id_area = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)

    coord_x_inicio = Column(Integer, nullable=False)
    coord_y_inicio = Column(Integer, nullable=False)
    coord_x_fin = Column(Integer, nullable=False)
    coord_y_fin = Column(Integer, nullable=False)