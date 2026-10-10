import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import time
from datetime import datetime

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text, desc

from config import (
    DEFAULT_PRECISION_P,
    ALGORITHM_VERSION,
    HASH_VERSION
)
from database.db_session import get_db, init_db
from database.models import (
    User, Dataset, ColumnModel, QueryRequest, QueryFilter,
    QueryGrouping, HLLSketch, HLLRegister, SketchMerge,
    QueryResult, ExecutionMetric
)
from data.loader import load_data, get_dataset_metadata
from engine.benchmark import run_benchmark
from engine.sketches import HyperLogLog

# Initialize FastAPI
app = FastAPI(
    title="AQE - Approximate Query Engine",
    description="Relational Platform for HyperLogLog Cardinality Estimation and Approximate Query Processing",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables and seeds on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Request Models
class FilterItem(BaseModel):
    column: str
    operator: str = "="
    value: str

class QueryRunRequest(BaseModel):
    user_id: int = 2  # Default to Analyst
    dataset_id: int = 1
    query_type: str = "COUNT_DISTINCT"
    column: str = "fare_amount"
    group_by: Optional[str] = None
    precision_p: int = Field(default=DEFAULT_PRECISION_P, ge=4, le=18)
    sample_rate: float = Field(default=0.1, ge=0.01, le=1.0)
    representation: str = "DENSE"
    filters: Optional[List[FilterItem]] = None
    run_benchmark: bool = True

class BuildSketchRequest(BaseModel):
    dataset_id: int = 1
    column_name: str = "fare_amount"
    precision_p: int = Field(default=DEFAULT_PRECISION_P, ge=4, le=18)
    representation: str = "DENSE"

class MergeSketchesRequest(BaseModel):
    target_sketch_id: int
    source_sketch_id: int

# ============================================================================
# Core Endpoints
# ============================================================================

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "AQE – Approximate Query Engine",
        "lab_course": "BCSE302P – Database Systems Lab",
        "assessment": "Assessment 6 – Project Proposal & Database Design Document",
        "algorithm": ALGORITHM_VERSION,
        "hash_function": HASH_VERSION
    }

@app.get("/data")
def get_data_info(db: Session = Depends(get_db)):
    meta = get_dataset_metadata()
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not loaded")
    return {
        "name": meta["dataset_name"],
        "rows": meta["row_count"],
        "columns": [c["name"] for c in meta["columns"]],
        "detailed_columns": meta["columns"]
    }

@app.get("/sample")
def get_sample_rows():
    df = load_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Data not loaded")
    return df.head(10).to_dict(orient="records")

# ============================================================================
# Datasets & Columns (Section 8.1 - 8.3)
# ============================================================================

@app.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()
    result = []
    for d in datasets:
        result.append({
            "dataset_id": d.dataset_id,
            "dataset_name": d.dataset_name,
            "source_uri": d.source_uri,
            "format": d.format,
            "row_count": d.row_count,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "column_count": len(d.columns)
        })
    return result

@app.get("/datasets/{dataset_id}/columns")
def list_dataset_columns(dataset_id: int, db: Session = Depends(get_db)):
    cols = db.query(ColumnModel).filter(ColumnModel.dataset_id == dataset_id).order_by(ColumnModel.ordinal_position).all()
    if not cols:
        raise HTTPException(status_code=404, detail="No columns found for dataset")
    return [
        {
            "column_id": c.column_id,
            "column_name": c.column_name,
            "data_type": c.data_type,
            "ordinal_position": c.ordinal_position,
            "is_nullable": c.is_nullable
        }
        for c in cols
    ]

# ============================================================================
# Transactional Query Execution (Section 9.3)
# ============================================================================

@app.post("/query")
def execute_query(req: QueryRunRequest, db: Session = Depends(get_db)):
    """
    Executes an approximate query conforming to the Transactional Workflow:
    1. Begin query execution record in QUERY_REQUESTS with status PENDING/RUNNING.
    2. Validate target column and precision.
    3. Execute in AQE engine (HyperLogLog or sampling).
    4. Persist HLL sketch and dense registers.
    5. Persist QUERY_RESULTS and EXECUTION_METRICS.
    6. Commit transaction atomically.
    """
    df = load_data()
    if df is None:
        raise HTTPException(status_code=500, detail="Data source unavailable")

    # Validate target column in DB
    target_col = db.query(ColumnModel).filter(
        ColumnModel.dataset_id == req.dataset_id,
        ColumnModel.column_name == req.column
    ).first()

    if not target_col:
        # If column not in DB yet, try to look up or pick first
        target_col = db.query(ColumnModel).filter(ColumnModel.column_name == req.column).first()
        if not target_col:
            raise HTTPException(status_code=400, detail=f"Target column '{req.column}' does not exist in relational catalog")

    user = db.query(User).filter(User.user_id == req.user_id).first()
    if not user:
        user = db.query(User).first()

    # Form query text representation
    filter_repr = ""
    if req.filters:
        filter_repr = " WHERE " + " AND ".join([f"{f.column} {f.operator} {f.value}" for f in req.filters])
    group_repr = f" GROUP BY {req.group_by}" if req.group_by else ""
    query_text = f"SELECT {req.query_type}({req.column}) FROM dataset_{req.dataset_id}{filter_repr}{group_repr};"

    m = 1 << req.precision_p

    # Step 1: Create Query Request Record
    query_request = QueryRequest(
        user_id=user.user_id,
        target_column_id=target_col.column_id,
        operation=req.query_type.upper(),
        query_text=query_text,
        precision_p=req.precision_p,
        register_count=m,
        status="RUNNING",
        created_at=datetime.utcnow()
    )
    db.add(query_request)
    db.flush()  # assign query_id

    # Step 2: Store Filters and Groupings (1NF normalized)
    if req.filters:
        for pos, flt in enumerate(req.filters, start=1):
            flt_col = db.query(ColumnModel).filter(ColumnModel.column_name == flt.column).first()
            if flt_col:
                db.add(QueryFilter(
                    query_id=query_request.query_id,
                    column_id=flt_col.column_id,
                    operator=flt.operator,
                    value_text=flt.value,
                    position=pos
                ))

    if req.group_by:
        grp_col = db.query(ColumnModel).filter(ColumnModel.column_name == req.group_by).first()
        if grp_col:
            db.add(QueryGrouping(
                query_id=query_request.query_id,
                column_id=grp_col.column_id,
                position=1
            ))

    # Step 3: Execute in Engine
    start_time = datetime.utcnow()
    try:
        raw_filters = [f.dict() for f in req.filters] if req.filters else None
        benchmark_res = run_benchmark(
            df=df,
            query_type=req.query_type,
            column=req.column,
            group_by=req.group_by,
            precision_p=req.precision_p,
            sample_rate=req.sample_rate,
            representation=req.representation,
            filters=raw_filters,
            run_exact=req.run_benchmark
        )
    except Exception as e:
        query_request.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Engine execution failed: {str(e)}")
    end_time = datetime.utcnow()

    # Step 4: Persist HLL Sketch & Registers (if COUNT_DISTINCT)
    sketch_row = None
    if req.query_type.upper() == "COUNT_DISTINCT" and benchmark_res.get("sketch"):
        sketch_obj: HyperLogLog = benchmark_res["sketch"]
        
        # Mark previous sketches for this column as not current
        db.query(HLLSketch).filter(
            HLLSketch.column_id == target_col.column_id,
            HLLSketch.is_current == True
        ).update({"is_current": False})

        sketch_row = HLLSketch(
            column_id=target_col.column_id,
            precision_p=req.precision_p,
            register_count=m,
            algorithm_version=ALGORITHM_VERSION,
            hash_version=HASH_VERSION,
            representation=sketch_obj.representation,
            build_timestamp=datetime.utcnow(),
            is_current=True
        )
        db.add(sketch_row)
        db.flush()

        # Persist dense registers relationally (lab requirement 8.5)
        # Store non-zero registers or full vector
        reg_entries = []
        dense_regs = sketch_obj.get_dense_registers()
        for reg_idx, reg_val in enumerate(dense_regs):
            if reg_val > 0:  # store active registers
                reg_entries.append(HLLRegister(
                    sketch_id=sketch_row.sketch_id,
                    register_index=reg_idx,
                    register_value=int(reg_val)
                ))
        db.bulk_save_objects(reg_entries)

    # Step 5: Persist Query Result
    approx_val = benchmark_res["approx_result"]
    exact_val = benchmark_res.get("exact_result")
    err_pct = benchmark_res.get("error_pct")

    # If dict (group by), serialize or take primary
    approx_numeric = approx_val if isinstance(approx_val, (int, float)) else sum(approx_val.values()) if isinstance(approx_val, dict) else 0.0
    exact_numeric = exact_val if isinstance(exact_val, (int, float)) else sum(exact_val.values()) if isinstance(exact_val, dict) else None
    err_numeric = err_pct if isinstance(err_pct, (int, float)) else None

    query_result = QueryResult(
        query_id=query_request.query_id,
        sketch_id=sketch_row.sketch_id if sketch_row else None,
        estimated_cardinality=approx_numeric,
        relative_error_target=benchmark_res.get("theoretical_error"),
        exact_cardinality=exact_numeric,
        error_percent=err_numeric,
        generated_at=datetime.utcnow()
    )
    db.add(query_result)

    # Step 6: Persist Execution Metrics
    metric = ExecutionMetric(
        query_id=query_request.query_id,
        start_time=start_time,
        end_time=end_time,
        latency_ms=benchmark_res["approx_time_ms"],
        rows_processed=benchmark_res.get("rows_processed"),
        memory_bytes=benchmark_res.get("memory_bytes"),
        merge_count=0,
        exact_comparison_run=req.run_benchmark
    )
    db.add(metric)

    # Mark query completed and commit transaction
    query_request.status = "COMPLETED"
    db.commit()

    return {
        "query_id": query_request.query_id,
        "query_text": query_text,
        "operation": req.query_type,
        "column": req.column,
        "precision_p": req.precision_p,
        "register_count": m,
        "theoretical_error": benchmark_res.get("theoretical_error"),
        "approx_result": benchmark_res["approx_result"],
        "exact_result": benchmark_res.get("exact_result"),
        "error_pct": benchmark_res.get("error_pct"),
        "approx_time_ms": benchmark_res["approx_time_ms"],
        "exact_time_ms": benchmark_res.get("exact_time_ms"),
        "speedup": benchmark_res.get("speedup"),
        "sketch_id": sketch_row.sketch_id if sketch_row else None,
        "memory_bytes": benchmark_res.get("memory_bytes"),
        "rows_processed": benchmark_res.get("rows_processed")
    }

# ============================================================================
# Sketch Management & Merging (Section 6.4, 8.1, 8.5)
# ============================================================================

@app.get("/sketches")
def list_sketches(column_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(HLLSketch)
    if column_id:
        query = query.filter(HLLSketch.column_id == column_id)
    sketches = query.order_by(desc(HLLSketch.build_timestamp)).all()
    return [
        {
            "sketch_id": s.sketch_id,
            "column_id": s.column_id,
            "column_name": s.column.column_name if s.column else None,
            "precision_p": s.precision_p,
            "register_count": s.register_count,
            "algorithm_version": s.algorithm_version,
            "hash_version": s.hash_version,
            "representation": s.representation,
            "build_timestamp": s.build_timestamp.isoformat(),
            "is_current": s.is_current,
            "active_registers_count": len(s.registers)
        }
        for s in sketches
    ]

@app.get("/sketches/{sketch_id}/registers")
def get_sketch_registers(
    sketch_id: int,
    limit: int = Query(default=1024, le=65536),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    sketch = db.query(HLLSketch).filter(HLLSketch.sketch_id == sketch_id).first()
    if not sketch:
        raise HTTPException(status_code=404, detail="Sketch not found")

    regs = db.query(HLLRegister).filter(
        HLLRegister.sketch_id == sketch_id
    ).order_by(HLLRegister.register_index).offset(offset).limit(limit).all()

    # Compute value frequency distribution for visualization
    val_counts: Dict[int, int] = {}
    for r in regs:
        val_counts[r.register_value] = val_counts.get(r.register_value, 0) + 1

    return {
        "sketch_id": sketch.sketch_id,
        "precision_p": sketch.precision_p,
        "register_count": sketch.register_count,
        "representation": sketch.representation,
        "registers": [{"index": r.register_index, "value": r.register_value} for r in regs],
        "distribution": val_counts,
        "total_active_registers": len(regs)
    }

@app.post("/sketches/build")
def build_sketch(req: BuildSketchRequest, db: Session = Depends(get_db)):
    df = load_data()
    if df is None:
        raise HTTPException(status_code=500, detail="Data source unavailable")

    target_col = db.query(ColumnModel).filter(
        ColumnModel.dataset_id == req.dataset_id,
        ColumnModel.column_name == req.column_name
    ).first()
    if not target_col:
        raise HTTPException(status_code=404, detail=f"Column '{req.column_name}' not found")

    hll = HyperLogLog(p=req.precision_p, representation=req.representation)
    hll.add_series(df[req.column_name])

    # Mark prior sketches not current
    db.query(HLLSketch).filter(
        HLLSketch.column_id == target_col.column_id,
        HLLSketch.is_current == True
    ).update({"is_current": False})

    m = 1 << req.precision_p
    new_sketch = HLLSketch(
        column_id=target_col.column_id,
        precision_p=req.precision_p,
        register_count=m,
        algorithm_version=ALGORITHM_VERSION,
        hash_version=HASH_VERSION,
        representation=hll.representation,
        build_timestamp=datetime.utcnow(),
        is_current=True
    )
    db.add(new_sketch)
    db.flush()

    dense_regs = hll.get_dense_registers()
    reg_rows = [
        HLLRegister(sketch_id=new_sketch.sketch_id, register_index=i, register_value=int(v))
        for i, v in enumerate(dense_regs) if v > 0
    ]
    db.bulk_save_objects(reg_rows)
    db.commit()

    return {
        "sketch_id": new_sketch.sketch_id,
        "column": req.column_name,
        "precision_p": req.precision_p,
        "register_count": m,
        "estimated_cardinality": hll.estimate(),
        "active_registers": len(reg_rows)
    }

@app.post("/sketches/merge")
def merge_sketches(req: MergeSketchesRequest, db: Session = Depends(get_db)):
    """
    Merges two sketches using register-wise maximum, persisting the target
    merged sketch and recording merge lineage in SKETCH_MERGES.
    """
    s1 = db.query(HLLSketch).filter(HLLSketch.sketch_id == req.target_sketch_id).first()
    s2 = db.query(HLLSketch).filter(HLLSketch.sketch_id == req.source_sketch_id).first()

    if not s1 or not s2:
        raise HTTPException(status_code=404, detail="One or both sketches not found")
    if s1.precision_p != s2.precision_p:
        raise HTTPException(status_code=400, detail=f"Precision mismatch: {s1.precision_p} vs {s2.precision_p}")

    # Reconstruct HyperLogLog instances
    hll1 = HyperLogLog(p=s1.precision_p)
    hll2 = HyperLogLog(p=s2.precision_p)

    for r in s1.registers:
        hll1.registers[r.register_index] = r.register_value
    for r in s2.registers:
        hll2.registers[r.register_index] = r.register_value

    # Merge
    merged_hll = hll1.merge(hll2)

    # Persist merged sketch
    merged_sketch = HLLSketch(
        column_id=s1.column_id,
        precision_p=s1.precision_p,
        register_count=s1.register_count,
        algorithm_version=ALGORITHM_VERSION,
        hash_version=HASH_VERSION,
        representation="DENSE",
        build_timestamp=datetime.utcnow(),
        is_current=False
    )
    db.add(merged_sketch)
    db.flush()

    # Save merged registers
    dense_regs = merged_hll.get_dense_registers()
    reg_rows = [
        HLLRegister(sketch_id=merged_sketch.sketch_id, register_index=i, register_value=int(v))
        for i, v in enumerate(dense_regs) if v > 0
    ]
    db.bulk_save_objects(reg_rows)

    # Record merge lineage in SKETCH_MERGES
    merge_record = SketchMerge(
        target_sketch_id=merged_sketch.sketch_id,
        source_sketch_id=s2.sketch_id,
        merged_at=datetime.utcnow()
    )
    db.add(merge_record)
    db.commit()

    return {
        "merged_sketch_id": merged_sketch.sketch_id,
        "target_source_id": s1.sketch_id,
        "second_source_id": s2.sketch_id,
        "precision_p": s1.precision_p,
        "merged_cardinality": merged_hll.estimate()
    }

# ============================================================================
# SQL Analytics (Section 8.9)
# ============================================================================

@app.get("/analytics/workload")
def get_workload_analytics(db: Session = Depends(get_db)):
    """
    Executes Section 8.9 Query 2: Analytical Workload & Latency per Dataset
    """
    sql = text("""
        SELECT 
            d.dataset_id,
            d.dataset_name, 
            COUNT(q.query_id) AS query_count,
            ROUND(AVG(m.latency_ms), 3) AS avg_latency_ms
        FROM datasets d
        JOIN columns c ON c.dataset_id = d.dataset_id
        LEFT JOIN query_requests q ON q.target_column_id = c.column_id
        LEFT JOIN execution_metrics m ON m.query_id = q.query_id
        GROUP BY d.dataset_id, d.dataset_name
        ORDER BY query_count DESC;
    """)
    rows = db.execute(sql).fetchall()
    return [
        {
            "dataset_id": r[0],
            "dataset_name": r[1],
            "query_count": r[2],
            "avg_latency_ms": float(r[3]) if r[3] is not None else 0.0
        }
        for r in rows
    ]

@app.get("/analytics/accuracy")
def get_accuracy_analytics(db: Session = Depends(get_db)):
    """
    Executes Section 8.9 Query 3: Accuracy and Estimation Error Analysis
    """
    sql = text("""
        SELECT 
            q.query_id, 
            q.precision_p,
            q.register_count,
            r.estimated_cardinality, 
            r.exact_cardinality,
            ABS(r.estimated_cardinality - r.exact_cardinality) AS absolute_error,
            r.error_percent
        FROM query_requests q
        JOIN query_results r ON r.query_id = q.query_id
        WHERE r.exact_cardinality IS NOT NULL
        ORDER BY q.created_at DESC
        LIMIT 50;
    """)
    rows = db.execute(sql).fetchall()
    return [
        {
            "query_id": r[0],
            "precision_p": r[1],
            "register_count": r[2],
            "estimated_cardinality": float(r[3]) if r[3] is not None else 0.0,
            "exact_cardinality": float(r[4]) if r[4] is not None else 0.0,
            "absolute_error": float(r[5]) if r[5] is not None else 0.0,
            "error_percent": float(r[6]) if r[6] is not None else 0.0
        }
        for r in rows
    ]

@app.get("/analytics/precision-sweep")
def run_precision_sweep(column: str = "fare_amount", db: Session = Depends(get_db)):
    """
    Compares HLL precision across p = [8, 10, 12, 14, 16] for speed, error %, and memory.
    """
    df = load_data()
    if df is None:
        raise HTTPException(status_code=500, detail="Data source unavailable")
    if column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{column}' not found")

    exact_res = run_benchmark(df, "COUNT_DISTINCT", column=column, run_exact=True)
    exact_val = exact_res["exact_result"]
    exact_time = exact_res["exact_time_ms"]

    sweep_results = []
    precisions = [8, 10, 12, 14, 16]

    for p in precisions:
        m = 1 << p
        t_start = time.perf_counter()
        hll = HyperLogLog(p=p)
        hll.add_series(df[column])
        est = hll.estimate()
        t_end = time.perf_counter()

        latency_ms = round((t_end - t_start) * 1000.0, 3)
        err_pct = round(abs(est - exact_val) / exact_val * 100.0, 4) if exact_val else 0.0
        theoretical_err = round(1.04 / (m ** 0.5) * 100.0, 3)
        speedup = round(exact_time / latency_ms, 2) if latency_ms > 0 else 1.0

        sweep_results.append({
            "p": p,
            "register_count": m,
            "memory_bytes": m,  # 1 byte per register
            "estimated_cardinality": est,
            "exact_cardinality": exact_val,
            "observed_error_pct": err_pct,
            "theoretical_error_pct": theoretical_err,
            "latency_ms": latency_ms,
            "speedup": speedup
        })

    return {
        "column": column,
        "exact_cardinality": exact_val,
        "exact_time_ms": exact_time,
        "sweep": sweep_results
    }

@app.get("/analytics/merges")
def get_merge_lineage(db: Session = Depends(get_db)):
    """
    Executes Section 8.9 Query 6: Sketch Merge Lineage
    """
    merges = db.query(SketchMerge).order_by(desc(SketchMerge.merged_at)).all()
    return [
        {
            "merge_id": m.merge_id,
            "target_sketch_id": m.target_sketch_id,
            "source_sketch_id": m.source_sketch_id,
            "merged_at": m.merged_at.isoformat()
        }
        for m in merges
    ]

@app.get("/history")
def get_query_history(limit: int = 20, db: Session = Depends(get_db)):
    queries = db.query(QueryRequest).order_by(desc(QueryRequest.created_at)).limit(limit).all()
    out = []
    for q in queries:
        res = q.result
        metric = q.metrics[0] if q.metrics else None
        out.append({
            "query_id": q.query_id,
            "user": q.user.full_name if q.user else "Unknown",
            "operation": q.operation,
            "target_column": q.target_column.column_name if q.target_column else "",
            "precision_p": q.precision_p,
            "register_count": q.register_count,
            "status": q.status,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "estimated_cardinality": float(res.estimated_cardinality) if res else None,
            "exact_cardinality": float(res.exact_cardinality) if res and res.exact_cardinality else None,
            "error_percent": float(res.error_percent) if res and res.error_percent else None,
            "latency_ms": float(metric.latency_ms) if metric else None
        })
    return out

@app.get("/schema-info")
def get_schema_summary():
    """Returns database schema information conforming to Assessment 6 Section 8."""
    return {
        "database": "PostgreSQL",
        "normalization": "Third Normal Form (3NF)",
        "paper_reference": "Heule, Nunkesser, Hall (2013) - HyperLogLog in Practice",
        "tables": [
            {"name": "users", "primary_key": "user_id", "purpose": "Application identity & query ownership"},
            {"name": "datasets", "primary_key": "dataset_id", "purpose": "Input dataset metadata"},
            {"name": "columns", "primary_key": "column_id", "purpose": "Dataset schema metadata & 3NF foreign key"},
            {"name": "query_requests", "primary_key": "query_id", "purpose": "Submitted approximate analytical queries"},
            {"name": "query_filters", "primary_key": "filter_id", "purpose": "Normalized WHERE predicates (1NF)"},
            {"name": "query_groupings", "primary_key": "grouping_id", "purpose": "Normalized GROUP BY columns (1NF)"},
            {"name": "hll_sketches", "primary_key": "sketch_id", "purpose": "HLL metadata, precision p, algorithm version"},
            {"name": "hll_registers", "primary_key": "(sketch_id, register_index)", "purpose": "Relational dense register state (2NF)"},
            {"name": "sketch_merges", "primary_key": "merge_id", "purpose": "Sketch merge lineage for parallel processing"},
            {"name": "query_results", "primary_key": "result_id", "purpose": "Estimated cardinality & error observations"},
            {"name": "execution_metrics", "primary_key": "execution_id", "purpose": "Execution latency & benchmark measurements"}
        ]
    }