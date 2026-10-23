from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_relational_generation():
    req = {
        "name": "E-Commerce Star Schema",
        "description": "Relational generation test",
        "tables": [
            {
                "name": "customers",
                "row_count": 15,
                "primary_key": "customer_id",
                "columns": [
                    {"name": "customer_id", "dtype": "int", "nullable": False},
                    {"name": "name", "dtype": "str", "semantic_type": "name"},
                    {"name": "email", "dtype": "email"}
                ]
            },
            {
                "name": "orders",
                "row_count": 30,
                "primary_key": "order_id",
                "columns": [
                    {"name": "order_id", "dtype": "int", "nullable": False},
                    {"name": "customer_id", "dtype": "int", "nullable": False},
                    {"name": "order_date", "dtype": "date"},
                    {"name": "amount", "dtype": "float", "min_value": 10.0, "max_value": 500.0}
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
            }
        ]
    }
    res = client.post("/api/relationships/generate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["integrity_report"]["overall_valid"] is True
    assert data["generation_order"] == ["customers", "orders"]
    assert "customers" in data["generated_tables"]
    assert "orders" in data["generated_tables"]
