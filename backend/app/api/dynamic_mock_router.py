from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import MockApiModel
from app.services.mock_api_service import (
    sanitize_resource_name,
    query_mock_records,
    get_mock_record_by_id,
    create_mock_record,
    update_mock_record,
    delete_mock_record,
    reset_mock_api
)

router = APIRouter(prefix="/api/mock", tags=["Dynamic Mock APIs"])

def get_active_mock(resource: str, db: Session) -> MockApiModel:
    clean_res = sanitize_resource_name(resource)
    mock_api = db.query(MockApiModel).filter(
        MockApiModel.resource_name == clean_res,
        MockApiModel.is_active == True
    ).first()
    if not mock_api:
        raise HTTPException(
            status_code=404,
            detail=f"Mock resource '{resource}' not found or is currently inactive."
        )
    return mock_api

def check_method(mock_api: MockApiModel, method: str):
    if method not in mock_api.allowed_methods:
        raise HTTPException(
            status_code=405,
            detail=f"Method {method} is disabled for resource '{mock_api.resource_name}'."
        )

@router.get("/{resource}")
def list_resource_records(
    resource: str,
    request: Request,
    limit: Optional[int] = None,
    offset: Optional[int] = 0,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: str = "asc",
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    check_method(mock, "GET")

    page_limit = limit or mock.pagination_config.get("default_limit", 20)
    max_limit = mock.pagination_config.get("max_limit", 100)
    page_limit = min(page_limit, max_limit)

    # Extract query params as filters
    reserved_params = {"limit", "offset", "search", "sort_by", "sort_dir"}
    filters = {}
    for k, v in request.query_params.items():
        if k not in reserved_params:
            filters[k] = v

    data, total = query_mock_records(
        mock_api=mock,
        limit=page_limit,
        offset=offset or 0,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        filters=filters
    )

    mock.total_requests = (mock.total_requests or 0) + 1
    db.commit()

    return {
        "resource": mock.resource_name,
        "total": total,
        "limit": page_limit,
        "offset": offset or 0,
        "data": data
    }

@router.get("/{resource}/{item_id}")
def get_resource_record(
    resource: str,
    item_id: str,
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    check_method(mock, "GET")

    record = get_mock_record_by_id(mock, item_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Item with {mock.primary_key}='{item_id}' not found in {mock.resource_name}."
        )

    mock.total_requests = (mock.total_requests or 0) + 1
    db.commit()

    return record

@router.post("/{resource}", status_code=status.HTTP_201_CREATED)
async def create_resource_record(
    resource: str,
    request: Request,
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    check_method(mock, "POST")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON request body.")

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object.")

    created = create_mock_record(mock, body)
    mock.total_requests = (mock.total_requests or 0) + 1
    db.commit()

    return created

@router.put("/{resource}/{item_id}")
async def replace_resource_record(
    resource: str,
    item_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    check_method(mock, "PUT")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON request body.")

    updated = update_mock_record(mock, item_id, body, partial=False)
    mock.total_requests = (mock.total_requests or 0) + 1
    db.commit()

    return updated

@router.patch("/{resource}/{item_id}")
async def patch_resource_record(
    resource: str,
    item_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    check_method(mock, "PATCH")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON request body.")

    updated = update_mock_record(mock, item_id, body, partial=True)
    mock.total_requests = (mock.total_requests or 0) + 1
    db.commit()

    return updated

@router.delete("/{resource}/{item_id}")
def delete_resource_record(
    resource: str,
    item_id: str,
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    check_method(mock, "DELETE")

    delete_mock_record(mock, item_id)
    mock.total_requests = (mock.total_requests or 0) + 1
    db.commit()

    return {
        "success": True,
        "message": f"Record with {mock.primary_key}='{item_id}' deleted from {mock.resource_name}."
    }

@router.post("/{resource}/reset")
def reset_resource_state(
    resource: str,
    db: Session = Depends(get_db)
):
    mock = get_active_mock(resource, db)
    cnt = reset_mock_api(db, mock)
    return {
        "success": True,
        "message": f"Resource '{resource}' reset to original {cnt} records.",
        "record_count": cnt
    }
