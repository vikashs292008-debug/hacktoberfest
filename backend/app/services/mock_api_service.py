import os
import json
import re
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import MOCK_STATE_DIR
from app.database.models import MockApiModel, DatasetModel

def sanitize_resource_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_\-]", "", name.strip().lower())
    if not cleaned:
        raise ValueError("Invalid resource name. Must contain alphanumeric characters, hyphens or underscores.")
    return cleaned


def initialize_mock_api(
    db: Session,
    dataset: DatasetModel,
    resource_name: str,
    primary_key: str = "id",
    allowed_methods: Optional[List[str]] = None,
    default_limit: int = 20,
    max_limit: int = 100,
    filterable_fields: Optional[List[str]] = None,
    sortable_fields: Optional[List[str]] = None
) -> MockApiModel:
    clean_resource = sanitize_resource_name(resource_name)

    existing = db.query(MockApiModel).filter(MockApiModel.resource_name == clean_resource).first()
    if existing:
        raise ValueError(f"Resource name '{clean_resource}' already exists.")

    # Read original dataset records
    df = pd.read_parquet(dataset.file_path)
    records = json.loads(df.to_json(orient="records", date_format="iso"))

    # Verify primary key exists
    if primary_key not in df.columns:
        # If dataset doesn't have the specified primary key, use first column or create an id
        if "id" in df.columns:
            primary_key = "id"
        else:
            primary_key = df.columns[0]

    state_path = MOCK_STATE_DIR / f"{clean_resource}.json"
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    col_names = list(df.columns)
    mock_api = MockApiModel(
        dataset_id=dataset.id,
        resource_name=clean_resource,
        primary_key=primary_key,
        is_active=True,
        allowed_methods=allowed_methods or ["GET", "POST", "PUT", "PATCH", "DELETE"],
        pagination_config={"default_limit": default_limit, "max_limit": max_limit},
        filterable_fields=filterable_fields if filterable_fields is not None else col_names,
        sortable_fields=sortable_fields if sortable_fields is not None else col_names,
        total_requests=0,
        state_file_path=str(state_path)
    )
    db.add(mock_api)
    db.commit()
    db.refresh(mock_api)
    return mock_api


def load_mock_records(mock_api: MockApiModel) -> List[Dict[str, Any]]:
    state_path = Path(mock_api.state_file_path)
    if not state_path.exists():
        return []
    with open(state_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_mock_records(mock_api: MockApiModel, records: List[Dict[str, Any]]):
    state_path = Path(mock_api.state_file_path)
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)


def reset_mock_api(db: Session, mock_api: MockApiModel) -> int:
    dataset = db.query(DatasetModel).filter(DatasetModel.id == mock_api.dataset_id).first()
    if not dataset or not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="Original dataset source not found.")

    df = pd.read_parquet(dataset.file_path)
    records = json.loads(df.to_json(orient="records", date_format="iso"))
    save_mock_records(mock_api, records)
    return len(records)


def query_mock_records(
    mock_api: MockApiModel,
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: str = "asc",
    filters: Optional[Dict[str, Any]] = None
) -> Tuple[List[Dict[str, Any]], int]:
    records = load_mock_records(mock_api)

    # Apply search
    if search and search.strip():
        term = search.strip().lower()
        records = [
            r for r in records
            if any(term in str(v).lower() for v in r.values())
        ]

    # Apply filters
    if filters:
        for k, v in filters.items():
            if k in mock_api.filterable_fields:
                records = [
                    r for r in records
                    if str(r.get(k, "")).lower() == str(v).lower()
                ]

    # Apply sorting
    if sort_by and sort_by in mock_api.sortable_fields:
        reverse = sort_dir.lower() == "desc"
        records = sorted(
            records,
            key=lambda x: (x.get(sort_by) is None, x.get(sort_by)),
            reverse=reverse
        )

    total = len(records)
    paged = records[offset : offset + limit]
    return paged, total


def get_mock_record_by_id(mock_api: MockApiModel, item_id: Any) -> Optional[Dict[str, Any]]:
    records = load_mock_records(mock_api)
    pk = mock_api.primary_key
    for r in records:
        if str(r.get(pk)) == str(item_id):
            return r
    return None


def create_mock_record(mock_api: MockApiModel, payload: Dict[str, Any]) -> Dict[str, Any]:
    records = load_mock_records(mock_api)
    pk = mock_api.primary_key

    new_record = dict(payload)
    if pk not in new_record or not new_record[pk]:
        # Generate new PK
        existing_ids = [r.get(pk) for r in records if pk in r]
        numeric_ids = [int(i) for i in existing_ids if str(i).isdigit()]
        if numeric_ids:
            new_record[pk] = max(numeric_ids) + 1
        else:
            new_record[pk] = f"new_{len(records) + 1}"

    # Check for duplicate PK
    for r in records:
        if str(r.get(pk)) == str(new_record[pk]):
            raise HTTPException(status_code=400, detail=f"Record with {pk}={new_record[pk]} already exists.")

    records.insert(0, new_record)
    save_mock_records(mock_api, records)
    return new_record


def update_mock_record(mock_api: MockApiModel, item_id: Any, payload: Dict[str, Any], partial: bool = False) -> Dict[str, Any]:
    records = load_mock_records(mock_api)
    pk = mock_api.primary_key

    for i, r in enumerate(records):
        if str(r.get(pk)) == str(item_id):
            if partial:
                updated = {**r, **payload}
            else:
                updated = dict(payload)
                updated[pk] = r[pk]
            records[i] = updated
            save_mock_records(mock_api, records)
            return updated

    raise HTTPException(status_code=404, detail=f"Record with {pk}={item_id} not found.")


def delete_mock_record(mock_api: MockApiModel, item_id: Any) -> bool:
    records = load_mock_records(mock_api)
    pk = mock_api.primary_key
    initial_len = len(records)
    records = [r for r in records if str(r.get(pk)) != str(item_id)]

    if len(records) == initial_len:
        raise HTTPException(status_code=404, detail=f"Record with {pk}={item_id} not found.")

    save_mock_records(mock_api, records)
    return True


def generate_mock_docs(mock_api: MockApiModel, base_url: str = "http://localhost:8000") -> Dict[str, Any]:
    res = mock_api.resource_name
    pk = mock_api.primary_key
    sample_records = load_mock_records(mock_api)[:2]
    sample_item = sample_records[0] if sample_records else {pk: 1, "name": "Sample Item"}

    return {
        "resource": res,
        "base_url": f"{base_url}/api/mock/{res}",
        "endpoints": [
            {
                "method": "GET",
                "path": f"/api/mock/{res}",
                "description": f"List {res} with pagination, filtering, search, and sorting",
                "parameters": [
                    {"name": "limit", "type": "int", "default": 20},
                    {"name": "offset", "type": "int", "default": 0},
                    {"name": "search", "type": "string", "default": None},
                    {"name": "sort_by", "type": "string", "options": mock_api.sortable_fields},
                    {"name": "sort_dir", "type": "string", "options": ["asc", "desc"]}
                ],
                "response_example": {
                    "total": len(sample_records),
                    "limit": 20,
                    "offset": 0,
                    "data": sample_records
                },
                "curl_example": f"curl -X GET \"{base_url}/api/mock/{res}?limit=10\"",
                "fetch_example": f"fetch('{base_url}/api/mock/{res}?limit=10').then(res => res.json())"
            },
            {
                "method": "GET",
                "path": f"/api/mock/{res}/{{{pk}}}",
                "description": f"Get single record by {pk}",
                "response_example": sample_item,
                "curl_example": f"curl -X GET \"{base_url}/api/mock/{res}/{sample_item.get(pk, 1)}\"",
                "fetch_example": f"fetch('{base_url}/api/mock/{res}/{sample_item.get(pk, 1)}').then(res => res.json())"
            },
            {
                "method": "POST",
                "path": f"/api/mock/{res}",
                "description": f"Create a new {res} record",
                "request_body": sample_item,
                "response_example": sample_item,
                "curl_example": f"curl -X POST \"{base_url}/api/mock/{res}\" -H \"Content-Type: application/json\" -d '{json.dumps(sample_item)}'",
                "fetch_example": f"fetch('{base_url}/api/mock/{res}', {{ method: 'POST', headers: {{ 'Content-Type': 'application/json' }}, body: JSON.stringify({json.dumps(sample_item)}) }})"
            },
            {
                "method": "PUT",
                "path": f"/api/mock/{res}/{{{pk}}}",
                "description": f"Replace a {res} record",
                "request_body": sample_item,
                "response_example": sample_item
            },
            {
                "method": "PATCH",
                "path": f"/api/mock/{res}/{{{pk}}}",
                "description": f"Partially update a {res} record",
                "request_body": {k: sample_item[k] for k in list(sample_item.keys())[:2]},
                "response_example": sample_item
            },
            {
                "method": "DELETE",
                "path": f"/api/mock/{res}/{{{pk}}}",
                "description": f"Delete a {res} record by {pk}",
                "response_example": {"success": True, "message": f"Record {sample_item.get(pk, 1)} deleted"}
            },
            {
                "method": "POST",
                "path": f"/api/mock/{res}/reset",
                "description": "Reset mock data back to original generated dataset state",
                "response_example": {"success": True, "message": "Reset to original 100 records"}
            }
        ]
    }
