import time
import numpy as np

from engine.sketches import (
    approximate_count_distinct,
    build_frequency_sketch
)


def run_approximate_query(df, query_type, column=None, group_by=None, sample_rate=0.1):
    start = time.perf_counter()

    #  Normalize query type
    query_type = query_type.lower()

    #  Faster sampling (NO random overhead)
    sample_size = int(len(df) * sample_rate)
    sample = df.iloc[:sample_size]

    #  GROUP BY handling
    if group_by:
        if query_type == "avg":
            result = sample.groupby(group_by)[column].mean().to_dict()
        elif query_type == "sum":
            result = sample.groupby(group_by)[column].sum().to_dict()
        elif query_type == "count":
            result = (sample.groupby(group_by)[column].count() / sample_rate).to_dict()
        else:
            result = None

    #  COUNT DISTINCT (HLL)
    elif query_type == "count_distinct":
        result = approximate_count_distinct(df[column]) #changing from sample to df couz hll already uses sampled data

    #  FREQUENCY (Count-Min Sketch)
    elif query_type == "frequency":
        cms = build_frequency_sketch(sample[column])
        result = {val: cms.estimate(val) for val in sample[column].unique()}

    #  COUNT
    elif query_type == "count":
        result = len(sample) / sample_rate

    #  AVG
    elif query_type == "avg":
        result = sample[column].mean()

    #  SUM
    elif query_type == "sum":
        result = sample[column].sum() / sample_rate

    else:
        result = None

    end = time.perf_counter()

    return {
        "result": result,
        "error_pct": 0,
        "time_ms": (end - start) * 1000,
        "confidence_interval": (0, 0)
    }