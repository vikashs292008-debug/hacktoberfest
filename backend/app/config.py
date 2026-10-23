import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BASE_DIR / ".env")
DATA_DIR = BASE_DIR / "data"
DATASETS_DIR = DATA_DIR / "datasets"
MOCK_STATE_DIR = DATA_DIR / "mock_state"
REPORTS_DIR = DATA_DIR / "reports"
EXPORTS_DIR = BASE_DIR / "exports"

DATASETS_DIR.mkdir(parents=True, exist_ok=True)
MOCK_STATE_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "dataforge.db"
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

class Settings(BaseModel):
    app_name: str = "DataForge AI"
    version: str = "1.0.0"
    api_prefix: str = "/api"
    max_preview_rows: int = 200
    max_generation_rows: int = 100000
    default_generation_rows: int = 100
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    ai_provider: str = os.getenv("AI_PROVIDER", "gemini_rule_fallback") # 'gemini', 'gemma', 'gemini_rule_fallback'
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY", None)

settings = Settings()
