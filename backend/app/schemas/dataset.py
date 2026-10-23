from typing import Optional, Any, List, Dict
from pydantic import BaseModel
import datetime
from app.schemas.schema_def import ColumnDefinition

class GenerateRequest(BaseModel):
    name: str = "synthetic_dataset"
    description: Optional[str] = ""
    rows: int = 100
    seed: Optional[int] = 42
    realism: str = "realistic"
    schema_id: Optional[str] = None
    columns: Optional[List[ColumnDefinition]] = None
    mode: str = "schema"  # "schema", "domain", "ddl", "nl_prompt"
    domain: Optional[str] = None
    table: Optional[str] = None
    ddl_text: Optional[str] = None
    nl_prompt: Optional[str] = None

class PreviewRequest(BaseModel):
    columns: Optional[List[ColumnDefinition]] = None
    domain: Optional[str] = None
    table: Optional[str] = None
    ddl_text: Optional[str] = None
    rows: int = 10
    seed: Optional[int] = 42
    realism: str = "realistic"

class DatasetPreviewResponse(BaseModel):
    columns: List[str]
    dtypes: Dict[str, str]
    records: List[Dict[str, Any]]
    total_rows: int
    preview_rows: int
    column_stats: Optional[Dict[str, Any]] = None

class DatasetResponse(BaseModel):
    id: str
    name: str
    description: str
    row_count: int
    column_count: int
    columns_meta: List[Dict[str, Any]]
    file_format: str
    size_bytes: int
    source: str
    is_fault_injected: bool
    parent_dataset_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class GenerationJobResponse(BaseModel):
    id: str
    dataset_id: Optional[str]
    schema_name: str
    status: str
    requested_rows: int
    actual_rows: int
    duration_seconds: float
    seed: Optional[int]
    error_message: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
