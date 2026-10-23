from typing import Optional, Any, List, Dict
from pydantic import BaseModel
import datetime

class MockApiCreate(BaseModel):
    dataset_id: str
    resource_name: str
    primary_key: Optional[str] = "id"
    allowed_methods: Optional[List[str]] = ["GET", "POST", "PUT", "PATCH", "DELETE"]
    default_limit: Optional[int] = 20
    max_limit: Optional[int] = 100
    filterable_fields: Optional[List[str]] = None
    sortable_fields: Optional[List[str]] = None

class MockApiResponse(BaseModel):
    id: str
    dataset_id: str
    resource_name: str
    primary_key: str
    is_active: bool
    allowed_methods: List[str]
    pagination_config: Dict[str, Any]
    filterable_fields: List[str]
    sortable_fields: List[str]
    total_requests: int
    base_endpoint: str
    endpoints_docs: Dict[str, Any]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
