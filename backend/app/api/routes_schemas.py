from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import SchemaModel
from app.schemas.schema_def import SchemaCreate, SchemaUpdate, SchemaResponse

router = APIRouter(prefix="/api/schemas", tags=["Schemas"])

@router.post("", response_model=SchemaResponse)
def create_schema(req: SchemaCreate, db: Session = Depends(get_db)):
    schema = SchemaModel(
        name=req.name,
        description=req.description or "",
        primary_key=req.primary_key or "id",
        schema_definition=[c.dict() for c in req.columns]
    )
    db.add(schema)
    db.commit()
    db.refresh(schema)
    return SchemaResponse(
        id=schema.id,
        name=schema.name,
        description=schema.description,
        primary_key=schema.primary_key,
        columns=schema.schema_definition,
        created_at=schema.created_at,
        updated_at=schema.updated_at
    )

@router.get("", response_model=List[SchemaResponse])
def list_schemas(db: Session = Depends(get_db)):
    schemas = db.query(SchemaModel).order_by(SchemaModel.created_at.desc()).all()
    return [
        SchemaResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            primary_key=s.primary_key,
            columns=s.schema_definition,
            created_at=s.created_at,
            updated_at=s.updated_at
        ) for s in schemas
    ]

@router.get("/{schema_id}", response_model=SchemaResponse)
def get_schema(schema_id: str, db: Session = Depends(get_db)):
    s = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Schema '{schema_id}' not found.")
    return SchemaResponse(
        id=s.id,
        name=s.name,
        description=s.description,
        primary_key=s.primary_key,
        columns=s.schema_definition,
        created_at=s.created_at,
        updated_at=s.updated_at
    )

@router.put("/{schema_id}", response_model=SchemaResponse)
def update_schema(schema_id: str, req: SchemaUpdate, db: Session = Depends(get_db)):
    s = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Schema '{schema_id}' not found.")
    if req.name is not None:
        s.name = req.name
    if req.description is not None:
        s.description = req.description
    if req.primary_key is not None:
        s.primary_key = req.primary_key
    if req.columns is not None:
        s.schema_definition = [c.dict() for c in req.columns]
    db.commit()
    db.refresh(s)
    return SchemaResponse(
        id=s.id,
        name=s.name,
        description=s.description,
        primary_key=s.primary_key,
        columns=s.schema_definition,
        created_at=s.created_at,
        updated_at=s.updated_at
    )

@router.delete("/{schema_id}")
def delete_schema(schema_id: str, db: Session = Depends(get_db)):
    s = db.query(SchemaModel).filter(SchemaModel.id == schema_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Schema '{schema_id}' not found.")
    db.delete(s)
    db.commit()
    return {"success": True, "message": f"Schema '{s.name}' deleted."}
