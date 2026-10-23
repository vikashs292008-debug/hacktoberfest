import time
import json
import zipfile
import io
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.schemas.schema_def import ColumnDefinition
from app.schemas.relationship import TableConfig, RelationshipConfig, RelationalGenerateResponse
from app.services.generator_service import generate_dataframe
from app.services.dataset_service import save_dataframe_as_dataset

def determine_generation_order(
    tables: List[TableConfig],
    relationships: List[RelationshipConfig]
) -> List[str]:
    # Topological sort of tables based on parent -> child relationships
    all_table_names = [t.name for t in tables]
    in_degree = {name: 0 for name in all_table_names}
    adj = {name: [] for name in all_table_names}

    for rel in relationships:
        parent = rel.parent_table
        child = rel.child_table
        if parent in adj and child in in_degree:
            adj[parent].append(child)
            in_degree[child] += 1

    queue = [name for name in all_table_names if in_degree[name] == 0]
    order = []

    while queue:
        current = queue.pop(0)
        order.append(current)
        for child in adj.get(current, []):
            in_degree[child] -= 1
            if in_degree[child] == 0:
                queue.append(child)

    # In case of cycles, append any remaining tables
    for name in all_table_names:
        if name not in order:
            order.append(name)

    return order


def generate_relational_project(
    db: Session,
    project_name: str,
    tables: List[TableConfig],
    relationships: List[RelationshipConfig],
    seed: Optional[int] = 42,
    realism: str = "realistic",
    save_datasets: bool = True
) -> RelationalGenerateResponse:
    order = determine_generation_order(tables, relationships)
    table_map = {t.name: t for t in tables}

    generated_frames: Dict[str, pd.DataFrame] = {}
    created_dataset_ids = []

    for table_name in order:
        table_cfg = table_map.get(table_name)
        if not table_cfg:
            continue

        # Look for incoming foreign keys for this table
        incoming_fks = [r for r in relationships if r.child_table == table_name]

        # Generate base data for the table
        df, _ = generate_dataframe(
            columns=table_cfg.columns,
            mode="schema",
            table_name=table_name,
            primary_key=table_cfg.primary_key,
            rows=table_cfg.row_count,
            seed=seed,
            realism=realism
        )

        # Substitute foreign key columns with valid keys from existing parent tables
        for fk_rel in incoming_fks:
            parent_df = generated_frames.get(fk_rel.parent_table)
            if parent_df is not None and fk_rel.parent_key in parent_df.columns:
                parent_keys = parent_df[fk_rel.parent_key].tolist()
                if parent_keys:
                    np.random.seed(seed or 42)
                    if fk_rel.cardinality == "one_to_one":
                        # sample without replacement where possible
                        sampled_keys = np.random.choice(
                            parent_keys,
                            size=len(df),
                            replace=(len(parent_keys) < len(df))
                        )
                    else:
                        # one_to_many: sample with replacement
                        sampled_keys = np.random.choice(parent_keys, size=len(df), replace=True)

                    df[fk_rel.foreign_key] = sampled_keys

        generated_frames[table_name] = df

        if save_datasets:
            saved = save_dataframe_as_dataset(
                db=db,
                df=df,
                name=f"{project_name} - {table_name}",
                description=f"Table {table_name} part of relational project '{project_name}'",
                source="relational_designer"
            )
            created_dataset_ids.append({
                "table_name": table_name,
                "dataset_id": saved.id
            })

    # Validate referential integrity
    integrity_report = validate_project_referential_integrity(generated_frames, relationships)

    # Format table previews
    tables_preview = {}
    for t_name, t_df in generated_frames.items():
        json_records = json.loads(t_df.head(10).to_json(orient="records", date_format="iso"))
        tables_preview[t_name] = {
            "total_rows": len(t_df),
            "columns": list(t_df.columns),
            "sample_records": json_records
        }

    return RelationalGenerateResponse(
        project_name=project_name,
        generated_tables=tables_preview,
        integrity_report=integrity_report,
        generation_order=order,
        datasets_created=created_dataset_ids
    )


def validate_project_referential_integrity(
    frames: Dict[str, pd.DataFrame],
    relationships: List[RelationshipConfig]
) -> Dict[str, Any]:
    rel_results = []
    overall_valid = True

    for rel in relationships:
        parent_df = frames.get(rel.parent_table)
        child_df = frames.get(rel.child_table)

        if parent_df is None or child_df is None:
            overall_valid = False
            rel_results.append({
                "relationship": f"{rel.parent_table}.{rel.parent_key} -> {rel.child_table}.{rel.foreign_key}",
                "valid": False,
                "error": "Parent or child table not found in generated set."
            })
            continue

        if rel.parent_key not in parent_df.columns or rel.foreign_key not in child_df.columns:
            overall_valid = False
            rel_results.append({
                "relationship": f"{rel.parent_table}.{rel.parent_key} -> {rel.child_table}.{rel.foreign_key}",
                "valid": False,
                "error": "Parent key or foreign key column missing."
            })
            continue

        parent_keys = set(parent_df[rel.parent_key].dropna())
        child_fks = child_df[rel.foreign_key].dropna()

        orphans = child_fks[~child_fks.isin(parent_keys)]
        orphan_count = len(orphans)

        is_valid = (orphan_count == 0)
        if not is_valid:
            overall_valid = False

        rel_results.append({
            "relationship": f"{rel.parent_table}.{rel.parent_key} -> {rel.child_table}.{rel.foreign_key}",
            "parent_table": rel.parent_table,
            "child_table": rel.child_table,
            "parent_key": rel.parent_key,
            "foreign_key": rel.foreign_key,
            "cardinality": rel.cardinality,
            "valid": is_valid,
            "orphan_keys_count": orphan_count,
            "referential_integrity_score": round((1.0 - (orphan_count / max(1, len(child_fks)))) * 100, 2)
        })

    return {
        "overall_valid": overall_valid,
        "total_relationships_checked": len(relationships),
        "relationships": rel_results
    }


def create_relational_zip_export(frames: Dict[str, pd.DataFrame], format_type: str = "csv") -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for t_name, t_df in frames.items():
            if format_type == "json":
                content = t_df.to_json(orient="records", indent=2, date_format="iso")
                zip_file.writestr(f"{t_name}.json", content)
            elif format_type == "parquet":
                p_buf = io.BytesIO()
                t_df.to_parquet(p_buf, engine="pyarrow", index=False)
                zip_file.writestr(f"{t_name}.parquet", p_buf.getvalue())
            else:
                content = t_df.to_csv(index=False)
                zip_file.writestr(f"{t_name}.csv", content)

    return buffer.getvalue()
