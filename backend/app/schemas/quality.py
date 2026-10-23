from typing import Optional, Any, List, Dict
from pydantic import BaseModel
import datetime

class CheckResult(BaseModel):
    check_name: str
    category: str
    passed: bool
    description: str
    score_impact: float
    affected_count: int
    affected_columns: List[str]
    representative_errors: List[str]
    suggested_fix: Optional[str] = None

class ValidateRequest(BaseModel):
    strict: bool = False
    custom_rules: Optional[Dict[str, Any]] = None

class ValidationReportResponse(BaseModel):
    id: str
    dataset_id: str
    dataset_name: str
    quality_score: float
    status: str  # "PASSED", "WARNING", "FAILED"
    total_checks: int
    passed_checks: int
    failed_checks: int
    summary: Dict[str, Any]
    checks: List[CheckResult]
    scoring_formula: str
    created_at: datetime.datetime

class FaultInjectionRequest(BaseModel):
    new_dataset_name: Optional[str] = None
    target_percentage: float = 10.0  # e.g. 10%
    corrupt_missing: bool = True
    corrupt_duplicates: bool = True
    corrupt_emails: bool = True
    corrupt_numeric_outliers: bool = True
    corrupt_enums: bool = True
    corrupt_dates: bool = False
    target_columns: Optional[List[str]] = None

class FaultInjectionResponse(BaseModel):
    original_dataset_id: str
    corrupted_dataset_id: str
    corrupted_dataset_name: str
    injected_transformations: List[Dict[str, Any]]
    total_records_affected: int
    created_at: datetime.datetime
