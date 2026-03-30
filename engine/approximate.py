import time
import numpy as np

from engine.sketches import (
    approximate_count_distinct,
    build_frequency_sketch
)


def run_approximate_query(df, query_type, column=None, group_by=None, sample_rate=0.1):
    start = time.time()

    sample = df.sample(frac=sample_rate, random_state=42)

    #  COUNT DISTINCT (HLL)
    if query_type == "COUNT_DISTINCT":
        result = approximate_count_distinct(df[column])

    #  FREQUENCY (Count-Min Sketch)
    elif query_type == "FREQUENCY":
        cms = build_frequency_sketch(sample[column])
        result = {val: cms.estimate(val) for val in sample[column].unique()}

    #  COUNT
    elif query_type == "COUNT":
        result = len(sample) / sample_rate

    #  AVG
    elif query_type == "AVG":
        result = sample[column].mean()

    #  SUM
    elif query_type == "SUM":
        result = sample[column].sum() / sample_rate

    #  GROUP BY
    elif group_by is not None:
        result = sample.groupby(group_by)[column].mean().to_dict()

    else:
        result = None

    end = time.time()

    return {
        "result": result,
        "error_pct": 0,
        "time_ms": (end - start) * 1000,
        "confidence_interval": (0, 0)
    }