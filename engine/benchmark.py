import time

from engine.approximate import run_approximate_query
from engine.exact import run_exact_query


def run_benchmark(df, query_type, column=None, group_by=None, sample_rate=0.1):
    # Run approximate query
    approx_result = run_approximate_query(
        df,
        query_type,
        column=column,
        group_by=group_by,
        sample_rate=sample_rate
    )

    # Run exact query
    exact_result = run_exact_query(
        df,
        query_type,
        column=column,
        group_by=group_by
    )

    # Extract values
    approx_value = approx_result["result"]
    exact_value = exact_result["result"]

    # Calculate error %
    try:
        if isinstance(approx_value, dict):
            # GROUP BY case
            error_pct = {}
            for key in approx_value:
                if key in exact_value and exact_value[key] != 0:
                    error_pct[key] = abs((approx_value[key] - exact_value[key]) / exact_value[key]) * 100
        else:
            if exact_value != 0:
                error_pct = abs((approx_value - exact_value) / exact_value) * 100
            else:
                error_pct = 0
    except:
        error_pct = None

    # Calculate speedup
    approx_time = approx_result["time_ms"]
    exact_time = exact_result["time_ms"]

    if approx_time > 0:
        speedup = exact_time / approx_time
    else:
        speedup = None

    return {
        "approx_result": approx_value,
        "exact_result": exact_value,
        "error_pct": error_pct,
        "approx_time_ms": approx_time,
        "exact_time_ms": exact_time,
        "speedup": speedup
    }


# main funciton
if __name__ == "__main__":
    import pandas as pd

    df = pd.DataFrame({
        'fare_amount': [10, 20, 15, 8, 25, 12, 30, 5, 18, 10],
        'trip_distance': [2.1, 4.5, 3.2, 1.0, 5.5, 2.8, 6.0, 0.9, 3.8, 4.2]
    })

    result = run_benchmark(df, "COUNT_DISTINCT", column="fare_amount")

    print("\n-- BENCHMARK RESULT--")
    for key, value in result.items():
        print(f"{key}: {value}")
