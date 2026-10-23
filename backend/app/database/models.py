import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class SchemaModel(Base):
    __tablename__ = "schemas"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    primary_key = Column(String(100), default="id")
    schema_definition = Column(JSON, nullable=False)  # columns: [{"name":..., "dtype":..., ...}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    columns_meta = Column(JSON, nullable=False, default=list)  # [{"name": "col", "dtype": "int"}]
    file_path = Column(String(500), nullable=False)
    file_format = Column(String(50), default="parquet")
    size_bytes = Column(Integer, default=0)
    source = Column(String(50), default="generator")  # "generator", "template", "fault_injection", "import"
    schema_id = Column(String(36), nullable=True)
    generation_config = Column(JSON, default=dict)
    is_fault_injected = Column(Boolean, default=False)
    parent_dataset_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GenerationJobModel(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), nullable=True)
    schema_name = Column(String(255), default="")
    status = Column(String(50), default="completed")  # "completed", "failed"
    requested_rows = Column(Integer, default=0)
    actual_rows = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    seed = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MockApiModel(Base):
    __tablename__ = "mock_apis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), nullable=False)
    resource_name = Column(String(100), unique=True, nullable=False)
    primary_key = Column(String(100), default="id")
    is_active = Column(Boolean, default=True)
    allowed_methods = Column(JSON, default=lambda: ["GET", "POST", "PUT", "PATCH", "DELETE"])
    pagination_config = Column(JSON, default=lambda: {"default_limit": 20, "max_limit": 100})
    filterable_fields = Column(JSON, default=list)
    sortable_fields = Column(JSON, default=list)
    total_requests = Column(Integer, default=0)
    state_file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ValidationReportModel(Base):
    __tablename__ = "validation_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), nullable=False)
    dataset_name = Column(String(255), default="")
    quality_score = Column(Float, default=100.0)
    status = Column(String(50), default="PASSED")  # "PASSED", "WARNING", "FAILED"
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    checks_detail = Column(JSON, default=list)
    scoring_formula = Column(Text, default="")
    report_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RelationshipProjectModel(Base):
    __tablename__ = "relationship_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    tables_config = Column(JSON, default=dict)
    relationships_config = Column(JSON, default=list)
    status = Column(String(50), default="configured")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
