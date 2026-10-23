import time
import math
import json
import re
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

import great_generator as gg
from great_generator.schemas import ColumnSpec, TableSchema
from app.schemas.schema_def import ColumnDefinition

def convert_ui_columns_to_specs(columns: List[ColumnDefinition]) -> List[ColumnSpec]:
    specs = []
    for col in columns:
        dtype = col.dtype.lower()
        gg_dtype = "str"
        semantic_type = col.semantic_type

        # Map frontend types to great_generator dtypes and semantics
        if dtype in ["int", "integer", "number"]:
            gg_dtype = "int"
        elif dtype in ["float", "double", "decimal"]:
            gg_dtype = "float"
        elif dtype in ["bool", "boolean"]:
            gg_dtype = "bool"
        elif dtype in ["date"]:
            gg_dtype = "date"
        elif dtype in ["timestamp", "datetime"]:
            gg_dtype = "datetime"
        elif dtype in ["enum"]:
            gg_dtype = "str"
        elif dtype in ["email"]:
            gg_dtype = "str"
            semantic_type = semantic_type or "email"
        elif dtype in ["uuid"]:
            gg_dtype = "str"
            semantic_type = semantic_type or "uuid"
        else:
            gg_dtype = "str"

        # infer semantic_type from column name if not explicitly set
        name_lower = col.name.lower()
        if not semantic_type:
            if "email" in name_lower:
                semantic_type = "email"
            elif "age" in name_lower:
                semantic_type = "age"
            elif "name" in name_lower:
                semantic_type = "name"
            elif "id" in name_lower and gg_dtype == "int":
                semantic_type = "id"
            elif "date" in name_lower:
                if gg_dtype == "str":
                    gg_dtype = "date"

        accepted_vals = tuple(col.accepted_values) if col.accepted_values else ()

        spec = ColumnSpec(
            name=col.name,
            dtype=gg_dtype,
            nullable=col.nullable,
            description=col.description or "",
            semantic_type=semantic_type,
            min_value=col.min_value,
            max_value=col.max_value,
            accepted_values=accepted_vals,
            max_length=col.max_length,
            tags=()
        )
        specs.append(spec)
    return specs


def generate_dataframe(
    columns: Optional[List[ColumnDefinition]] = None,
    mode: str = "schema",
    table_name: str = "synthetic_data",
    primary_key: Optional[str] = "id",
    rows: int = 100,
    seed: Optional[int] = 42,
    realism: str = "realistic",
    domain: Optional[str] = None,
    table: Optional[str] = None,
    ddl_text: Optional[str] = None,
) -> Tuple[pd.DataFrame, float]:
    start_time = time.time()

    if mode == "domain":
        if not domain:
            raise ValueError("Domain is required for domain mode.")
        domain_schema = gg.get_domain_schema(domain)
        target_table = table or list(domain_schema.tables.keys())[0]
        res = gg.generate_domain(domain, rows={target_table: rows}, seed=seed, realism=realism)
        df = res[target_table]
    elif mode == "ddl":
        if not ddl_text or not ddl_text.strip():
            raise ValueError("DDL text is required for DDL mode.")
        parsed = gg.parse_ddl(ddl_text.strip())
        df = gg.generate_from_schema(parsed, rows=rows, seed=seed, realism=realism)
        if isinstance(df, dict):
            df = list(df.values())[0]
    else:
        if not columns or len(columns) == 0:
            raise ValueError("At least one column definition is required.")

        specs = convert_ui_columns_to_specs(columns)
        schema = TableSchema(
            name=table_name,
            columns=tuple(specs),
            primary_key=primary_key
        )
        raw_res = gg.generate_from_schema(schema, rows=rows, seed=seed, realism=realism)
        if isinstance(raw_res, dict):
            df = list(raw_res.values())[0]
        else:
            df = raw_res

    # Safe post-processing to ensure all requested column types & custom constraints match
    df = post_process_dataframe(df, columns, primary_key, rows)

    duration = time.time() - start_time
    return df, round(duration, 4)


def post_process_dataframe(
    df: pd.DataFrame,
    columns: Optional[List[ColumnDefinition]],
    primary_key: Optional[str],
    rows: int
) -> pd.DataFrame:
    # Ensure primary key uniqueness if designated
    if primary_key and primary_key in df.columns:
        if df[primary_key].duplicated().any():
            if pd.api.types.is_numeric_dtype(df[primary_key]):
                df[primary_key] = range(1, len(df) + 1)
            else:
                prefix = primary_key[:3].upper()
                df[primary_key] = [f"{prefix}_{i+1:05d}" for i in range(len(df))]

    if not columns:
        return df

    col_map = {col.name: col for col in columns}
    for col_name, col_def in col_map.items():
        if col_name not in df.columns:
            continue

        # Check accepted_values
        if col_def.accepted_values and len(col_def.accepted_values) > 0:
            invalid_mask = ~df[col_name].isin(col_def.accepted_values)
            if invalid_mask.any():
                np.random.seed(42)
                replacements = np.random.choice(col_def.accepted_values, size=invalid_mask.sum())
                df.loc[invalid_mask, col_name] = replacements

        # Check min/max numeric constraints
        if col_def.min_value is not None or col_def.max_value is not None:
            if pd.api.types.is_numeric_dtype(df[col_name]):
                min_v = float(col_def.min_value) if col_def.min_value is not None else -math.inf
                max_v = float(col_def.max_value) if col_def.max_value is not None else math.inf
                df[col_name] = df[col_name].clip(lower=min_v, upper=max_v)

        # Handle nullability
        if not col_def.nullable and df[col_name].isnull().any():
            df[col_name] = df[col_name].bfill().ffill()
            if df[col_name].isnull().any():
                df[col_name] = df[col_name].fillna("N/A" if df[col_name].dtype == object else 0)

    return df


def calculate_column_stats(df: pd.DataFrame) -> Dict[str, Any]:
    stats = {}
    for col in df.columns:
        series = df[col]
        col_type = str(series.dtype)
        null_count = int(series.isnull().sum())
        null_pct = round((null_count / len(series)) * 100, 2) if len(series) > 0 else 0.0
        unique_count = int(series.nunique())

        stat_item = {
            "dtype": col_type,
            "null_count": null_count,
            "null_percentage": null_pct,
            "unique_count": unique_count,
            "sample_values": series.dropna().head(3).tolist(),
        }

        if pd.api.types.is_numeric_dtype(series):
            non_null = series.dropna()
            if len(non_null) > 0:
                stat_item["min"] = float(round(non_null.min(), 4))
                stat_item["max"] = float(round(non_null.max(), 4))
                stat_item["mean"] = float(round(non_null.mean(), 4))
                stat_item["std"] = float(round(non_null.std(), 4)) if len(non_null) > 1 else 0.0

        stats[col] = stat_item
    return stats
