import math
import numpy as np
import pandas as pd
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from engine.sketches import HyperLogLog, approximate_count_distinct, get_alpha
from engine.benchmark import run_benchmark
from database.models import (
    Base, User, Dataset, ColumnModel, QueryRequest,
    HLLSketch, HLLRegister, QueryResult, ExecutionMetric, SketchMerge
)
from database.db_session import init_db, SessionLocal
from data.loader import load_data

def test_alpha_constants():
    """Verify Heule et al. / Flajolet alpha constants."""
    assert get_alpha(16) == 0.673
    assert get_alpha(32) == 0.697
    assert get_alpha(64) == 0.709
    alpha_1024 = get_alpha(1024)
    expected_1024 = 0.7213 / (1.0 + 1.079 / 1024)
    assert abs(alpha_1024 - expected_1024) < 1e-6

def test_hll_estimation_accuracy():
    """Test HyperLogLog estimate accuracy on known distinct cardinality."""
    np.random.seed(42)
    true_cardinality = 5000
    # Create dataset with true_cardinality unique items repeated
    items = np.random.choice([f"user_{i}" for i in range(true_cardinality)], size=50000)
    series = pd.Series(items)

    hll = HyperLogLog(p=12)  # m = 4096, theoretical error ~ 1.6%
    hll.add_series(series)
    estimate = hll.estimate()

    error_pct = abs(estimate - true_cardinality) / true_cardinality * 100
    print(f"True: {true_cardinality}, Estimated: {estimate}, Error: {error_pct:.2f}%")
    # Should easily be within 3 standard errors (~5%)
    assert error_pct < 6.0

def test_small_cardinality_linear_counting():
    """Test small cardinality handling with Linear Counting."""
    few_items = pd.Series([f"item_{i}" for i in range(25)])
    hll = HyperLogLog(p=10)  # m = 1024
    hll.add_series(few_items)
    estimate = hll.estimate()
    # Linear counting should be very close to 25
    assert abs(estimate - 25) <= 2

def test_sketch_merge():
    """Verify sketch merging with register-wise maximum."""
    set1 = pd.Series([f"val_{i}" for i in range(0, 1000)])
    set2 = pd.Series([f"val_{i}" for i in range(500, 2000)])
    # Total unique values = 2000

    hll1 = HyperLogLog(p=10)
    hll1.add_series(set1)

    hll2 = HyperLogLog(p=10)
    hll2.add_series(set2)

    merged = hll1.merge(hll2)
    merged_estimate = merged.estimate()

    # Also compute direct estimate over combined series
    combined_series = pd.concat([set1, set2])
    direct_hll = HyperLogLog(p=10)
    direct_hll.add_series(combined_series)
    direct_estimate = direct_hll.estimate()

    # Merged registers must match direct registers exactly
    np.testing.assert_array_equal(merged.get_dense_registers(), direct_hll.get_dense_registers())
    assert abs(merged_estimate - 2000) / 2000 < 0.08

def test_database_persistence_and_relations():
    """Test database setup, relationships, and 3NF normalization."""
    init_db()
    with SessionLocal() as db:
        users = db.query(User).all()
        assert len(users) >= 3
        roles = {u.role for u in users}
        assert "ADMIN" in roles and "ANALYST" in roles and "DEVELOPER" in roles

        datasets = db.query(Dataset).all()
        assert len(datasets) >= 1

        cols = db.query(ColumnModel).filter(ColumnModel.dataset_id == 1).all()
        assert len(cols) >= 10

def test_benchmark_runner():
    """Test benchmark run on sample taxi data."""
    df = load_data()
    assert df is not None and len(df) > 0

    res = run_benchmark(df, "COUNT_DISTINCT", column="fare_amount", precision_p=10, run_exact=True)
    assert res["approx_result"] is not None
    assert res["exact_result"] is not None
    assert res["error_pct"] is not None
    assert res["approx_time_ms"] >= 0
    assert res["exact_time_ms"] >= 0

def test_sparse_representation_linear_counting():
    """Test HLL++ sparse mode with high precision p'=25 (Section 5.3)."""
    items = pd.Series([f"sparse_item_{i}" for i in range(150)])
    hll = HyperLogLog(p=12, representation="SPARSE")
    hll.add_series(items)
    assert hll.representation == "SPARSE"
    est = hll.estimate()
    # In sparse mode with p'=25, 150 items should be estimated within 1 item
    assert abs(est - 150) <= 2

def test_clz64_exactness():
    """Test 64-bit count-leading-zeros bitwise exactness (Section 5.1)."""
    from engine.sketches import clz64_vec
    vals = np.array([0, 1, 2, 3, (1 << 63) - 1, 1 << 63, 1 << 62], dtype=np.uint64)
    clz = clz64_vec(vals)
    assert clz[0] == 64
    assert clz[1] == 63
    assert clz[2] == 62
    assert clz[3] == 62
    assert clz[4] == 1
    assert clz[5] == 0
    assert clz[6] == 1

def test_precision_error_convergence():
    """Test error bounds across precision sweep p in [8, 10, 12, 14] (Section 5.4)."""
    df = load_data()
    series = df["fare_amount"].dropna()
    exact_count = series.nunique()

    errors = []
    for p in [8, 10, 12, 14]:
        hll = HyperLogLog(p=p)
        hll.add_series(series)
        est = hll.estimate()
        err = abs(est - exact_count) / exact_count * 100
        theo = 1.04 / math.sqrt(1 << p) * 100
        errors.append((p, err, theo))
        # Actual error should be well bounded
        assert err < max(theo * 2.5, 5.0)
