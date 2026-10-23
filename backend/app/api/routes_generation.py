from typing import List, Optional
import time
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import great_generator as gg

from app.database.session import get_db
from app.database.models import DatasetModel, GenerationJobModel, SchemaModel
from app.schemas.dataset import (
    GenerateRequest,
    PreviewRequest,
    DatasetPreviewResponse,
    GenerationJobResponse
)
from app.schemas.schema_def import ColumnDefinition
from app.services.generator_service import (
    generate_dataframe,
    calculate_column_stats
)
from app.services.dataset_service import save_dataframe_as_dataset
from app.services.ai_copilot_service import parse_natural_language_schema

router = APIRouter(prefix="/api", tags=["Generation"])

@router.get("/domains")
def get_domains():
    try:
        domain_names = gg.list_domains()
        info_list = []
        for d in domain_names:
            try:
                schema = gg.get_domain_schema(d)
                tables = list(schema.tables.keys())
                desc = getattr(schema, "description", "")
                behaviors = list(getattr(schema, "behaviors", []))
                info_list.append({
                    "name": d,
                    "description": desc,
                    "tables": tables,
                    "behaviors": behaviors
                })
            except Exception:
                info_list.append({"name": d, "description": "", "tables": [], "behaviors": []})
        return {"domains": info_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/domains/{name}")
def get_domain_detail(name: str):
    try:
        schema = gg.get_domain_schema(name)
        tables_data = {}
        for tname, table in schema.tables.items():
            cols = []
            for col in table.columns:
                cols.append({
                    "name": col.name,
                    "dtype": str(col.dtype),
                    "nullable": col.nullable,
                    "description": col.description
                })
            tables_data[tname] = {
                "name": tname,
                "columns": cols,
                "primary_key": getattr(table, "primary_key", None),
                "description": getattr(table, "description", "")
            }
        return {
            "name": name,
            "description": getattr(schema, "description", ""),
            "tables": tables_data,
            "behaviors": list(getattr(schema, "behaviors", []))
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Domain '{name}' not found: {str(e)}")

@router.post("/generate/preview", response_model=DatasetPreviewResponse)
def preview_generation(req: PreviewRequest):
    try:
        cols = req.columns or []
        df, _ = generate_dataframe(
            columns=cols,
            mode="schema" if cols else "domain",
            rows=min(req.rows, 50),
            seed=req.seed,
            realism=req.realism,
            domain=req.domain,
            table=req.table,
            ddl_text=req.ddl_text
        )

        json_str = df.to_json(orient="records", date_format="iso")
        records = json.loads(json_str)
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        stats = calculate_column_stats(df)

        return DatasetPreviewResponse(
            columns=list(df.columns),
            dtypes=dtypes,
            records=records,
            total_rows=len(df),
            preview_rows=len(records),
            column_stats=stats
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preview generation failed: {str(e)}")

@router.post("/generate")
def generate_dataset(req: GenerateRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        cols = req.columns
        table_name = req.name.strip().lower().replace(" ", "_")
        primary_key = "id"

        # If natural language prompt was provided in nl_prompt mode
        if req.mode == "nl_prompt" and req.nl_prompt:
            suggested = parse_natural_language_schema(req.nl_prompt)
            cols = suggested.columns
            table_name = suggested.name
            primary_key = suggested.primary_key
            req.rows = req.rows or suggested.suggested_rows

        # If schema_id provided, load schema definition
        if req.schema_id and not cols:
            schema_model = db.query(SchemaModel).filter(SchemaModel.id == req.schema_id).first()
            if schema_model:
                cols = [ColumnDefinition(**c) for c in schema_model.schema_definition]
                primary_key = schema_model.primary_key
                table_name = schema_model.name.lower().replace(" ", "_")

        df, duration = generate_dataframe(
            columns=cols,
            mode=req.mode,
            table_name=table_name,
            primary_key=primary_key,
            rows=req.rows,
            seed=req.seed,
            realism=req.realism,
            domain=req.domain,
            table=req.table,
            ddl_text=req.ddl_text
        )

        # Save to persistent storage and database
        dataset = save_dataframe_as_dataset(
            db=db,
            df=df,
            name=req.name,
            description=req.description or f"Generated {len(df)} records using Great Generator",
            source="generator",
            schema_id=req.schema_id,
            generation_config={
                "requested_rows": req.rows,
                "seed": req.seed,
                "realism": req.realism,
                "mode": req.mode,
                "duration_seconds": duration
            }
        )

        # Log generation job
        job = GenerationJobModel(
            dataset_id=dataset.id,
            schema_name=req.name,
            status="completed",
            requested_rows=req.rows,
            actual_rows=len(df),
            duration_seconds=duration,
            seed=req.seed,
            config=req.dict()
        )
        db.add(job)
        db.commit()

        # Build preview payload
        json_records = json.loads(df.head(20).to_json(orient="records", date_format="iso"))
        stats = calculate_column_stats(df)

        return {
            "dataset_id": dataset.id,
            "job_id": job.id,
            "name": dataset.name,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": list(df.columns),
            "duration_seconds": duration,
            "size_bytes": dataset.size_bytes,
            "preview_records": json_records,
            "column_stats": stats,
            "created_at": dataset.created_at.isoformat()
        }

    except Exception as e:
        duration = round(time.time() - start_time, 4)
        job = GenerationJobModel(
            schema_name=req.name,
            status="failed",
            requested_rows=req.rows,
            actual_rows=0,
            duration_seconds=duration,
            seed=req.seed,
            error_message=str(e),
            config=req.dict()
        )
        db.add(job)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Generation failed: {str(e)}")

@router.get("/generations", response_model=List[GenerationJobResponse])
def list_generation_jobs(db: Session = Depends(get_db)):
    jobs = db.query(GenerationJobModel).order_by(GenerationJobModel.created_at.desc()).all()
    return jobs

@router.get("/generations/{job_id}", response_model=GenerationJobResponse)
def get_generation_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(GenerationJobModel).filter(GenerationJobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Generation job '{job_id}' not found.")
    return job
