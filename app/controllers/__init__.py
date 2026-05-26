from app.controllers.activo_controller import router as activo_router
from app.controllers.area_mapa_controller import router as area_mapa_router
from app.controllers.asignacion_trabajo_controller import (
    router as asignacion_trabajo_router,
)
from app.controllers.mapa_controller import router as mapa_router
from app.controllers.responsable_controller import router as responsable_router
from app.controllers.simulacion_controller import router as simulacion_router
from app.controllers.tipo_activo_controller import router as tipo_activo_router
from app.controllers.ubicacion_historial_controller import (
    router as ubicacion_historial_router,
)
from app.controllers.websocket_controller import router as websocket_router
from app.controllers.auth_controller import router as auth_router