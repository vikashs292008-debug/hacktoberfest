from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import great_generator as gg

from app.config import settings
from app.database.session import get_db
from app.database.models import DatasetModel, SchemaModel, MockApiModel, GenerationJobModel, ValidationReportModel

router = APIRouter(tags=["System"])

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.version,
        "engine": "great-generator",
        "engine_version": getattr(gg, "__version__", "0.1.8"),
        "database": "sqlite",
        "ai_provider": settings.ai_provider
    }

@router.get("/api/version")
def version():
    return {
        "app_name": settings.app_name,
        "version": settings.version,
        "great_generator_version": getattr(gg, "__version__", "0.1.8")
    }

@router.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_datasets = db.query(DatasetModel).count()
    total_records = db.query(func.sum(DatasetModel.row_count)).scalar() or 0
    saved_schemas = db.query(SchemaModel).count()
    active_mock_apis = db.query(MockApiModel).filter(MockApiModel.is_active == True).count()
    total_api_requests = db.query(func.sum(MockApiModel.total_requests)).scalar() or 0
    avg_quality = db.query(func.avg(ValidationReportModel.quality_score)).scalar()
    avg_quality_score = round(float(avg_quality), 1) if avg_quality else 100.0

    recent_jobs = db.query(GenerationJobModel).order_by(GenerationJobModel.created_at.desc()).limit(5).all()
    recent_jobs_data = [
        {
            "id": j.id,
            "schema_name": j.schema_name,
            "rows": j.actual_rows,
            "duration": j.duration_seconds,
            "status": j.status,
            "created_at": j.created_at.isoformat()
        } for j in recent_jobs
    ]

    # Format distribution
    format_counts = db.query(DatasetModel.file_format, func.count(DatasetModel.id)).group_by(DatasetModel.file_format).all()
    format_dist = {fmt or "parquet": cnt for fmt, cnt in format_counts}

    return {
        "total_datasets": total_datasets,
        "total_records": total_records,
        "saved_schemas": saved_schemas,
        "active_mock_apis": active_mock_apis,
        "total_api_requests": total_api_requests,
        "average_quality_score": avg_quality_score,
        "recent_jobs": recent_jobs_data,
        "format_distribution": format_dist
    }
