import time
import sys
import pandas as pd
from typing import Optional, List, Dict, Any
from engine.sketches import HyperLogLog
from engine.exact import apply_filters

def run_approximate_query(
    df: pd.DataFrame,
    query_type: str,
    column: Optional[str] = None,
    group_by: Optional[str] = None,
    precision_p: int = 10,
    sample_rate: float = 0.1,
    representation: str = "DENSE",
    filters: Optional[List[Dict[str, Any]]] = None
) -> dict:
    """
    Executes an approximate query using HyperLogLog for COUNT_DISTINCT,
    and fast sampling for other analytical queries.
    """
    start = time.perf_counter()
    working_df = apply_filters(df, filters)
    query_type_norm = query_type.upper()

    sketch_instance = None
    rows_processed = len(working_df)

    if query_type_norm == "COUNT_DISTINCT":
        if column not in working_df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")

        if group_by and group_by in working_df.columns:
            # Group-by HLL estimation per group
            group_results = {}
            for g_val, g_sub in working_df.groupby(group_by):
                hll_grp = HyperLogLog(p=precision_p, representation=representation)
                hll_grp.add_series(g_sub[column])
                group_results[str(g_val)] = int(round(hll_grp.estimate()))
            result = group_results
            # Use last group sketch or master sketch as primary reference
            sketch_instance = HyperLogLog(p=precision_p, representation=representation)
            sketch_instance.add_series(working_df[column])
        else:
            sketch = HyperLogLog(p=precision_p, representation=representation)
            sketch.add_series(working_df[column])
            result = int(round(sketch.estimate()))
            sketch_instance = sketch

    elif query_type_norm == "COUNT":
        sample_size = max(1, int(rows_processed * sample_rate))
        result = round(sample_size / sample_rate)

    elif query_type_norm == "AVG":
        sample_size = max(1, int(rows_processed * sample_rate))
        sample = working_df.iloc[:sample_size]
        if group_by:
            result = sample.groupby(group_by)[column].mean().to_dict()
        else:
            result = float(sample[column].mean())

    elif query_type_norm == "SUM":
        sample_size = max(1, int(rows_processed * sample_rate))
        sample = working_df.iloc[:sample_size]
        if group_by:
            result = (sample.groupby(group_by)[column].sum() / sample_rate).to_dict()
        else:
            result = float(sample[column].sum() / sample_rate)

    else:
        raise ValueError(f"Unsupported query type: {query_type}")

    end = time.perf_counter()
    latency_ms = (end - start) * 1000.0

    # Calculate memory footprint of sketch
    if sketch_instance:
        memory_bytes = sys.getsizeof(sketch_instance.registers) + sys.getsizeof(sketch_instance.sparse_registers)
        theoretical_err = sketch_instance.theoretical_error
    else:
        memory_bytes = 0
        theoretical_err = 0.0

    return {
        "result": result,
        "time_ms": round(latency_ms, 3),
        "precision_p": precision_p,
        "register_count": 1 << precision_p if query_type_norm == "COUNT_DISTINCT" else None,
        "theoretical_error": theoretical_err,
        "sketch": sketch_instance,
        "rows_processed": rows_processed,
        "memory_bytes": memory_bytes
    }