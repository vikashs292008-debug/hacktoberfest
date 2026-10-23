from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import ValidationReportModel
from app.schemas.ai import (
    PromptToSchemaRequest,
    SchemaSuggestionResponse,
    ExplainQualityRequest,
    ExplainQualityResponse,
    TemplateSuggestionRequest,
    TemplateSuggestionResponse
)
from app.services.ai_copilot_service import (
    parse_natural_language_schema,
    explain_quality_issues,
    suggest_templates_for_industry
)

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

@router.post("/schema-suggestion", response_model=SchemaSuggestionResponse)
def suggest_schema_from_prompt(req: PromptToSchemaRequest):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    try:
        return parse_natural_language_schema(req.prompt.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Copilot failed to parse prompt: {str(e)}")

@router.post("/explain-quality", response_model=ExplainQualityResponse)
def explain_quality(req: ExplainQualityRequest, db: Session = Depends(get_db)):
    checks = req.checks_detail or []
    if req.report_id and not checks:
        rep = db.query(ValidationReportModel).filter(ValidationReportModel.id == req.report_id).first()
        if rep:
            checks = rep.checks_detail
    return explain_quality_issues(checks)

@router.post("/template-suggestion", response_model=TemplateSuggestionResponse)
def suggest_template(req: TemplateSuggestionRequest):
    return suggest_templates_for_industry(req.industry_or_use_case)
