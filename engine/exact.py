import time


def run_exact_query(df, query_type, column=None, group_by=None):
    start = time.perf_counter()

    # COUNT
    if query_type == "COUNT":
        result = len(df)

    # AVG
    elif query_type == "AVG":
        result = df[column].mean()

    # SUM
    elif query_type == "SUM":
        result = df[column].sum()

    #  NEW: COUNT DISTINCT
    elif query_type == "COUNT_DISTINCT":
        result = df[column].nunique()

    #  OPTIONAL: FREQUENCY (exact)
    elif query_type == "FREQUENCY":
        result = df[column].value_counts().to_dict()

    # GROUP BY
    elif group_by is not None:
        result = df.groupby(group_by)[column].mean().to_dict()

    else:
        raise ValueError("Invalid query type")

    end = time.perf_counter()

    return {
        "result": result,
        "time_ms": (end - start) * 1000
    }