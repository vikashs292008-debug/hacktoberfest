from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import MockApiModel, DatasetModel
from app.schemas.mock_api import MockApiCreate, MockApiResponse
from app.services.mock_api_service import (
    initialize_mock_api,
    reset_mock_api,
    generate_mock_docs
)

router = APIRouter(prefix="/api/mock-apis", tags=["Mock APIs"])

@router.post("", response_model=MockApiResponse)
def create_mock_api_endpoint(
    req: MockApiCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset '{req.dataset_id}' not found.")

    try:
        mock_api = initialize_mock_api(
            db=db,
            dataset=dataset,
            resource_name=req.resource_name,
            primary_key=req.primary_key or "id",
            allowed_methods=req.allowed_methods,
            default_limit=req.default_limit or 20,
            max_limit=req.max_limit or 100,
            filterable_fields=req.filterable_fields,
            sortable_fields=req.sortable_fields
        )

        base_url = f"{request.base_url.scheme}://{request.base_url.netloc}".rstrip("/")
        docs = generate_mock_docs(mock_api, base_url=base_url)

        return MockApiResponse(
            id=mock_api.id,
            dataset_id=mock_api.dataset_id,
            resource_name=mock_api.resource_name,
            primary_key=mock_api.primary_key,
            is_active=mock_api.is_active,
            allowed_methods=mock_api.allowed_methods,
            pagination_config=mock_api.pagination_config,
            filterable_fields=mock_api.filterable_fields,
            sortable_fields=mock_api.sortable_fields,
            total_requests=mock_api.total_requests,
            base_endpoint=f"/api/mock/{mock_api.resource_name}",
            endpoints_docs=docs,
            created_at=mock_api.created_at,
            updated_at=mock_api.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[MockApiResponse])
def list_mock_apis(request: Request, db: Session = Depends(get_db)):
    apis = db.query(MockApiModel).order_by(MockApiModel.created_at.desc()).all()
    base_url = f"{request.base_url.scheme}://{request.base_url.netloc}".rstrip("/")
    res = []
    for m in apis:
        docs = generate_mock_docs(m, base_url=base_url)
        res.append(MockApiResponse(
            id=m.id,
            dataset_id=m.dataset_id,
            resource_name=m.resource_name,
            primary_key=m.primary_key,
            is_active=m.is_active,
            allowed_methods=m.allowed_methods,
            pagination_config=m.pagination_config,
            filterable_fields=m.filterable_fields,
            sortable_fields=m.sortable_fields,
            total_requests=m.total_requests,
            base_endpoint=f"/api/mock/{m.resource_name}",
            endpoints_docs=docs,
            created_at=m.created_at,
            updated_at=m.updated_at
        ))
    return res

@router.get("/{api_id}", response_model=MockApiResponse)
def get_mock_api(api_id: str, request: Request, db: Session = Depends(get_db)):
    m = db.query(MockApiModel).filter(MockApiModel.id == api_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Mock API '{api_id}' not found.")
    base_url = f"{request.base_url.scheme}://{request.base_url.netloc}".rstrip("/")
    docs = generate_mock_docs(m, base_url=base_url)
    return MockApiResponse(
        id=m.id,
        dataset_id=m.dataset_id,
        resource_name=m.resource_name,
        primary_key=m.primary_key,
        is_active=m.is_active,
        allowed_methods=m.allowed_methods,
        pagination_config=m.pagination_config,
        filterable_fields=m.filterable_fields,
        sortable_fields=m.sortable_fields,
        total_requests=m.total_requests,
        base_endpoint=f"/api/mock/{m.resource_name}",
        endpoints_docs=docs,
        created_at=m.created_at,
        updated_at=m.updated_at
    )

@router.delete("/{api_id}")
def delete_mock_api(api_id: str, db: Session = Depends(get_db)):
    m = db.query(MockApiModel).filter(MockApiModel.id == api_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Mock API '{api_id}' not found.")
    import os
    if os.path.exists(m.state_file_path):
        try:
            os.remove(m.state_file_path)
        except Exception:
            pass
    db.delete(m)
    db.commit()
    return {"success": True, "message": f"Mock API '{m.resource_name}' deleted."}

@router.post("/{api_id}/reset")
def reset_mock_api_endpoint(api_id: str, db: Session = Depends(get_db)):
    m = db.query(MockApiModel).filter(MockApiModel.id == api_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Mock API '{api_id}' not found.")
    count = reset_mock_api(db, m)
    return {
        "success": True,
        "message": f"Mock API '{m.resource_name}' reset to initial {count} records.",
        "record_count": count
    }
