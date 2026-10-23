import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["engine"] == "great-generator"

def test_domains():
    res = client.get("/api/domains")
    assert res.status_code == 200
    data = res.json()
    assert "domains" in data
    assert len(data["domains"]) > 0

def test_templates():
    res = client.get("/api/templates")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 15

def test_ai_schema_suggestion():
    res = client.post("/api/ai/schema-suggestion", json={
        "prompt": "Generate 100 customers with names, emails, ages, and segments"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "customers"
    assert len(data["columns"]) >= 4

def test_generation_preview():
    preview_payload = {
        "columns": [
            {"name": "user_id", "dtype": "int", "description": "ID", "nullable": False},
            {"name": "name", "dtype": "str", "semantic_type": "name", "description": "Name", "nullable": False},
            {"name": "email", "dtype": "email", "semantic_type": "email", "description": "Email", "nullable": False},
            {"name": "age", "dtype": "int", "min_value": 18, "max_value": 75, "description": "Age"}
        ],
        "rows": 10,
        "seed": 42
    }
    res = client.post("/api/generate/preview", json=preview_payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) == 10
    assert "user_id" in data["columns"]
    assert "email" in data["columns"]

def test_full_dataset_and_mock_api_lifecycle():
    # 1. Generate Dataset
    gen_payload = {
        "name": "Integration Customers",
        "description": "Test dataset for automated E2E lifecycle",
        "rows": 50,
        "seed": 42,
        "mode": "schema",
        "columns": [
            {"name": "cust_id", "dtype": "int", "nullable": False},
            {"name": "full_name", "dtype": "str", "semantic_type": "name", "nullable": False},
            {"name": "email", "dtype": "email", "semantic_type": "email", "nullable": False},
            {"name": "age", "dtype": "int", "min_value": 20, "max_value": 65},
            {"name": "segment", "dtype": "enum", "accepted_values": ["Retail", "Wholesale"]}
        ]
    }
    gen_res = client.post("/api/generate", json=gen_payload)
    assert gen_res.status_code == 200
    dataset_info = gen_res.json()
    dataset_id = dataset_info["dataset_id"]
    assert dataset_info["row_count"] == 50

    # 2. Preview Dataset
    preview_res = client.get(f"/api/datasets/{dataset_id}/preview?limit=5")
    assert preview_res.status_code == 200
    assert len(preview_res.json()["records"]) == 5

    # 3. Export Dataset as CSV
    export_csv = client.get(f"/api/datasets/{dataset_id}/export?format=csv")
    assert export_csv.status_code == 200
    assert "cust_id" in export_csv.text

    # 4. Export Dataset as JSON
    export_json = client.get(f"/api/datasets/{dataset_id}/export?format=json")
    assert export_json.status_code == 200

    # 5. Export Dataset as Parquet
    export_parquet = client.get(f"/api/datasets/{dataset_id}/export?format=parquet")
    assert export_parquet.status_code == 200

    # 6. Run Data Quality Validation
    val_res = client.post(f"/api/datasets/{dataset_id}/validate", json={})
    assert val_res.status_code == 200
    report = val_res.json()
    assert report["quality_score"] > 80.0
    assert report["total_checks"] >= 8

    # 7. Create Mock REST API
    mock_payload = {
        "dataset_id": dataset_id,
        "resource_name": f"test_customers_{dataset_id[-4:]}",
        "primary_key": "cust_id"
    }
    mock_res = client.post("/api/mock-apis", json=mock_payload)
    assert mock_res.status_code == 200
    mock_info = mock_res.json()
    res_name = mock_info["resource_name"]

    # 8. Query Mock API (GET /api/mock/{resource})
    mock_get = client.get(f"/api/mock/{res_name}?limit=10")
    assert mock_get.status_code == 200
    mock_data = mock_get.json()
    assert mock_data["total"] == 50
    assert len(mock_data["data"]) == 10

    # 9. Mock API Create (POST /api/mock/{resource})
    new_record = {
        "cust_id": 9999,
        "full_name": "Test Synthetic User",
        "email": "synthetic.user@example.com",
        "age": 30,
        "segment": "Retail"
    }
    post_res = client.post(f"/api/mock/{res_name}", json=new_record)
    assert post_res.status_code == 201

    # 10. Mock API Get by ID (GET /api/mock/{resource}/9999)
    get_item = client.get(f"/api/mock/{res_name}/9999")
    assert get_item.status_code == 200
    assert get_item.json()["full_name"] == "Test Synthetic User"

    # 11. Mock API Update (PATCH /api/mock/{resource}/9999)
    patch_res = client.patch(f"/api/mock/{res_name}/9999", json={"age": 35})
    assert patch_res.status_code == 200
    assert patch_res.json()["age"] == 35

    # 12. Mock API Delete (DELETE /api/mock/{resource}/9999)
    del_res = client.delete(f"/api/mock/{res_name}/9999")
    assert del_res.status_code == 200

    # 13. Mock API Reset (POST /api/mock/{resource}/reset)
    reset_res = client.post(f"/api/mock/{res_name}/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["record_count"] == 50

    # 14. Fault Injection (simulate defects without touching original)
    fault_res = client.post(f"/api/datasets/{dataset_id}/fault-injection", json={
        "target_percentage": 20.0,
        "corrupt_missing": True,
        "corrupt_duplicates": True,
        "corrupt_emails": True,
        "corrupt_numeric_outliers": True
    })
    assert fault_res.status_code == 200
    fault_data = fault_res.json()
    corrupted_id = fault_data["corrupted_dataset_id"]

    # Verify original dataset still has 50 rows and high quality
    orig_check = client.get(f"/api/datasets/{dataset_id}/preview")
    assert orig_check.json()["total_rows"] == 50

    # Verify corrupted dataset fails quality checks
    corrupt_val = client.post(f"/api/datasets/{corrupted_id}/validate", json={})
    assert corrupt_val.status_code == 200
    assert corrupt_val.json()["quality_score"] < report["quality_score"]

    print("All backend acceptance lifecycle tests passed successfully!")
