from sqlalchemy.orm import Session

from app.repositories.activo_repository import listar_activos
from app.repositories.area_mapa_repository import listar_areas_mapa


def _obtener_nombre_responsable(activo):
    if activo.responsable is None:
        return "Sin responsable"

    return f"{activo.responsable.nombres} {activo.responsable.apellidos}"


def obtener_datos_mapa_service(db: Session):
    areas = listar_areas_mapa(db)
    activos_registrados = listar_activos(db)

    activos_en_mapa = []
    alertas = []

    for activo in activos_registrados:
        esta_fuera = activo.fuera_empresa or activo.estado_conexion == "desconectado"

        if esta_fuera:
            alertas.append(
                {
                    "id_activo": activo.id_activo,
                    "codigo": activo.codigo,
                    "responsable": _obtener_nombre_responsable(activo),
                    "estado_conexion": activo.estado_conexion,
                    "mensaje": "Activo fuera de la empresa",
                }
            )
        else:
            activos_en_mapa.append(activo)

    return {
        "areas": areas,
        "activos": activos_en_mapa,
        "alertas": alertas,
    }