from typing import Optional, Any, List, Dict
from pydantic import BaseModel
import datetime
from app.schemas.schema_def import ColumnDefinition

class TableConfig(BaseModel):
    name: str
    row_count: int = 50
    primary_key: str = "id"
    columns: List[ColumnDefinition]

class RelationshipConfig(BaseModel):
    parent_table: str
    child_table: str
    parent_key: str
    foreign_key: str
    cardinality: str = "one_to_many"  # "one_to_one", "one_to_many"

class RelationalProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tables: List[TableConfig]
    relationships: List[RelationshipConfig]

class RelationalGenerateRequest(BaseModel):
    seed: Optional[int] = 42
    realism: str = "realistic"
    save_datasets: bool = True

class RelationalGenerateResponse(BaseModel):
    project_name: str
    generated_tables: Dict[str, Dict[str, Any]]
    integrity_report: Dict[str, Any]
    generation_order: List[str]
    datasets_created: List[Dict[str, str]]
