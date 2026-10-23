from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import RelationshipProjectModel
from app.schemas.relationship import (
    RelationalProjectCreate,
    RelationalGenerateRequest,
    RelationalGenerateResponse
)
from app.services.relational_service import generate_relational_project

router = APIRouter(prefix="/api/relationships", tags=["Relationship Designer"])

@router.post("/generate", response_model=RelationalGenerateResponse)
def generate_relational(
    req: RelationalProjectCreate,
    seed: int = 42,
    realism: str = "realistic",
    save_datasets: bool = True,
    db: Session = Depends(get_db)
):
    try:
        res = generate_relational_project(
            db=db,
            project_name=req.name,
            tables=req.tables,
            relationships=req.relationships,
            seed=seed,
            realism=realism,
            save_datasets=save_datasets
        )

        # Record project configuration
        proj = RelationshipProjectModel(
            name=req.name,
            description=req.description or "",
            tables_config=[t.dict() for t in req.tables],
            relationships_config=[r.dict() for r in req.relationships],
            status="generated"
        )
        db.add(proj)
        db.commit()

        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Relational generation failed: {str(e)}")

@router.get("/templates/sample-ecommerce")
def get_sample_ecommerce_relational():
    """Returns a ready-to-use star schema configuration (Customers, Products, Orders, Order Items, Payments)."""
    return {
        "name": "E-Commerce Relational Model",
        "description": "5 interconnected tables featuring parent-child constraints and foreign key referential integrity.",
        "tables": [
            {
                "name": "customers",
                "row_count": 25,
                "primary_key": "customer_id",
                "columns": [
                    {"name": "customer_id", "dtype": "int", "description": "PK"},
                    {"name": "full_name", "dtype": "str", "semantic_type": "name"},
                    {"name": "email", "dtype": "email", "semantic_type": "email"},
                    {"name": "country", "dtype": "enum", "accepted_values": ["US", "UK", "DE", "CA", "IN"]}
                ]
            },
            {
                "name": "products",
                "row_count": 20,
                "primary_key": "product_id",
                "columns": [
                    {"name": "product_id", "dtype": "int", "description": "PK"},
                    {"name": "product_name", "dtype": "str"},
                    {"name": "category", "dtype": "enum", "accepted_values": ["Electronics", "Apparel", "Home", "Books"]},
                    {"name": "price", "dtype": "float", "min_value": 9.99, "max_value": 499.99}
                ]
            },
            {
                "name": "orders",
                "row_count": 50,
                "primary_key": "order_id",
                "columns": [
                    {"name": "order_id", "dtype": "int", "description": "PK"},
                    {"name": "customer_id", "dtype": "int", "description": "FK to customers"},
                    {"name": "order_date", "dtype": "date"},
                    {"name": "order_status", "dtype": "enum", "accepted_values": ["Completed", "Pending", "Processing"]}
                ]
            },
            {
                "name": "order_items",
                "row_count": 100,
                "primary_key": "item_id",
                "columns": [
                    {"name": "item_id", "dtype": "int", "description": "PK"},
                    {"name": "order_id", "dtype": "int", "description": "FK to orders"},
                    {"name": "product_id", "dtype": "int", "description": "FK to products"},
                    {"name": "quantity", "dtype": "int", "min_value": 1, "max_value": 5},
                    {"name": "unit_price", "dtype": "float", "min_value": 9.99, "max_value": 499.99}
                ]
            },
            {
                "name": "payments",
                "row_count": 50,
                "primary_key": "payment_id",
                "columns": [
                    {"name": "payment_id", "dtype": "int", "description": "PK"},
                    {"name": "order_id", "dtype": "int", "description": "FK to orders"},
                    {"name": "amount", "dtype": "float", "min_value": 10.0, "max_value": 1500.0},
                    {"name": "payment_method", "dtype": "enum", "accepted_values": ["Credit Card", "PayPal", "Apple Pay"]}
                ]
            }
        ],
        "relationships": [
            {
                "parent_table": "customers",
                "child_table": "orders",
                "parent_key": "customer_id",
                "foreign_key": "customer_id",
                "cardinality": "one_to_many"
            },
            {
                "parent_table": "orders",
                "child_table": "order_items",
                "parent_key": "order_id",
                "foreign_key": "order_id",
                "cardinality": "one_to_many"
            },
            {
                "parent_table": "products",
                "child_table": "order_items",
                "parent_key": "product_id",
                "foreign_key": "product_id",
                "cardinality": "one_to_many"
            },
            {
                "parent_table": "orders",
                "child_table": "payments",
                "parent_key": "order_id",
                "foreign_key": "order_id",
                "cardinality": "one_to_one"
            }
        ]
    }
