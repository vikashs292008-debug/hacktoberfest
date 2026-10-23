from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.services.template_service import get_all_templates, get_template_by_id

router = APIRouter(prefix="/api/templates", tags=["Templates"])

@router.get("", response_model=List[Dict[str, Any]])
def list_templates():
    return get_all_templates()

@router.get("/{template_id}")
def get_template(template_id: str):
    t = get_template_by_id(template_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found.")
    return t
