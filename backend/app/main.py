from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.avatars import ensure_upload_dirs
from app.config import settings
from app.database import init_db
from app.security import get_current_user
from modules.alerts.router import router as alerts_router
from modules.area_requests.router import router as area_requests_router
from modules.auth.router import router as auth_router
from modules.client_orders.router import router as client_orders_router
from modules.dashboard.router import router as dashboard_router
from modules.dispatch.router import router as dispatch_router
from modules.extrusion_runs.router import router as extrusion_runs_router
from modules.inventory_movements.router import router as inventory_movements_router
from modules.inventory_returns.router import router as inventory_returns_router
from modules.masters.clients.router import router as clients_router
from modules.masters.products.router import router as products_router
from modules.masters.suppliers.router import router as suppliers_router
from modules.masters.vendors.router import router as vendors_router
from modules.production_batches.router import router as production_batches_router
from modules.purchase_orders.router import router as purchase_orders_router
from modules.purchase_receipts.router import router as purchase_receipts_router
from modules.material_requests.router import router as material_requests_router
from modules.materials.router import router as materials_router
from modules.mixture_production_runs.router import router as mixture_production_runs_router
from modules.reports.router import router as reports_router
from modules.sealing_runs.router import router as sealing_runs_router
from modules.tinta_mixtures.router import router as tinta_mixtures_router
from modules.work_orders.router import router as work_orders_router

_auth = [Depends(get_current_user)]


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_upload_dirs()
    init_db()
    yield


app = FastAPI(title="Plásticos La Dinastía API", lifespan=lifespan)

ensure_upload_dirs()
_uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    message = exc.detail if isinstance(exc.detail, str) else "Error en la solicitud"
    return JSONResponse(status_code=exc.status_code, content={"message": message})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"message": "Datos inválidos", "errors": exc.errors()})

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
# Starlette no permite allow_origins=["*"] junto con allow_credentials=True
_cors_credentials = origins != ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:5174"],
    allow_credentials=_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(clients_router, prefix="/api", dependencies=_auth)
app.include_router(vendors_router, prefix="/api", dependencies=_auth)
app.include_router(suppliers_router, prefix="/api", dependencies=_auth)
app.include_router(products_router, prefix="/api", dependencies=_auth)
app.include_router(purchase_orders_router, prefix="/api", dependencies=_auth)
app.include_router(purchase_receipts_router, prefix="/api", dependencies=_auth)
app.include_router(client_orders_router, prefix="/api", dependencies=_auth)
app.include_router(production_batches_router, prefix="/api", dependencies=_auth)
app.include_router(work_orders_router, prefix="/api", dependencies=_auth)
app.include_router(tinta_mixtures_router, prefix="/api", dependencies=_auth)
app.include_router(material_requests_router, prefix="/api", dependencies=_auth)
app.include_router(area_requests_router, prefix="/api", dependencies=_auth)
app.include_router(extrusion_runs_router, prefix="/api", dependencies=_auth)
app.include_router(sealing_runs_router, prefix="/api", dependencies=_auth)
app.include_router(inventory_returns_router, prefix="/api", dependencies=_auth)
app.include_router(mixture_production_runs_router, prefix="/api", dependencies=_auth)
app.include_router(dispatch_router, prefix="/api", dependencies=_auth)
app.include_router(reports_router, prefix="/api", dependencies=_auth)
app.include_router(alerts_router, prefix="/api", dependencies=_auth)
app.include_router(dashboard_router, prefix="/api", dependencies=_auth)
app.include_router(materials_router, prefix="/api", dependencies=_auth)
app.include_router(inventory_movements_router, prefix="/api", dependencies=_auth)


@app.get("/up")
def health() -> dict[str, str]:
    return {"status": "ok"}
