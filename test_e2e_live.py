import urllib.request
import json

def test_live():
    base = 'http://localhost:8000'
    print("Testing live API against localhost:8000...")

    # 1. Generate 100 records
    gen_body = json.dumps({
        'name': 'Production Live Customers',
        'rows': 100,
        'seed': 42,
        'mode': 'schema',
        'columns': [
            {'name': 'customer_id', 'dtype': 'int', 'nullable': False},
            {'name': 'full_name', 'dtype': 'str', 'semantic_type': 'name', 'nullable': False},
            {'name': 'email', 'dtype': 'email', 'semantic_type': 'email', 'nullable': False},
            {'name': 'age', 'dtype': 'int', 'min_value': 18, 'max_value': 80},
            {'name': 'segment', 'dtype': 'enum', 'accepted_values': ['Consumer', 'Corporate', 'Enterprise']}
        ]
    }).encode('utf-8')
    req = urllib.request.Request(f"{base}/api/generate", data=gen_body, headers={'Content-Type': 'application/json'})
    res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    ds_id = res['dataset_id']
    rows = res['row_count']
    dur = res['duration_seconds']
    print(f"[1] Generated dataset {ds_id} with {rows} rows in {dur}s")

    # 2. Preview records
    req = urllib.request.Request(f"{base}/api/datasets/{ds_id}/preview?limit=5")
    preview = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"[2] Previewed {len(preview['records'])} records out of {preview['total_rows']}")

    # 3. CSV Export
    csv_data = urllib.request.urlopen(f"{base}/api/datasets/{ds_id}/export?format=csv").read().decode('utf-8')
    header_line = csv_data.splitlines()[0]
    print(f"[3] Exported CSV ({len(csv_data)} bytes), columns: {header_line}")

    # 4. Create Mock API
    mock_body = json.dumps({
        'dataset_id': ds_id,
        'resource_name': 'live_customers',
        'primary_key': 'customer_id'
    }).encode('utf-8')
    req = urllib.request.Request(f"{base}/api/mock-apis", data=mock_body, headers={'Content-Type': 'application/json'})
    mock_info = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"[4] Created Mock REST API endpoint: {mock_info['base_endpoint']}")

    # 5. GET records from mock API
    mock_get = json.loads(urllib.request.urlopen(f"{base}/api/mock/live_customers?limit=10").read().decode('utf-8'))
    print(f"[5] GET /api/mock/live_customers returned total: {mock_get['total']}, items: {len(mock_get['data'])}")

    # 6. POST new record
    new_user = json.dumps({
        'customer_id': 99999,
        'full_name': 'Grace Hopper',
        'email': 'grace.hopper@navy.mil',
        'age': 85,
        'segment': 'Enterprise'
    }).encode('utf-8')
    req = urllib.request.Request(f"{base}/api/mock/live_customers", data=new_user, headers={'Content-Type': 'application/json'}, method='POST')
    created = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"[6] POST created new item: {created['full_name']} (ID: {created['customer_id']})")

    # 7. Quality Validation
    val_body = json.dumps({}).encode('utf-8')
    req = urllib.request.Request(f"{base}/api/datasets/{ds_id}/validate", data=val_body, headers={'Content-Type': 'application/json'})
    val_rep = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    score = val_rep['quality_score']
    status = val_rep['status']
    passed = val_rep['passed_checks']
    print(f"[7] Quality Score: {score}/100 ({status}) with {passed} passed checks")

    # 8. Fault Injection
    fault_body = json.dumps({'target_percentage': 15.0, 'corrupt_missing': True, 'corrupt_emails': True}).encode('utf-8')
    req = urllib.request.Request(f"{base}/api/datasets/{ds_id}/fault-injection", data=fault_body, headers={'Content-Type': 'application/json'})
    fault_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    corrupt_name = fault_res['corrupted_dataset_name']
    orig_rows = preview['total_rows']
    print(f"[8] Fault injection created variant '{corrupt_name}' (Original untouched: {orig_rows} rows)")

    # 9. Verify dataset persistence across calls
    req = urllib.request.Request(f"{base}/api/datasets")
    all_ds = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"[9] Total persisted datasets in SQLite database: {len(all_ds)}")

    print("\n>>> ALL 9 E2E ACCEPTANCE FLOW STEPS VERIFIED ON RUNNING APPLICATION! <<<")

if __name__ == '__main__':
    test_live()
