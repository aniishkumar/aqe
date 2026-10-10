import time
import pandas as pd
from typing import Optional, List, Dict, Any

def apply_filters(df: pd.DataFrame, filters: Optional[List[Dict[str, Any]]] = None) -> pd.DataFrame:
    """Applies a list of filter predicates to the dataframe."""
    if not filters:
        return df

    filtered = df
    for flt in filters:
        col = flt.get("column")
        op = flt.get("operator", "=")
        val = flt.get("value")

        if col not in filtered.columns:
            continue

        col_dtype = filtered[col].dtype
        # Convert val to matching type
        try:
            if "int" in str(col_dtype):
                typed_val = int(val)
            elif "float" in str(col_dtype):
                typed_val = float(val)
            else:
                typed_val = str(val)
        except Exception:
            typed_val = val

        if op == "=":
            filtered = filtered[filtered[col] == typed_val]
        elif op == "!=":
            filtered = filtered[filtered[col] != typed_val]
        elif op == ">":
            filtered = filtered[filtered[col] > typed_val]
        elif op == "<":
            filtered = filtered[filtered[col] < typed_val]
        elif op == ">=":
            filtered = filtered[filtered[col] >= typed_val]
        elif op == "<=":
            filtered = filtered[filtered[col] <= typed_val]
        elif op == "LIKE":
            filtered = filtered[filtered[col].astype(str).str.contains(str(typed_val), regex=False)]

    return filtered

def run_exact_query(
    df: pd.DataFrame,
    query_type: str,
    column: Optional[str] = None,
    group_by: Optional[str] = None,
    filters: Optional[List[Dict[str, Any]]] = None
) -> dict:
    start = time.perf_counter()

    # Apply predicates
    working_df = apply_filters(df, filters)
    query_type_norm = query_type.upper()

    if group_by and group_by in working_df.columns:
        if query_type_norm == "COUNT_DISTINCT":
            result = working_df.groupby(group_by)[column].nunique().to_dict()
        elif query_type_norm == "COUNT":
            result = working_df.groupby(group_by)[column or group_by].count().to_dict()
        elif query_type_norm == "AVG":
            result = working_df.groupby(group_by)[column].mean().to_dict()
        elif query_type_norm == "SUM":
            result = working_df.groupby(group_by)[column].sum().to_dict()
        else:
            raise ValueError(f"Unsupported exact group-by operation: {query_type}")
    else:
        if query_type_norm == "COUNT_DISTINCT":
            if column not in working_df.columns:
                raise ValueError(f"Column '{column}' not found in dataset")
            result = int(working_df[column].nunique())
        elif query_type_norm == "COUNT":
            result = int(len(working_df))
        elif query_type_norm == "AVG":
            result = float(working_df[column].mean())
        elif query_type_norm == "SUM":
            result = float(working_df[column].sum())
        elif query_type_norm == "FREQUENCY":
            result = working_df[column].value_counts().head(20).to_dict()
        else:
            raise ValueError(f"Unsupported exact query operation: {query_type}")

    end = time.perf_counter()
    latency_ms = (end - start) * 1000.0

    return {
        "result": result,
        "time_ms": round(latency_ms, 3),
        "rows_scanned": len(working_df)
    }