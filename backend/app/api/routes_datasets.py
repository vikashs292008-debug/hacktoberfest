import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd

from app.database.session import get_db
from app.database.models import DatasetModel, MockApiModel, ValidationReportModel
from app.schemas.dataset import DatasetResponse
from app.services.dataset_service import (
    load_dataset_dataframe,
    get_dataset_preview,
    export_dataset_file,
    save_dataframe_as_dataset
)
from app.services.generator_service import calculate_column_stats

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    search: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(DatasetModel)
    if source:
        query = query.filter(DatasetModel.source == source)
    if search:
        query = query.filter(DatasetModel.name.ilike(f"%{search}%"))

    datasets = query.order_by(DatasetModel.created_at.desc()).offset(offset).limit(limit).all()
    return datasets

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
    return ds

@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: str = "asc",
    include_stats: bool = False,
    db: Session = Depends(get_db)
):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    df = load_dataset_dataframe(ds)
    records, total_filtered = get_dataset_preview(
        df=df,
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir
    )

    stats = calculate_column_stats(df) if include_stats else None

    return {
        "dataset_id": ds.id,
        "name": ds.name,
        "total_rows": len(df),
        "filtered_rows": total_filtered,
        "limit": limit,
        "offset": offset,
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "records": records,
        "column_stats": stats
    }

@router.get("/{dataset_id}/export")
def export_dataset(
    dataset_id: str,
    format: str = Query("csv", regex="^(csv|json|parquet|sql)$"),
    db: Session = Depends(get_db)
):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    df = load_dataset_dataframe(ds)
    content, filename, media_type = export_dataset_file(df, ds.name, format)

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    # Cleanup associated mock APIs
    mock_apis = db.query(MockApiModel).filter(MockApiModel.dataset_id == dataset_id).all()
    for m in mock_apis:
        if os.path.exists(m.state_file_path):
            try:
                os.remove(m.state_file_path)
            except Exception:
                pass
        db.delete(m)

    # Cleanup associated reports
    db.query(ValidationReportModel).filter(ValidationReportModel.dataset_id == dataset_id).delete()

    # Delete storage file
    if os.path.exists(ds.file_path):
        try:
            os.remove(ds.file_path)
        except Exception:
            pass

    db.delete(ds)
    db.commit()
    return {"success": True, "message": f"Dataset '{ds.name}' and associated resources deleted."}

@router.post("/import")
async def import_dataset(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filename = file.filename or "uploaded_dataset"
    name = dataset_name or filename.rsplit(".", 1)[0]

    try:
        content = await file.read()
        if filename.endswith(".csv"):
            import io
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            import io
            df = pd.read_json(io.BytesIO(content))
        elif filename.endswith(".parquet"):
            import io
            df = pd.read_parquet(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV, JSON, and Parquet files are supported.")

        dataset = save_dataframe_as_dataset(
            db=db,
            df=df,
            name=name,
            description=f"Imported from {filename} ({len(df)} records)",
            source="import"
        )
        return {
            "success": True,
            "dataset_id": dataset.id,
            "name": dataset.name,
            "row_count": len(df),
            "column_count": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File import failed: {str(e)}")
