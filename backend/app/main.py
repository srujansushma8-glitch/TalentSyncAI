from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.config import settings
from backend.app.database import engine, Base
import backend.app.models  # Ensure all models are registered with Base

# Import API Routers
from backend.app.api.auth import router as auth_router
from backend.app.api.employees import router as employees_router
from backend.app.api.projects import router as projects_router
from backend.app.api.matching import router as matching_router
from backend.app.api.optimization import router as optimization_router
from backend.app.api.skill_gaps import router as skill_gaps_router
from backend.app.api.training import router as training_router
from backend.app.api.workload import router as workload_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.assistant import router as assistant_router
from backend.app.api.notifications import router as notifications_router
from backend.app.api.reports import router as reports_router
from backend.app.api.system import router as system_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(employees_router, prefix=api_prefix)
app.include_router(projects_router, prefix=api_prefix)
app.include_router(matching_router, prefix=api_prefix)
app.include_router(optimization_router, prefix=api_prefix)
app.include_router(skill_gaps_router, prefix=api_prefix)
app.include_router(training_router, prefix=api_prefix)
app.include_router(workload_router, prefix=api_prefix)
app.include_router(simulation_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(assistant_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(system_router, prefix=api_prefix)


@app.get("/")
@app.get("/health")
@app.get("/api/health")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
