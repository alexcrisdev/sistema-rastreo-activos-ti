from app.db.database import SessionLocal
from app.models.area_mapa import AreaMapa
from app.models.tipo_activo import TipoActivo
from datetime import date

from app.config.settings import settings
from app.models.asignacion_trabajo import AsignacionTrabajo
from app.models.responsable import Responsable
from app.models.usuario import Usuario
from app.utils.security import generar_hash_password

TIPOS_ACTIVO = [
    "PC",
    "Laptop",
    "Impresora",
    "Router",
    "Celular",
]


AREAS_MAPA = [
    {
        "nombre": "Almacén",
        "coord_x_inicio": 0,
        "coord_y_inicio": 0,
        "coord_x_fin": 150,
        "coord_y_fin": 250,
    },
    {
        "nombre": "Gerencia",
        "coord_x_inicio": 150,
        "coord_y_inicio": 0,
        "coord_x_fin": 400,
        "coord_y_fin": 250,
    },
    {
        "nombre": "Contabilidad",
        "coord_x_inicio": 400,
        "coord_y_inicio": 0,
        "coord_x_fin": 600,
        "coord_y_fin": 250,
    },
    {
        "nombre": "RRHH",
        "coord_x_inicio": 600,
        "coord_y_inicio": 0,
        "coord_x_fin": 800,
        "coord_y_fin": 250,
    },
    {
        "nombre": "Sala de reuniones",
        "coord_x_inicio": 800,
        "coord_y_inicio": 0,
        "coord_x_fin": 1000,
        "coord_y_fin": 250,
    },
    {
        "nombre": "Pasillo",
        "coord_x_inicio": 0,
        "coord_y_inicio": 250,
        "coord_x_fin": 1000,
        "coord_y_fin": 350,
    },
    {
        "nombre": "Ventas",
        "coord_x_inicio": 0,
        "coord_y_inicio": 350,
        "coord_x_fin": 200,
        "coord_y_fin": 600,
    },
    {
        "nombre": "TI / Sistemas",
        "coord_x_inicio": 200,
        "coord_y_inicio": 350,
        "coord_x_fin": 400,
        "coord_y_fin": 600,
    },
    {
        "nombre": "Baños",
        "coord_x_inicio": 400,
        "coord_y_inicio": 350,
        "coord_x_fin": 500,
        "coord_y_fin": 600,
    },
    {
        "nombre": "Recepción",
        "coord_x_inicio": 500,
        "coord_y_inicio": 350,
        "coord_x_fin": 700,
        "coord_y_fin": 600,
    },
    {
        "nombre": "Área común",
        "coord_x_inicio": 700,
        "coord_y_inicio": 350,
        "coord_x_fin": 900,
        "coord_y_fin": 600,
    },
]


def crear_tipos_activo(db):
    for nombre in TIPOS_ACTIVO:
        tipo_existente = (
            db.query(TipoActivo)
            .filter(TipoActivo.nombre == nombre)
            .first()
        )

        if tipo_existente is None:
            db.add(TipoActivo(nombre=nombre))

    db.commit()


def crear_areas_mapa(db):
    for area_data in AREAS_MAPA:
        area_existente = (
            db.query(AreaMapa)
            .filter(AreaMapa.nombre == area_data["nombre"])
            .first()
        )

        if area_existente is None:
            db.add(AreaMapa(**area_data))

    db.commit()


def ejecutar_seed():
    db = SessionLocal()

    try:
        crear_tipos_activo(db)
        crear_areas_mapa(db)

        responsable_admin = crear_responsable_admin(db)
        crear_asignacion_admin_sistemas(db, responsable_admin)
        crear_usuario_admin(db, responsable_admin)

        print("Datos iniciales cargados correctamente.")
    finally:
        db.close()
        

def obtener_area_por_nombre(db, nombre: str):
    return db.query(AreaMapa).filter(AreaMapa.nombre == nombre).first()


def crear_responsable_admin(db):
    responsable_existente = (
        db.query(Responsable)
        .filter(Responsable.correo == settings.admin_correo)
        .first()
    )

    if responsable_existente is not None:
        return responsable_existente

    responsable = Responsable(
        nombres=settings.admin_nombres,
        apellidos=settings.admin_apellidos,
        correo=settings.admin_correo,
        telefono=settings.admin_telefono,
        estado="laborando",
    )

    db.add(responsable)
    db.commit()
    db.refresh(responsable)

    return responsable


def crear_asignacion_admin_sistemas(db, responsable: Responsable):
    area_sistemas = obtener_area_por_nombre(db, "TI / Sistemas")

    if area_sistemas is None:
        raise ValueError("No existe el área TI / Sistemas. Ejecuta primero la carga de áreas.")

    asignacion_existente = (
        db.query(AsignacionTrabajo)
        .filter(AsignacionTrabajo.id_responsable == responsable.id_responsable)
        .filter(AsignacionTrabajo.id_area == area_sistemas.id_area)
        .filter(AsignacionTrabajo.estado == "activo")
        .first()
    )

    if asignacion_existente is not None:
        return asignacion_existente

    asignacion = AsignacionTrabajo(
        id_responsable=responsable.id_responsable,
        id_area=area_sistemas.id_area,
        fecha_inicio=date.today(),
        fecha_fin=None,
        estado="activo",
    )

    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)

    return asignacion


def crear_usuario_admin(db, responsable: Responsable):
    usuario_existente = (
        db.query(Usuario)
        .filter(Usuario.usuario == settings.admin_user)
        .first()
    )

    if usuario_existente is not None:
        return usuario_existente

    usuario = Usuario(
        usuario=settings.admin_user,
        password_hash=generar_hash_password(settings.admin_password),
        activo=True,
        id_responsable=responsable.id_responsable,
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario


if __name__ == "__main__":
    ejecutar_seed()