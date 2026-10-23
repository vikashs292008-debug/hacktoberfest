import random
import numpy as np
import pandas as pd
from app.database.session import SessionLocal
from app.services.dataset_service import save_dataframe_as_dataset, export_dataset_file
from app.services.quality_service import run_dataset_validation
from app.services.mock_api_service import initialize_mock_api

# Indian First Names (Diverse across regions)
FIRST_NAMES = [
    # Male
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharva", "Kabir", "Rudra", "Rohan", "Vikram", "Rahul", "Amit", "Karthik", "Suresh",
    "Pranav", "Nikhil", "Deepak", "Anand", "Rajesh", "Gaurav", "Manoj", "Siddharth", "Varun", "Abhishek",
    "Harish", "Venkat", "Alok", "Dev", "Manish", "Tarun", "Samir", "Ravi", "Ashwin", "Sanjay",
    # Female
    "Saanvi", "Aanya", "Aadhya", "Aarohi", "Ananya", "Pari", "Diya", "Myra", "Sara", "Isha",
    "Meera", "Riya", "Kavya", "Pooja", "Neha", "Priya", "Anushka", "Sneha", "Tanvi", "Shreya",
    "Divya", "Swati", "Rashmi", "Sunita", "Deepika", "Lakshmi", "Preeti", "Radhika", "Bhavna", "Archana",
    "Simran", "Meenakshi", "Gayatri", "Nandini", "Pallavi", "Monika", "Rekha", "Shalini", "Jyoti", "Vidya"
]

# Indian Surnames (Diverse across communities)
LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Patel", "Reddy", "Nair", "Iyer", "Rao", "Kumar", "Singh",
    "Chatterjee", "Banerjee", "Mukherjee", "Deshmukh", "Kulkarni", "Joshi", "Mehta", "Shah", "Agarwal", "Bansal",
    "Choudhury", "Das", "Ghosh", "Mishra", "Pandey", "Tiwari", "Yadav", "Pillai", "Menon", "Bhat",
    "Hegde", "Shetty", "Naidu", "Chauhan", "Bose", "Dutta", "Sengupta", "Malhotra", "Kapoor", "Khanna"
]

# Cities with Cost-of-Living Tiers
CITIES = [
    {"name": "Mumbai", "tier": 1, "rent_mult": 1.6, "expense_mult": 1.4},
    {"name": "Delhi NCR", "tier": 1, "rent_mult": 1.4, "expense_mult": 1.3},
    {"name": "Bengaluru", "tier": 1, "rent_mult": 1.45, "expense_mult": 1.35},
    {"name": "Hyderabad", "tier": 1, "rent_mult": 1.25, "expense_mult": 1.2},
    {"name": "Chennai", "tier": 1, "rent_mult": 1.2, "expense_mult": 1.15},
    {"name": "Pune", "tier": 1, "rent_mult": 1.25, "expense_mult": 1.2},
    {"name": "Kolkata", "tier": 2, "rent_mult": 0.95, "expense_mult": 0.95},
    {"name": "Ahmedabad", "tier": 2, "rent_mult": 0.9, "expense_mult": 0.9},
    {"name": "Jaipur", "tier": 2, "rent_mult": 0.8, "expense_mult": 0.85},
    {"name": "Chandigarh", "tier": 2, "rent_mult": 0.9, "expense_mult": 0.9},
    {"name": "Lucknow", "tier": 2, "rent_mult": 0.75, "expense_mult": 0.8},
    {"name": "Indore", "tier": 2, "rent_mult": 0.75, "expense_mult": 0.8},
    {"name": "Kochi", "tier": 2, "rent_mult": 0.85, "expense_mult": 0.85}
]

# Occupations with base salary ranges in INR
OCCUPATIONS = [
    {"title": "Software Engineer", "base_min": 50000, "base_max": 180000, "age_min": 21, "age_max": 40},
    {"title": "Senior Software Architect", "base_min": 180000, "base_max": 380000, "age_min": 32, "age_max": 55},
    {"title": "Data Scientist", "base_min": 65000, "base_max": 220000, "age_min": 23, "age_max": 45},
    {"title": "Chartered Accountant", "base_min": 60000, "base_max": 240000, "age_min": 24, "age_max": 60},
    {"title": "Doctor / Physician", "base_min": 85000, "base_max": 350000, "age_min": 27, "age_max": 65},
    {"title": "Bank Probationary Officer", "base_min": 45000, "base_max": 95000, "age_min": 22, "age_max": 45},
    {"title": "Marketing Manager", "base_min": 55000, "base_max": 160000, "age_min": 26, "age_max": 50},
    {"title": "High School Teacher", "base_min": 28000, "base_max": 65000, "age_min": 23, "age_max": 60},
    {"title": "Civil Engineer", "base_min": 35000, "base_max": 110000, "age_min": 22, "age_max": 55},
    {"title": "Business Analyst", "base_min": 48000, "base_max": 140000, "age_min": 23, "age_max": 45},
    {"title": "Graphic / UI Designer", "base_min": 35000, "base_max": 115000, "age_min": 21, "age_max": 42},
    {"title": "Operations Executive", "base_min": 25000, "base_max": 60000, "age_min": 20, "age_max": 48},
    {"title": "Retail Store Manager", "base_min": 30000, "base_max": 75000, "age_min": 24, "age_max": 52},
    {"title": "Senior Consultant", "base_min": 120000, "base_max": 280000, "age_min": 28, "age_max": 55},
    {"title": "College Professor", "base_min": 60000, "base_max": 160000, "age_min": 30, "age_max": 68}
]

def generate_personal_expenses_dataset(n: int = 1000, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)

    records = []

    for i in range(1, n + 1):
        person_id = i
        full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        occ = random.choice(OCCUPATIONS)
        age = random.randint(occ["age_min"], occ["age_max"])
        city_info = random.choice(CITIES)
        city_name = city_info["name"]

        # Experience factor increases salary with age
        exp_factor = 1.0 + (age - occ["age_min"]) * 0.025
        base_salary = random.randint(occ["base_min"], occ["base_max"])
        monthly_salary = int(round(base_salary * exp_factor / 500.0) * 500)

        # Rent is correlated with city tier and monthly salary
        # Typically rent is 18% to 35% of monthly salary, scaled by city cost
        rent_pct = random.uniform(0.18, 0.32) * city_info["rent_mult"]
        rent_pct = min(0.42, max(0.12, rent_pct))
        rent = int(round((monthly_salary * rent_pct) / 500.0) * 500)
        # Ensure minimum plausible rent for city
        rent = max(4000 if city_info["tier"] == 2 else 7500, rent)

        # Groceries: Essential expense scaled mildly with lifestyle/city
        # Typically 6% to 15% of salary, bounded between Rs 3,500 and 22,000
        groceries_base = random.uniform(3500, 7500) + (monthly_salary * random.uniform(0.04, 0.08))
        groceries = int(round(min(24000.0, groceries_base * city_info["expense_mult"]) / 100.0) * 100)

        # Transport: Fuel / Metro / Cab / Bus commute
        transport_base = random.uniform(1500, 4000) + (monthly_salary * random.uniform(0.02, 0.05))
        transport = int(round(min(18000.0, transport_base * city_info["expense_mult"]) / 100.0) * 100)

        # Electricity Bill: seasonal/appliance use, typical range Rs 800 to Rs 7,500
        elec_base = random.uniform(900, 2500) + (monthly_salary * random.uniform(0.01, 0.025))
        electricity_bill = int(round(min(9000.0, elec_base) / 50.0) * 50)

        # Shopping: discretionary spending
        shop_pct = random.uniform(0.03, 0.09)
        shopping = int(round((monthly_salary * shop_pct) / 100.0) * 100)
        shopping = max(800, shopping)

        # Entertainment: dining out, movies, OTT, weekend trips
        ent_pct = random.uniform(0.02, 0.06)
        entertainment = int(round((monthly_salary * ent_pct) / 100.0) * 100)
        entertainment = max(500, entertainment)

        # Medical: pharmacy, regular checkups, health insurance premium share
        # Occasionally higher for older people
        med_base = random.uniform(500, 2000) + (age * random.uniform(20, 60))
        medical = int(round(med_base / 50.0) * 50)

        # Total expenses: strictly sum of all categories
        total_expenses = rent + groceries + transport + electricity_bill + shopping + entertainment + medical

        # Savings: monthly_salary - total_expenses
        savings = monthly_salary - total_expenses

        # If total_expenses exceeded salary by chance, adjust shopping/entertainment so expenses remain plausible
        if savings < 0 and random.random() > 0.15:  # small 15% deficit spenders realistic
            excess = abs(savings) + random.randint(1500, 5000)
            reduction = min(excess, shopping + entertainment)
            shopping = max(500, shopping - int(reduction * 0.6))
            entertainment = max(300, entertainment - int(reduction * 0.4))
            total_expenses = rent + groceries + transport + electricity_bill + shopping + entertainment + medical
            savings = monthly_salary - total_expenses

        records.append({
            "person_id": person_id,
            "full_name": full_name,
            "age": age,
            "occupation": occ["title"],
            "city": city_name,
            "monthly_salary": monthly_salary,
            "rent": rent,
            "groceries": groceries,
            "transport": transport,
            "electricity_bill": electricity_bill,
            "shopping": shopping,
            "entertainment": entertainment,
            "medical": medical,
            "total_expenses": total_expenses,
            "savings": savings
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("Generating 1,000 realistic Indian personal expenses records...")
        df = generate_personal_expenses_dataset(n=1000, seed=42)
        print(f"Generated DataFrame shape: {df.shape}")
        print("Verifying mathematical constraints...")
        # Check expenses sum
        calc_total = (
            df["rent"] + df["groceries"] + df["transport"] + 
            df["electricity_bill"] + df["shopping"] + df["entertainment"] + df["medical"]
        )
        assert (df["total_expenses"] == calc_total).all(), "Total expenses mismatch!"
        assert (df["savings"] == (df["monthly_salary"] - df["total_expenses"])).all(), "Savings mismatch!"
        assert (df[["rent", "groceries", "transport", "electricity_bill", "shopping", "entertainment", "medical"]] >= 0).all().all(), "Negative expense found!"
        print("All mathematical constraints & non-negative rules passed 100%!")

        # Save to database and Parquet storage
        dataset = save_dataframe_as_dataset(
            db=db,
            df=df,
            name="Personal Expenses (India - 1,000 Records)",
            description="Realistic personal expenses dataset with 1,000 Indian individuals. Captures occupation, city tier, salary in INR, categorized spending (rent, groceries, transport, utilities, discretionary, medical), total expenses, and net savings.",
            source="generator",
            generation_config={"rows": 1000, "seed": 42, "domain": "personal_finance", "country": "India"}
        )
        print(f"Dataset saved with ID: {dataset.id}")

        # Export CSV and JSON to exports directory
        csv_bytes, csv_filename, _ = export_dataset_file(df, "personal_expenses_india_1000", "csv")
        json_bytes, json_filename, _ = export_dataset_file(df, "personal_expenses_india_1000", "json")

        from app.config import EXPORTS_DIR
        with open(EXPORTS_DIR / csv_filename, "wb") as f:
            f.write(csv_bytes)
        with open(EXPORTS_DIR / json_filename, "wb") as f:
            f.write(json_bytes)
        print(f"Exported files to {EXPORTS_DIR}: {csv_filename}, {json_filename}")

        # Run Quality Validation
        report, summary = run_dataset_validation(db=db, dataset=dataset, df=df)
        print(f"Quality Score: {report.quality_score}/100 ({report.status}) - {report.passed_checks} passed checks")

        # Deploy Mock REST API
        mock_api = initialize_mock_api(
            db=db,
            dataset=dataset,
            resource_name="personal_expenses",
            primary_key="person_id"
        )
        print(f"Mock API launched: /api/mock/{mock_api.resource_name}")

        print("\nAll tasks completed successfully!")

    finally:
        db.close()
