-- ============================================================================
-- BCSE302P – DATABASE SYSTEMS LAB | Assessment 6
-- AQE Representative SQL Operations (Section 8.9)
-- ============================================================================

-- Query 1: Retrieve Current Compatible HLL Sketch for a Target Column
-- Finds the active sketch configuration (p, m, representation) for distinct-count estimation.
SELECT sketch_id, precision_p, register_count, representation, algorithm_version, hash_version
FROM hll_sketches
WHERE column_id = :column_id AND is_current = TRUE
ORDER BY build_timestamp DESC LIMIT 1;

-- Query 2: Analytical Workload & Latency per Dataset
-- Demonstrates aggregation across datasets, columns, query requests, and execution measurements.
SELECT 
    d.dataset_id,
    d.dataset_name, 
    COUNT(q.query_id) AS query_count,
    ROUND(AVG(m.latency_ms), 3) AS avg_latency_ms,
    ROUND(MIN(m.latency_ms), 3) AS min_latency_ms,
    ROUND(MAX(m.latency_ms), 3) AS max_latency_ms
FROM datasets d
JOIN columns c ON c.dataset_id = d.dataset_id
LEFT JOIN query_requests q ON q.target_column_id = c.column_id
LEFT JOIN execution_metrics m ON m.query_id = q.query_id
GROUP BY d.dataset_id, d.dataset_name
ORDER BY query_count DESC;

-- Query 3: Accuracy and Estimation Error Analysis
-- Evaluates observed error percentage against exact benchmark cardinalities.
SELECT 
    q.query_id, 
    q.precision_p,
    q.register_count,
    r.estimated_cardinality, 
    r.exact_cardinality,
    ABS(r.estimated_cardinality - r.exact_cardinality) AS absolute_error,
    r.error_percent,
    m.latency_ms
FROM query_requests q
JOIN query_results r ON r.query_id = q.query_id
LEFT JOIN execution_metrics m ON m.query_id = q.query_id
WHERE r.exact_cardinality IS NOT NULL
ORDER BY q.created_at DESC;

-- Query 4: Inspect Relational Dense Register State for a Given Sketch
-- Retrieves register indexes and maximum leading zero statistics.
SELECT register_index, register_value
FROM hll_registers
WHERE sketch_id = :sketch_id
ORDER BY register_index ASC;

-- Query 5: Precision vs Error & Speedup Trade-off Evaluation
-- Analyzes how precision p affects latency and error margins across workloads.
SELECT 
    q.precision_p,
    q.register_count,
    COUNT(q.query_id) AS run_count,
    ROUND(AVG(m.latency_ms), 3) AS avg_latency_ms,
    ROUND(AVG(r.error_percent), 4) AS avg_error_percent,
    ROUND(AVG(m.memory_bytes), 0) AS avg_memory_bytes
FROM query_requests q
JOIN query_results r ON r.query_id = q.query_id
JOIN execution_metrics m ON m.query_id = q.query_id
WHERE r.exact_cardinality IS NOT NULL
GROUP BY q.precision_p, q.register_count
ORDER BY q.precision_p ASC;

-- Query 6: Sketch Merge Lineage Analysis
-- Inspects merge operations for parallel/partitioned sketch aggregations.
SELECT 
    m.merge_id,
    m.target_sketch_id,
    m.source_sketch_id,
    ts.precision_p AS target_p,
    ss.precision_p AS source_p,
    m.merged_at
FROM sketch_merges m
JOIN hll_sketches ts ON ts.sketch_id = m.target_sketch_id
JOIN hll_sketches ss ON ss.sketch_id = m.source_sketch_id
ORDER BY m.merged_at DESC;
