from typing import Optional, Any, List, Dict
from pydantic import BaseModel
from app.schemas.schema_def import ColumnDefinition

class PromptToSchemaRequest(BaseModel):
    prompt: str

class SchemaSuggestionResponse(BaseModel):
    name: str
    description: str
    primary_key: str
    columns: List[ColumnDefinition]
    rationale: str
    suggested_rows: int = 100

class ExplainQualityRequest(BaseModel):
    report_id: Optional[str] = None
    dataset_id: Optional[str] = None
    checks_detail: Optional[List[Dict[str, Any]]] = None

class ExplainQualityResponse(BaseModel):
    overall_assessment: str
    root_causes: List[str]
    actionable_remediation: List[str]
    suggested_constraints: List[str]

class TemplateSuggestionRequest(BaseModel):
    industry_or_use_case: str

class TemplateSuggestionResponse(BaseModel):
    recommended_templates: List[Dict[str, Any]]
    custom_enhancements: List[str]
