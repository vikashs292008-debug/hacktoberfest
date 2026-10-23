import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
