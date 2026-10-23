import os
import json
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List
import pandas as pd
from sqlalchemy.orm import Session

from app.config import DATASETS_DIR, EXPORTS_DIR
from app.database.models import DatasetModel, SchemaModel

def save_dataframe_as_dataset(
    db: Session,
    df: pd.DataFrame,
    name: str,
    description: str = "",
    source: str = "generator",
    schema_id: Optional[str] = None,
    generation_config: Optional[Dict[str, Any]] = None,
    is_fault_injected: bool = False,
    parent_dataset_id: Optional[str] = None,
) -> DatasetModel:
    dataset_id = str(pd.Timestamp.now().strftime("%Y%m%d%H%M%S")) + "_" + str(abs(hash(name)) % 10000)
    parquet_path = DATASETS_DIR / f"{dataset_id}.parquet"
    
    # Save as parquet (pyarrow)
    df.to_parquet(parquet_path, engine="pyarrow", index=False)
    size_bytes = os.path.getsize(parquet_path)

    columns_meta = []
    for col in df.columns:
        columns_meta.append({
            "name": col,
            "dtype": str(df[col].dtype),
            "sample": str(df[col].iloc[0]) if len(df) > 0 else ""
        })

    dataset = DatasetModel(
        id=dataset_id,
        name=name,
        description=description,
        row_count=len(df),
        column_count=len(df.columns),
        columns_meta=columns_meta,
        file_path=str(parquet_path),
        file_format="parquet",
        size_bytes=size_bytes,
        source=source,
        schema_id=schema_id,
        generation_config=generation_config or {},
        is_fault_injected=is_fault_injected,
        parent_dataset_id=parent_dataset_id,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def load_dataset_dataframe(dataset: DatasetModel) -> pd.DataFrame:
    if not os.path.exists(dataset.file_path):
        raise FileNotFoundError(f"Dataset file not found at {dataset.file_path}")
    return pd.read_parquet(dataset.file_path)


def get_dataset_preview(
    df: pd.DataFrame,
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: str = "asc"
) -> Tuple[List[Dict[str, Any]], int]:
    filtered_df = df

    if search and search.strip():
        search_term = search.strip().lower()
        masks = [
            filtered_df[col].astype(str).str.lower().str.contains(search_term, regex=False, na=False)
            for col in filtered_df.columns
        ]
        if masks:
            combined_mask = masks[0]
            for m in masks[1:]:
                combined_mask = combined_mask | m
            filtered_df = filtered_df[combined_mask]

    if sort_by and sort_by in filtered_df.columns:
        ascending = sort_dir.lower() != "desc"
        filtered_df = filtered_df.sort_values(by=sort_by, ascending=ascending)

    total_rows = len(filtered_df)
    sliced_df = filtered_df.iloc[offset : offset + limit]

    json_str = sliced_df.to_json(orient="records", date_format="iso")
    records = json.loads(json_str)
    return records, total_rows


def export_dataset_file(
    df: pd.DataFrame,
    dataset_name: str,
    format_type: str = "csv"
) -> Tuple[bytes, str, str]:
    clean_name = "".join(c for c in dataset_name if c.isalnum() or c in ("_", "-")).rstrip()
    if not clean_name:
        clean_name = "dataset"

    fmt = format_type.lower()
    if fmt == "csv":
        content = df.to_csv(index=False).encode("utf-8")
        filename = f"{clean_name}.csv"
        media_type = "text/csv"
    elif fmt == "json":
        content = df.to_json(orient="records", indent=2, date_format="iso").encode("utf-8")
        filename = f"{clean_name}.json"
        media_type = "application/json"
    elif fmt == "parquet":
        import io
        buffer = io.BytesIO()
        df.to_parquet(buffer, engine="pyarrow", index=False)
        content = buffer.getvalue()
        filename = f"{clean_name}.parquet"
        media_type = "application/octet-stream"
    elif fmt == "sql":
        table_name = clean_name.lower().replace("-", "_")
        col_defs = []
        for col in df.columns:
            dtype = df[col].dtype
            if pd.api.types.is_integer_dtype(dtype):
                sql_type = "BIGINT"
            elif pd.api.types.is_float_dtype(dtype):
                sql_type = "DOUBLE PRECISION"
            elif pd.api.types.is_bool_dtype(dtype):
                sql_type = "BOOLEAN"
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                sql_type = "TIMESTAMP"
            else:
                sql_type = "VARCHAR(255)"
            col_defs.append(f"  \"{col}\" {sql_type}")
        
        sql_content = f"CREATE TABLE {table_name} (\n" + ",\n".join(col_defs) + "\n);\n\n"
        for _, row in df.head(100).iterrows():
            vals = []
            for col in df.columns:
                val = row[col]
                if pd.isna(val):
                    vals.append("NULL")
                elif isinstance(val, (int, float)):
                    vals.append(str(val))
                elif isinstance(val, bool):
                    vals.append("TRUE" if val else "FALSE")
                else:
                    escaped = str(val).replace("'", "''")
                    vals.append(f"'{escaped}'")
            sql_content += f"INSERT INTO {table_name} ({', '.join(f'\"{c}\"' for c in df.columns)}) VALUES ({', '.join(vals)});\n"
        content = sql_content.encode("utf-8")
        filename = f"{clean_name}.sql"
        media_type = "application/sql"
    else:
        raise ValueError(f"Unsupported export format: {format_type}")

    return content, filename, media_type
