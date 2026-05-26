import asyncio

from app.db.database import SessionLocal
from app.services import simulacion_estado
from app.services.simulacion_service import ejecutar_reglas_simulacion_service
from app.websocket.connection_manager import manager


async def ejecutar_simulacion_periodica():
    while True:
        if simulacion_estado.simulacion_activa:
            db = SessionLocal()

            try:
                resultado = ejecutar_reglas_simulacion_service(db)

                if resultado["total_movidos"] > 0:
                    await manager.broadcast(
                        {
                            "type": "activos_actualizados",
                            "data": resultado["activos"],
                        }
                    )
            finally:
                db.close()

        await asyncio.sleep(5)