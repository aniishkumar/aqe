import time
import pandas as pd
from typing import Optional, List, Dict, Any
from engine.approximate import run_approximate_query
from engine.exact import run_exact_query

def run_benchmark(
    df: pd.DataFrame,
    query_type: str,
    column: Optional[str] = None,
    group_by: Optional[str] = None,
    precision_p: int = 10,
    sample_rate: float = 0.1,
    representation: str = "DENSE",
    filters: Optional[List[Dict[str, Any]]] = None,
    run_exact: bool = True
) -> dict:
    """
    Executes approximate query, optional exact query benchmark,
    calculates error percent, speedup, and detailed performance metrics.
    """
    # 1. Run Approximate Query
    approx_res = run_approximate_query(
        df=df,
        query_type=query_type,
        column=column,
        group_by=group_by,
        precision_p=precision_p,
        sample_rate=sample_rate,
        representation=representation,
        filters=filters
    )

    exact_res = None
    exact_value = None
    exact_time_ms = None
    error_pct = None
    speedup = None

    # 2. Run Exact Benchmark (if requested)
    if run_exact:
        exact_res = run_exact_query(
            df=df,
            query_type=query_type,
            column=column,
            group_by=group_by,
            filters=filters
        )
        exact_value = exact_res["result"]
        exact_time_ms = exact_res["time_ms"]

        approx_val = approx_res["result"]
        # Error calculation
        if isinstance(approx_val, dict) and isinstance(exact_value, dict):
            group_errors = {}
            for k, app_v in approx_val.items():
                if k in exact_value and exact_value[k] != 0:
                    group_errors[k] = round(abs(app_v - exact_value[k]) / exact_value[k] * 100, 3)
            error_pct = group_errors
        elif exact_value is not None and exact_value != 0 and isinstance(approx_val, (int, float)):
            error_pct = round(abs(approx_val - exact_value) / exact_value * 100, 4)
        else:
            error_pct = 0.0

        if approx_res["time_ms"] > 0:
            speedup = round(exact_time_ms / approx_res["time_ms"], 2)
        else:
            speedup = 1.0

    return {
        "approx_result": approx_res["result"],
        "exact_result": exact_value,
        "error_pct": error_pct,
        "approx_time_ms": approx_res["time_ms"],
        "exact_time_ms": exact_time_ms,
        "speedup": speedup,
        "precision_p": approx_res["precision_p"],
        "register_count": approx_res["register_count"],
        "theoretical_error": approx_res["theoretical_error"],
        "rows_processed": approx_res["rows_processed"],
        "memory_bytes": approx_res["memory_bytes"],
        "sketch": approx_res["sketch"]
    }
