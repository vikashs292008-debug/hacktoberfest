from typing import Optional, Any, List
from pydantic import BaseModel, Field
import datetime

class ColumnDefinition(BaseModel):
    name: str
    dtype: str = "str"  # "str", "int", "float", "bool", "date", "timestamp", "enum", "email", "uuid"
    semantic_type: Optional[str] = None
    nullable: bool = False
    description: Optional[str] = ""
    min_value: Optional[Any] = None
    max_value: Optional[Any] = None
    accepted_values: Optional[List[Any]] = None
    max_length: Optional[int] = None
    tags: Optional[List[str]] = None

class SchemaCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    primary_key: Optional[str] = "id"
    columns: List[ColumnDefinition]

class SchemaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    primary_key: Optional[str] = None
    columns: Optional[List[ColumnDefinition]] = None

class SchemaResponse(BaseModel):
    id: str
    name: str
    description: str
    primary_key: str
    columns: List[ColumnDefinition]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True
