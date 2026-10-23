import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import DatasetModel, ValidationReportModel
from app.schemas.quality import (
    ValidateRequest,
    ValidationReportResponse,
    FaultInjectionRequest,
    FaultInjectionResponse
)
from app.services.dataset_service import load_dataset_dataframe
from app.services.quality_service import (
    run_dataset_validation,
    inject_faults_into_dataset
)

router = APIRouter(prefix="/api", tags=["Data Quality"])

@router.post("/datasets/{dataset_id}/validate", response_model=ValidationReportResponse)
def validate_dataset_endpoint(
    dataset_id: str,
    req: ValidateRequest = ValidateRequest(),
    db: Session = Depends(get_db)
):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    df = load_dataset_dataframe(ds)
    report, summary = run_dataset_validation(db=db, dataset=ds, df=df)

    return ValidationReportResponse(
        id=report.id,
        dataset_id=ds.id,
        dataset_name=ds.name,
        quality_score=report.quality_score,
        status=report.status,
        total_checks=report.total_checks,
        passed_checks=report.passed_checks,
        failed_checks=report.failed_checks,
        summary=summary,
        checks=report.checks_detail,
        scoring_formula=report.scoring_formula,
        created_at=report.created_at
    )

@router.get("/datasets/{dataset_id}/quality-report", response_model=Optional[ValidationReportResponse])
def get_dataset_quality_report(dataset_id: str, db: Session = Depends(get_db)):
    report = db.query(ValidationReportModel).filter(
        ValidationReportModel.dataset_id == dataset_id
    ).order_by(ValidationReportModel.created_at.desc()).first()

    if not report:
        # If no report exists, run validation now
        ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        if not ds:
            raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
        df = load_dataset_dataframe(ds)
        report, _ = run_dataset_validation(db=db, dataset=ds, df=df)

    return ValidationReportResponse(
        id=report.id,
        dataset_id=report.dataset_id,
        dataset_name=report.dataset_name,
        quality_score=report.quality_score,
        status=report.status,
        total_checks=report.total_checks,
        passed_checks=report.passed_checks,
        failed_checks=report.failed_checks,
        summary={"score": report.quality_score, "status": report.status},
        checks=report.checks_detail,
        scoring_formula=report.scoring_formula,
        created_at=report.created_at
    )

@router.post("/datasets/{dataset_id}/fault-injection", response_model=FaultInjectionResponse)
def fault_injection_endpoint(
    dataset_id: str,
    req: FaultInjectionRequest,
    db: Session = Depends(get_db)
):
    ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    df = load_dataset_dataframe(ds)

    corrupted_dataset, transforms, affected_cnt = inject_faults_into_dataset(
        db=db,
        original_dataset=ds,
        df=df,
        target_percentage=req.target_percentage,
        corrupt_missing=req.corrupt_missing,
        corrupt_duplicates=req.corrupt_duplicates,
        corrupt_emails=req.corrupt_emails,
        corrupt_numeric_outliers=req.corrupt_numeric_outliers,
        corrupt_enums=req.corrupt_enums,
        corrupt_dates=req.corrupt_dates,
        new_dataset_name=req.new_dataset_name
    )

    return FaultInjectionResponse(
        original_dataset_id=ds.id,
        corrupted_dataset_id=corrupted_dataset.id,
        corrupted_dataset_name=corrupted_dataset.name,
        injected_transformations=transforms,
        total_records_affected=affected_cnt,
        created_at=corrupted_dataset.created_at
    )

@router.get("/reports", response_model=List[ValidationReportResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(ValidationReportModel).order_by(ValidationReportModel.created_at.desc()).all()
    return [
        ValidationReportResponse(
            id=r.id,
            dataset_id=r.dataset_id,
            dataset_name=r.dataset_name,
            quality_score=r.quality_score,
            status=r.status,
            total_checks=r.total_checks,
            passed_checks=r.passed_checks,
            failed_checks=r.failed_checks,
            summary={"score": r.quality_score, "status": r.status},
            checks=r.checks_detail,
            scoring_formula=r.scoring_formula,
            created_at=r.created_at
        ) for r in reports
    ]

@router.get("/reports/{report_id}/export")
def export_report_file(
    report_id: str,
    format: str = Query("json", regex="^(json|markdown)$"),
    db: Session = Depends(get_db)
):
    r = db.query(ValidationReportModel).filter(ValidationReportModel.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")

    if format == "markdown":
        md = f"""# Data Quality Report: {r.dataset_name}
**Report ID**: `{r.id}`  
**Dataset ID**: `{r.dataset_id}`  
**Generated At**: {r.created_at.isoformat()}  
**Overall Quality Score**: **{r.quality_score}/100** ({r.status})  
**Checks**: {r.passed_checks} Passed / {r.failed_checks} Failed (Total: {r.total_checks})

## Scoring Formula
> {r.scoring_formula}

## Detailed Validation Checks

| Check Name | Category | Status | Impact | Description |
|------------|----------|--------|--------|-------------|
"""
        for c in r.checks_detail:
            status_icon = "PASS" if c.get("passed") else "FAIL"
            md += f"| `{c.get('check_name')}` | {c.get('category')} | {status_icon} | -{c.get('score_impact')} pts | {c.get('description')} |\n"

        content = md.encode("utf-8")
        filename = f"quality_report_{r.id[:8]}.md"
        media_type = "text/markdown"
    else:
        payload = {
            "id": r.id,
            "dataset_id": r.dataset_id,
            "dataset_name": r.dataset_name,
            "quality_score": r.quality_score,
            "status": r.status,
            "total_checks": r.total_checks,
            "passed_checks": r.passed_checks,
            "failed_checks": r.failed_checks,
            "scoring_formula": r.scoring_formula,
            "checks": r.checks_detail,
            "created_at": r.created_at.isoformat()
        }
        content = json.dumps(payload, indent=2).encode("utf-8")
        filename = f"quality_report_{r.id[:8]}.json"
        media_type = "application/json"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )
