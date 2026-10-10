-- ============================================================================
-- BCSE302P – DATABASE SYSTEMS LAB | Assessment 6
-- AQE: Approximate Query Engine - PostgreSQL Schema DDL
-- HyperLogLog-Based Relational Platform for Fast Cardinality Estimation
-- Reference Paper: Heule, Nunkesser, Hall (2013), Google PowerDrill HLL
-- ============================================================================

DROP TABLE IF EXISTS execution_metrics CASCADE;
DROP TABLE IF EXISTS query_results CASCADE;
DROP TABLE IF EXISTS sketch_merges CASCADE;
DROP TABLE IF EXISTS hll_registers CASCADE;
DROP TABLE IF EXISTS hll_sketches CASCADE;
DROP TABLE IF EXISTS query_groupings CASCADE;
DROP TABLE IF EXISTS query_filters CASCADE;
DROP TABLE IF EXISTS query_requests CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS
-- Application identity, query authorization, and ownership
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'ANALYST', 'DEVELOPER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. DATASETS
-- Input analytical dataset metadata and ingestion state
CREATE TABLE datasets (
    dataset_id BIGSERIAL PRIMARY KEY,
    dataset_name VARCHAR(200) UNIQUE NOT NULL,
    source_uri TEXT NOT NULL,
    format VARCHAR(30) NOT NULL CHECK (format IN ('CSV', 'PARQUET', 'JSON', 'DATABASE', 'OTHER')),
    row_count BIGINT CHECK (row_count >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED', 'PROCESSING')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. COLUMNS
-- Schema definition for each dataset (target, filter, or grouping columns)
-- Enforces 3NF: dataset_id is foreign key here, preventing transitive dependencies.
CREATE TABLE columns (
    column_id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT NOT NULL REFERENCES datasets(dataset_id) ON DELETE CASCADE,
    column_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(60) NOT NULL,
    ordinal_position INTEGER NOT NULL CHECK (ordinal_position > 0),
    is_nullable BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT uq_dataset_column UNIQUE (dataset_id, column_name)
);

-- 4. QUERY_REQUESTS
-- Analytical query submissions with configured HLL precision
CREATE TABLE query_requests (
    query_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    target_column_id BIGINT NOT NULL REFERENCES columns(column_id),
    operation VARCHAR(30) NOT NULL CHECK (operation IN ('COUNT_DISTINCT', 'COUNT', 'AVG', 'SUM', 'FREQUENCY')),
    query_text TEXT,
    precision_p SMALLINT NOT NULL CHECK (precision_p > 0),
    register_count INTEGER NOT NULL CHECK (register_count > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. QUERY_FILTERS
-- Normalized WHERE clause predicates (1NF compliant)
CREATE TABLE query_filters (
    filter_id BIGSERIAL PRIMARY KEY,
    query_id BIGINT NOT NULL REFERENCES query_requests(query_id) ON DELETE CASCADE,
    column_id BIGINT NOT NULL REFERENCES columns(column_id),
    operator VARCHAR(20) NOT NULL CHECK (operator IN ('=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN')),
    value_text TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0)
);

-- 6. QUERY_GROUPINGS
-- Normalized GROUP BY columns (1NF compliant)
CREATE TABLE query_groupings (
    grouping_id BIGSERIAL PRIMARY KEY,
    query_id BIGINT NOT NULL REFERENCES query_requests(query_id) ON DELETE CASCADE,
    column_id BIGINT NOT NULL REFERENCES columns(column_id),
    position INTEGER NOT NULL CHECK (position > 0),
    CONSTRAINT uq_query_grouping UNIQUE (query_id, column_id)
);

-- 7. HLL_SKETCHES
-- HyperLogLog sketch identity, versioning, and configuration
CREATE TABLE hll_sketches (
    sketch_id BIGSERIAL PRIMARY KEY,
    column_id BIGINT NOT NULL REFERENCES columns(column_id),
    precision_p SMALLINT NOT NULL CHECK (precision_p > 0),
    register_count INTEGER NOT NULL CHECK (register_count > 0),
    algorithm_version VARCHAR(40) NOT NULL,
    hash_version VARCHAR(40) NOT NULL,
    representation VARCHAR(20) NOT NULL CHECK (representation IN ('SPARSE', 'DENSE')),
    build_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_current BOOLEAN DEFAULT TRUE NOT NULL
);

-- 8. HLL_REGISTERS
-- Relational dense state: m = 2^p registers per sketch
-- Composite PK (sketch_id, register_index) ensures 2NF compliance.
CREATE TABLE hll_registers (
    sketch_id BIGINT NOT NULL REFERENCES hll_sketches(sketch_id) ON DELETE CASCADE,
    register_index INTEGER NOT NULL CHECK (register_index >= 0),
    register_value SMALLINT NOT NULL CHECK (register_value >= 0),
    PRIMARY KEY (sketch_id, register_index)
);

-- 9. SKETCH_MERGES
-- Records merge operations and lineage for partitioned/parallel HLL processing
CREATE TABLE sketch_merges (
    merge_id BIGSERIAL PRIMARY KEY,
    target_sketch_id BIGINT NOT NULL REFERENCES hll_sketches(sketch_id) ON DELETE CASCADE,
    source_sketch_id BIGINT NOT NULL REFERENCES hll_sketches(sketch_id) ON DELETE CASCADE,
    merged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. QUERY_RESULTS
-- Approximate answers, configured error target, and optional exact benchmark
CREATE TABLE query_results (
    result_id BIGSERIAL PRIMARY KEY,
    query_id BIGINT UNIQUE NOT NULL REFERENCES query_requests(query_id) ON DELETE CASCADE,
    sketch_id BIGINT REFERENCES hll_sketches(sketch_id),
    estimated_cardinality NUMERIC(30, 6) NOT NULL CHECK (estimated_cardinality >= 0),
    relative_error_target NUMERIC(10, 8) CHECK (relative_error_target >= 0),
    exact_cardinality NUMERIC(30, 6) CHECK (exact_cardinality >= 0),
    error_percent NUMERIC(12, 6) CHECK (error_percent >= 0),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. EXECUTION_METRICS
-- Performance benchmarking: latency, memory footprint, rows processed, speedup
CREATE TABLE execution_metrics (
    execution_id BIGSERIAL PRIMARY KEY,
    query_id BIGINT NOT NULL REFERENCES query_requests(query_id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    latency_ms NUMERIC(14, 3) NOT NULL CHECK (latency_ms >= 0),
    rows_processed BIGINT CHECK (rows_processed >= 0),
    memory_bytes BIGINT CHECK (memory_bytes >= 0),
    merge_count INTEGER DEFAULT 0 NOT NULL CHECK (merge_count >= 0),
    exact_comparison_run BOOLEAN DEFAULT FALSE NOT NULL
);

-- ============================================================================
-- INDEXING STRATEGY (Section 8.7)
-- ============================================================================
CREATE INDEX idx_columns_dataset_name ON columns(dataset_id, column_name);
CREATE INDEX idx_queries_target ON query_requests(target_column_id);
CREATE INDEX idx_queries_created ON query_requests(created_at);
CREATE INDEX idx_filters_query ON query_filters(query_id, position);
CREATE INDEX idx_groupings_query ON query_groupings(query_id, position);
CREATE INDEX idx_sketch_column_current ON hll_sketches(column_id, is_current);
CREATE INDEX idx_register_sketch ON hll_registers(sketch_id);
CREATE INDEX idx_results_query ON query_results(query_id);
CREATE INDEX idx_metrics_query ON execution_metrics(query_id, start_time);
