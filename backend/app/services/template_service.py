from typing import List, Dict, Any

TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "personal_expenses_in",
        "name": "Personal Expenses (India)",
        "category": "Finance & Economics",
        "description": "Realistic household and personal financial profiles in INR across Indian metropolitan & tier-2 cities with correlated rent, groceries, commute, utilities, medical, total expenses, and net savings.",
        "intended_use": "Fintech credit scoring, budgeting apps, wealth management modeling, personal financial planning",
        "default_rows": 1000,
        "primary_key": "person_id",
        "columns": [
            {"name": "person_id", "dtype": "int", "description": "Unique individual sequence identifier", "nullable": False},
            {"name": "full_name", "dtype": "str", "semantic_type": "name", "description": "Culturally realistic Indian full name", "nullable": False},
            {"name": "age", "dtype": "int", "min_value": 18, "max_value": 70, "description": "Age of the individual in years"},
            {"name": "occupation", "dtype": "enum", "accepted_values": ["Software Engineer", "Senior Software Architect", "Data Scientist", "Doctor / Physician", "Chartered Accountant", "Marketing Manager", "High School Teacher", "Civil Engineer", "Bank Probationary Officer", "Business Analyst", "Graphic / UI Designer", "Operations Executive", "Senior Consultant", "College Professor"], "description": "Current profession"},
            {"name": "city", "dtype": "enum", "accepted_values": ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Chandigarh", "Lucknow", "Indore", "Kochi"], "description": "City of residence in India"},
            {"name": "monthly_salary", "dtype": "int", "min_value": 25000, "max_value": 450000, "description": "Monthly gross salary in INR"},
            {"name": "rent", "dtype": "int", "min_value": 4000, "max_value": 120000, "description": "Monthly residential rent in INR"},
            {"name": "groceries", "dtype": "int", "min_value": 3500, "max_value": 25000, "description": "Monthly grocery and food expenditure in INR"},
            {"name": "transport", "dtype": "int", "min_value": 1500, "max_value": 18000, "description": "Monthly commute, metro, cab, and fuel in INR"},
            {"name": "electricity_bill", "dtype": "int", "min_value": 800, "max_value": 9500, "description": "Monthly electricity & power charges in INR"},
            {"name": "shopping", "dtype": "int", "min_value": 800, "max_value": 35000, "description": "Discretionary retail and apparel spend in INR"},
            {"name": "entertainment", "dtype": "int", "min_value": 500, "max_value": 25000, "description": "Dining out, OTT, movies, and events in INR"},
            {"name": "medical", "dtype": "int", "min_value": 500, "max_value": 15000, "description": "Healthcare, pharmacy, and clinic expenses in INR"},
            {"name": "total_expenses", "dtype": "int", "description": "Exact mathematical sum of all expenditure categories in INR"},
            {"name": "savings", "dtype": "int", "description": "Monthly net surplus or deficit (monthly_salary - total_expenses)"}
        ]
    },
    {
        "id": "customers",
        "name": "Customers",
        "category": "E-Commerce & Retail",
        "description": "Fictional consumer & B2B customer profiles with contact info, demographic details, segments, and lifetime metrics.",
        "intended_use": "CRM testing, customer segmentation, onboarding flows",
        "default_rows": 100,
        "primary_key": "customer_id",
        "columns": [
            {"name": "customer_id", "dtype": "int", "description": "Unique customer identifier", "nullable": False},
            {"name": "full_name", "dtype": "str", "semantic_type": "name", "description": "Customer full name", "nullable": False},
            {"name": "email", "dtype": "email", "semantic_type": "email", "description": "Contact email address", "nullable": False},
            {"name": "age", "dtype": "int", "min_value": 18, "max_value": 85, "description": "Customer age in years", "nullable": False},
            {"name": "segment", "dtype": "enum", "accepted_values": ["Consumer", "Corporate", "Small Business", "Enterprise"], "description": "Market segment"},
            {"name": "country", "dtype": "enum", "accepted_values": ["United States", "United Kingdom", "Germany", "Canada", "Australia", "India"], "description": "Country of residence"},
            {"name": "signup_date", "dtype": "date", "description": "Account registration date", "nullable": False},
            {"name": "lifetime_value", "dtype": "float", "min_value": 0.0, "max_value": 15000.0, "description": "Calculated customer lifetime value"},
            {"name": "is_active", "dtype": "bool", "description": "Active subscription or purchase status", "nullable": False}
        ]
    },
    {
        "id": "products",
        "name": "Products",
        "category": "E-Commerce & Retail",
        "description": "Product catalog with SKUs, category hierarchies, pricing, cost of goods, and stock status.",
        "intended_use": "Catalog management, search indexing, pricing engine simulation",
        "default_rows": 50,
        "primary_key": "product_id",
        "columns": [
            {"name": "product_id", "dtype": "int", "description": "Product identifier", "nullable": False},
            {"name": "product_name", "dtype": "str", "description": "Commercial product title", "nullable": False},
            {"name": "category", "dtype": "enum", "accepted_values": ["Electronics", "Home & Kitchen", "Apparel", "Sports & Outdoors", "Books", "Beauty"], "description": "Merchandising category"},
            {"name": "sku", "dtype": "str", "description": "Stock Keeping Unit alphanumeric code"},
            {"name": "price", "dtype": "float", "min_value": 4.99, "max_value": 1999.99, "description": "Retail price in USD"},
            {"name": "cost", "dtype": "float", "min_value": 1.50, "max_value": 900.00, "description": "Cost of goods sold"},
            {"name": "stock_quantity", "dtype": "int", "min_value": 0, "max_value": 500, "description": "Available inventory units"},
            {"name": "rating", "dtype": "float", "min_value": 1.0, "max_value": 5.0, "description": "Customer review rating"},
            {"name": "in_stock", "dtype": "bool", "description": "Immediate fulfillment availability"}
        ]
    },
    {
        "id": "orders",
        "name": "Orders",
        "category": "E-Commerce & Retail",
        "description": "Customer purchase orders with timestamps, monetary totals, payment methods, and shipping statuses.",
        "intended_use": "Order processing, checkout testing, revenue reporting",
        "default_rows": 200,
        "primary_key": "order_id",
        "columns": [
            {"name": "order_id", "dtype": "int", "description": "Unique order identifier", "nullable": False},
            {"name": "customer_id", "dtype": "int", "description": "Reference to purchasing customer", "nullable": False},
            {"name": "order_date", "dtype": "date", "description": "Date order was placed", "nullable": False},
            {"name": "status", "dtype": "enum", "accepted_values": ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], "description": "Current fulfillment status"},
            {"name": "total_amount", "dtype": "float", "min_value": 9.99, "max_value": 4500.00, "description": "Grand total charged to customer"},
            {"name": "tax_amount", "dtype": "float", "min_value": 0.50, "max_value": 400.00, "description": "Applicable sales tax"},
            {"name": "shipping_fee", "dtype": "float", "min_value": 0.0, "max_value": 45.0, "description": "Shipping cost"},
            {"name": "payment_method", "dtype": "enum", "accepted_values": ["Credit Card", "PayPal", "Apple Pay", "Bank Transfer", "Klarna"], "description": "Payment gateway method"}
        ]
    },
    {
        "id": "inventory",
        "name": "Inventory",
        "category": "Supply Chain",
        "description": "Warehouse stock levels, bin locations, restock thresholds, reorder points, and lead times.",
        "intended_use": "Warehouse management system (WMS) testing, supply chain simulations",
        "default_rows": 100,
        "primary_key": "inventory_id",
        "columns": [
            {"name": "inventory_id", "dtype": "int", "description": "Inventory ledger ID", "nullable": False},
            {"name": "product_id", "dtype": "int", "description": "Target product ID", "nullable": False},
            {"name": "warehouse_code", "dtype": "enum", "accepted_values": ["WH-NORTH", "WH-SOUTH", "WH-EAST", "WH-WEST", "WH-CENTRAL"], "description": "Facility identifier"},
            {"name": "quantity_on_hand", "dtype": "int", "min_value": 0, "max_value": 1000, "description": "Current physical stock"},
            {"name": "quantity_reserved", "dtype": "int", "min_value": 0, "max_value": 200, "description": "Allocated for pending orders"},
            {"name": "reorder_point", "dtype": "int", "min_value": 20, "max_value": 150, "description": "Safety stock replenishment threshold"},
            {"name": "last_audit_date", "dtype": "date", "description": "Last physical inventory audit date"}
        ]
    },
    {
        "id": "transactions",
        "name": "Transactions",
        "category": "Finance & Banking",
        "description": "Banking transactions including deposits, withdrawals, merchant purchases, and currency details.",
        "intended_use": "Fraud detection models, accounting systems, fintech dashboards",
        "default_rows": 300,
        "primary_key": "transaction_id",
        "columns": [
            {"name": "transaction_id", "dtype": "int", "description": "Unique transaction sequence", "nullable": False},
            {"name": "account_id", "dtype": "int", "description": "Originating bank account ID", "nullable": False},
            {"name": "amount", "dtype": "float", "min_value": 1.0, "max_value": 10000.0, "description": "Transaction amount in USD"},
            {"name": "type", "dtype": "enum", "accepted_values": ["Deposit", "Withdrawal", "Purchase", "Transfer", "Refund", "Fee"], "description": "Transaction classification"},
            {"name": "category", "dtype": "enum", "accepted_values": ["Groceries", "Dining", "Utilities", "Travel", "Entertainment", "Payroll"], "description": "Merchant category code group"},
            {"name": "transaction_date", "dtype": "date", "description": "Settlement date", "nullable": False},
            {"name": "is_flagged_fraud", "dtype": "bool", "description": "Fraud anomaly flag"}
        ]
    },
    {
        "id": "employees",
        "name": "Employees",
        "category": "Human Resources",
        "description": "Corporate staff directory with job titles, departments, salaries, hire dates, and manager references.",
        "intended_use": "HRIS testing, org chart generation, payroll reporting",
        "default_rows": 75,
        "primary_key": "employee_id",
        "columns": [
            {"name": "employee_id", "dtype": "int", "description": "Unique employee payroll ID", "nullable": False},
            {"name": "full_name", "dtype": "str", "semantic_type": "name", "description": "Full legal name", "nullable": False},
            {"name": "work_email", "dtype": "email", "semantic_type": "email", "description": "Corporate email address", "nullable": False},
            {"name": "department", "dtype": "enum", "accepted_values": ["Engineering", "Product", "Sales", "Marketing", "Customer Support", "Finance", "HR", "Legal"], "description": "Corporate division"},
            {"name": "job_title", "dtype": "str", "description": "Official job position"},
            {"name": "salary", "dtype": "float", "min_value": 45000.0, "max_value": 240000.0, "description": "Annual compensation in USD"},
            {"name": "hire_date", "dtype": "date", "description": "Original start date", "nullable": False},
            {"name": "is_manager", "dtype": "bool", "description": "People management indicator"}
        ]
    },
    {
        "id": "students",
        "name": "Students",
        "category": "Education",
        "description": "Academic roster with grade levels, majors, GPAs, enrollment status, and student IDs.",
        "intended_use": "Student information systems (SIS), academic reporting, LMS testing",
        "default_rows": 100,
        "primary_key": "student_id",
        "columns": [
            {"name": "student_id", "dtype": "int", "description": "Academic matriculation number", "nullable": False},
            {"name": "full_name", "dtype": "str", "semantic_type": "name", "description": "Student full name", "nullable": False},
            {"name": "email", "dtype": "email", "semantic_type": "email", "description": "University email", "nullable": False},
            {"name": "grade_level", "dtype": "enum", "accepted_values": ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"], "description": "Year of study"},
            {"name": "major", "dtype": "enum", "accepted_values": ["Computer Science", "Business Administration", "Mechanical Engineering", "Psychology", "Biology", "Economics"], "description": "Primary study field"},
            {"name": "gpa", "dtype": "float", "min_value": 1.8, "max_value": 4.0, "description": "Cumulative grade point average"},
            {"name": "enrollment_date", "dtype": "date", "description": "Program enrollment date"}
        ]
    },
    {
        "id": "school_attendance",
        "name": "School Attendance",
        "category": "Education",
        "description": "Daily student attendance tracking records with attendance codes, timestamps, and excuse reasons.",
        "intended_use": "Attendance tracking systems, compliance audits, alert triggers",
        "default_rows": 250,
        "primary_key": "attendance_id",
        "columns": [
            {"name": "attendance_id", "dtype": "int", "description": "Attendance log ID", "nullable": False},
            {"name": "student_id", "dtype": "int", "description": "Student ID reference", "nullable": False},
            {"name": "date", "dtype": "date", "description": "Session date", "nullable": False},
            {"name": "status", "dtype": "enum", "accepted_values": ["Present", "Tardy", "Excused Absence", "Unexcused Absence", "Remote"], "description": "Attendance status"},
            {"name": "period", "dtype": "int", "min_value": 1, "max_value": 8, "description": "Class period index"},
            {"name": "notes", "dtype": "str", "description": "Teacher remarks or notes"}
        ]
    },
    {
        "id": "hospital_appointments",
        "name": "Hospital Appointments",
        "category": "Healthcare",
        "description": "Outpatient clinic schedules with doctor IDs, departments, visit reasons, and consultation durations.",
        "intended_use": "Electronic Health Record (EHR) testing, patient scheduling simulators",
        "default_rows": 100,
        "primary_key": "appointment_id",
        "columns": [
            {"name": "appointment_id", "dtype": "int", "description": "Clinical encounter ID", "nullable": False},
            {"name": "patient_id", "dtype": "int", "description": "Patient identifier", "nullable": False},
            {"name": "doctor_name", "dtype": "str", "description": "Attending physician name"},
            {"name": "department", "dtype": "enum", "accepted_values": ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology", "General Medicine"], "description": "Specialty clinic"},
            {"name": "appointment_date", "dtype": "date", "description": "Scheduled date", "nullable": False},
            {"name": "duration_minutes", "dtype": "int", "min_value": 15, "max_value": 90, "description": "Consultation time in minutes"},
            {"name": "status", "dtype": "enum", "accepted_values": ["Scheduled", "Completed", "Cancelled", "No-Show"], "description": "Encounter status"}
        ]
    },
    {
        "id": "hospital_admissions",
        "name": "Hospital Admissions",
        "category": "Healthcare",
        "description": "Inpatient hospitalization records with admission/discharge dates, ward units, and primary diagnoses.",
        "intended_use": "Bed management systems, healthcare analytics, length of stay models",
        "default_rows": 80,
        "primary_key": "admission_id",
        "columns": [
            {"name": "admission_id", "dtype": "int", "description": "Inpatient admission ID", "nullable": False},
            {"name": "patient_id", "dtype": "int", "description": "Patient ID reference", "nullable": False},
            {"name": "admission_date", "dtype": "date", "description": "Date admitted to hospital", "nullable": False},
            {"name": "discharge_date", "dtype": "date", "description": "Date discharged from hospital"},
            {"name": "ward", "dtype": "enum", "accepted_values": ["ICU", "Emergency", "Surgical Ward", "Cardiology Unit", "Pediatric Wing", "General Medical"], "description": "Hospital unit"},
            {"name": "admission_type", "dtype": "enum", "accepted_values": ["Emergency", "Elective", "Urgent", "Trauma"], "description": "Admission priority"},
            {"name": "total_cost", "dtype": "float", "min_value": 800.0, "max_value": 45000.0, "description": "Total hospital charges in USD"}
        ]
    },
    {
        "id": "saas_subscriptions",
        "name": "SaaS Subscriptions",
        "category": "SaaS & Cloud",
        "description": "Recurring software subscriptions with billing cycles, tiers, seat counts, MRR, and churn indicators.",
        "intended_use": "SaaS metrics reporting, billing engine testing, Stripe webhook simulations",
        "default_rows": 120,
        "primary_key": "subscription_id",
        "columns": [
            {"name": "subscription_id", "dtype": "int", "description": "Subscription agreement ID", "nullable": False},
            {"name": "company_name", "dtype": "str", "description": "Client account name"},
            {"name": "plan_tier", "dtype": "enum", "accepted_values": ["Starter", "Professional", "Team", "Enterprise"], "description": "Service tier"},
            {"name": "billing_cycle", "dtype": "enum", "accepted_values": ["Monthly", "Annual", "Quarterly"], "description": "Renewal frequency"},
            {"name": "seats_allocated", "dtype": "int", "min_value": 1, "max_value": 500, "description": "Licensed user seats"},
            {"name": "monthly_recurring_revenue", "dtype": "float", "min_value": 29.0, "max_value": 5000.0, "description": "MRR in USD"},
            {"name": "status", "dtype": "enum", "accepted_values": ["Active", "Past Due", "Cancelled", "Trialing"], "description": "Subscription state"},
            {"name": "auto_renew", "dtype": "bool", "description": "Automatic renewal flag"}
        ]
    },
    {
        "id": "support_tickets",
        "name": "Support Tickets",
        "category": "Customer Operations",
        "description": "Help desk incident tickets with priority levels, channels, assigned agents, and resolution times.",
        "intended_use": "Zendesk/Jira simulations, SLA compliance reporting, NLP ticket routing",
        "default_rows": 150,
        "primary_key": "ticket_id",
        "columns": [
            {"name": "ticket_id", "dtype": "int", "description": "Case ticket number", "nullable": False},
            {"name": "customer_id", "dtype": "int", "description": "Submitting user ID", "nullable": False},
            {"name": "subject", "dtype": "str", "description": "Brief problem summary"},
            {"name": "priority", "dtype": "enum", "accepted_values": ["Low", "Medium", "High", "Critical"], "description": "Severity level"},
            {"name": "status", "dtype": "enum", "accepted_values": ["New", "Open", "Pending Customer", "Resolved", "Closed"], "description": "Lifecycle state"},
            {"name": "channel", "dtype": "enum", "accepted_values": ["Email", "Live Chat", "Web Portal", "Phone", "Slack"], "description": "Submission source"},
            {"name": "resolution_hours", "dtype": "float", "min_value": 0.5, "max_value": 120.0, "description": "Time to resolve in hours"}
        ]
    },
    {
        "id": "iot_sensor_readings",
        "name": "IoT Sensor Readings",
        "category": "Internet of Things",
        "description": "Time-series telemetry from edge sensors including temperature, humidity, vibration, battery, and signal strength.",
        "intended_use": "Time-series databases, anomaly detection algorithms, predictive maintenance",
        "default_rows": 500,
        "primary_key": "reading_id",
        "columns": [
            {"name": "reading_id", "dtype": "int", "description": "Telemetry sequence ID", "nullable": False},
            {"name": "device_id", "dtype": "enum", "accepted_values": ["SENSOR-EDGE-01", "SENSOR-EDGE-02", "SENSOR-HVAC-10", "SENSOR-PUMP-04", "SENSOR-TANK-08"], "description": "Hardware device tag"},
            {"name": "temperature_celsius", "dtype": "float", "min_value": -10.0, "max_value": 85.0, "description": "Ambient temperature in °C"},
            {"name": "humidity_pct", "dtype": "float", "min_value": 10.0, "max_value": 98.0, "description": "Relative humidity percentage"},
            {"name": "vibration_hz", "dtype": "float", "min_value": 0.0, "max_value": 120.0, "description": "Mechanical vibration frequency"},
            {"name": "battery_level_pct", "dtype": "int", "min_value": 5, "max_value": 100, "description": "Remaining battery charge"},
            {"name": "alert_triggered", "dtype": "bool", "description": "Exceeded safe operating threshold"}
        ]
    },
    {
        "id": "social_media_posts",
        "name": "Social Media Posts",
        "category": "Media & Marketing",
        "description": "Public social platform posts with author handles, likes, shares, comments, hashtags, and sentiment scores.",
        "intended_use": "Social feed UI development, sentiment analysis training, virality modeling",
        "default_rows": 100,
        "primary_key": "post_id",
        "columns": [
            {"name": "post_id", "dtype": "int", "description": "Unique post identifier", "nullable": False},
            {"name": "author_username", "dtype": "str", "description": "Creator handle"},
            {"name": "content", "dtype": "str", "description": "Post body text"},
            {"name": "platform", "dtype": "enum", "accepted_values": ["Twitter/X", "LinkedIn", "Instagram", "Threads", "Bluesky"], "description": "Social network"},
            {"name": "likes_count", "dtype": "int", "min_value": 0, "max_value": 25000, "description": "Total user upvotes/likes"},
            {"name": "shares_count", "dtype": "int", "min_value": 0, "max_value": 5000, "description": "Total re-shares/retweets"},
            {"name": "comments_count", "dtype": "int", "min_value": 0, "max_value": 1200, "description": "Total replies"},
            {"name": "sentiment_score", "dtype": "float", "min_value": -1.0, "max_value": 1.0, "description": "NLP sentiment polarity (-1.0 to +1.0)"}
        ]
    },
    {
        "id": "developer_api_responses",
        "name": "Developer API Responses",
        "category": "Developer Tools",
        "description": "Mock API telemetry payload logs with endpoint routes, HTTP verbs, status codes, response times, and payloads.",
        "intended_use": "API observability testing, gateway simulation, developer logging portals",
        "default_rows": 200,
        "primary_key": "log_id",
        "columns": [
            {"name": "log_id", "dtype": "int", "description": "Request sequence number", "nullable": False},
            {"name": "method", "dtype": "enum", "accepted_values": ["GET", "POST", "PUT", "PATCH", "DELETE"], "description": "HTTP request verb"},
            {"name": "path", "dtype": "enum", "accepted_values": ["/api/v1/users", "/api/v1/orders", "/api/v1/billing", "/api/v1/webhooks", "/api/v1/auth/token"], "description": "Target endpoint route"},
            {"name": "status_code", "dtype": "enum", "accepted_values": [200, 201, 204, 400, 401, 403, 404, 500], "description": "HTTP response code"},
            {"name": "response_time_ms", "dtype": "float", "min_value": 12.0, "max_value": 1250.0, "description": "Latency in milliseconds"},
            {"name": "ip_address", "dtype": "str", "description": "Client IP origin"},
            {"name": "client_id", "dtype": "str", "description": "API consumer client ID"}
        ]
    }
]

def get_all_templates() -> List[Dict[str, Any]]:
    return TEMPLATES

def get_template_by_id(template_id: str) -> Dict[str, Any] | None:
    for t in TEMPLATES:
        if t["id"] == template_id:
            return t
    return None
