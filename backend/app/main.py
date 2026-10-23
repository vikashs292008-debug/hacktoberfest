import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Add parent directory to path so imports work cleanly
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.config import settings
from app.database.session import engine, Base
import app.database.models as models

from app.api import (
    routes_system,
    routes_generation,
    routes_schemas,
    routes_datasets,
    routes_quality,
    routes_mock_apis,
    routes_relationships,
    routes_templates,
    routes_ai,
    dynamic_mock_router
)

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DataForge AI - Enterprise Synthetic Data Platform",
    description="Full-stack AI-powered synthetic data generator, Mock REST API builder, and Data Quality test platform powered by Great Generator.",
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(routes_system.router)
app.include_router(routes_generation.router)
app.include_router(routes_schemas.router)
app.include_router(routes_datasets.router)
app.include_router(routes_quality.router)
app.include_router(routes_mock_apis.router)
app.include_router(routes_relationships.router)
app.include_router(routes_templates.router)
app.include_router(routes_ai.router)
app.include_router(dynamic_mock_router.router)

# Mount Frontend SPA if dist exists
frontend_dist = BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if (
            full_path.startswith("api/")
            or full_path.startswith("docs")
            or full_path.startswith("health")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Endpoint not found")
        
        target_file = frontend_dist / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "platform": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
            "health": "/health",
            "description": "Enterprise Synthetic Data Generator, Mock API Builder & Quality Lab"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
