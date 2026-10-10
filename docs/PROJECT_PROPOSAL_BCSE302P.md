# BCSE302P – DATABASE SYSTEMS LAB
## Assessment 6 – Project Proposal & Database Design Document

| Submission Detail | Value |
| :--- | :--- |
| **Course** | BCSE302P – Database Systems Lab |
| **Assessment** | Assessment 6 – Project Proposal & Database Design Document |
| **Marks / Due Date** | 10 Marks / 01 October 2026 |
| **Repository** | [https://github.com/aniishkumar/aqe](https://github.com/aniishkumar/aqe) |
| **Reference Paper** | *HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm* |
| **Authors** | Stefan Heule, Marc Nunkesser, Alex Hall (Google PowerDrill) |
| **Target Database** | PostgreSQL (Relational Database Management System) |
| **Database Type** | Relational Database Management System (RDBMS) |

---

## 1. Project Title
**AQE – Approximate Query Engine: A HyperLogLog-Based Relational Platform for Fast Cardinality Estimation and Approximate Analytical Query Processing.**

AQE is an approximate query engine whose central objective is to trade a controlled amount of accuracy for substantially faster analytical processing, with distinct-cardinality estimation as the principal use case.

---

## 2. Introduction and Background
Large-scale analytical systems frequently execute aggregate queries over very large datasets. One particularly expensive operation is `COUNT DISTINCT` because exact distinct counting requires maintaining and scanning sets of unique values, consuming substantial memory and CPU cycles. This becomes even more challenging when queries contain `GROUP BY` clauses, because many distinct-count computations must be performed concurrently.

The reference paper, *“HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm”*, presents an engineered HyperLogLog (HLL++) approach for cardinality estimation. The paper identifies four practical requirements:
1. **Accuracy**: Controllable error bounds via precision $p$.
2. **Memory Efficiency**: Compact probabilistic state ($m = 2^p$ bytes).
3. **Extreme Cardinality Scalability**: Ability to estimate from cardinalities of zero up to $2^{64}$.
4. **Practicality of Implementation & Maintenance**: Mergeability, serialization, and integration into interactive SQL engines (Google PowerDrill).

HyperLogLog estimates distinct elements by:
- Hashing input values using a 64-bit hash function.
- Partitioning the stream into $m = 2^p$ substreams using $p$ hash-prefix bits.
- Maintaining compact registers storing the maximum observed leading-zero statistic $\rho(w) = \text{clz}(w) + 1$.
- Applying a normalized, bias-corrected harmonic-mean estimator with small-range Linear Counting corrections.

In this project, the relational database (PostgreSQL) is designed as the persistent control, lineage, and evaluation layer around the approximate query processing engine.

---

## 3. Problem Statement
Exact analytical processing of distinct values becomes a major bottleneck as dataset volumes grow into millions and billions of rows. Interactive analytics requires answers within milliseconds, yet exact `COUNT DISTINCT` computations demand full table scans and memory-heavy hash tables.

AQE resolves this bottleneck by maintaining compact probabilistic sketches in a normalized relational database. The system:
- Persists datasets, columns, query requests, sketch metadata, and execution measurements.
- Enables configurable precision $p$ where accuracy trades off against register size ($m = 2^p$).
- Records precision, estimated cardinality, optional exact benchmark ground-truth, observed error, and execution latency.
- Provides SQL-based analytical views for evaluating the speed–accuracy trade-off.

---

## 4. Objectives
1. **Database-Backed AQP Workflow**: Implement a complete relational approximate query processing pipeline centered on distinct-cardinality estimation using HyperLogLog sketches.
2. **Normalized Persistence**: Store datasets, columns, queries, sketch metadata, registers, results, and execution measurements in a 3NF normalized schema.
3. **Fast Interactive Execution**: Achieve sub-second query responses by utilizing compact sketch state rather than full table scans.
4. **Benchmark & Accuracy Evaluation**: Record precision $p$, estimated cardinality, exact benchmark cardinality, observed error %, latency (ms), and memory footprint.
5. **Workload & Lineage Analytics**: Provide SQL views for evaluating query workloads, sketch utilization, and merge operations.

---

## 5. Scope of the Project

### 5.1 In-Scope
- Approximate query processing with distinct cardinality estimation as the primary operation.
- HyperLogLog-based sketch metadata and register-state management.
- Dataset and column catalog.
- Approximate `COUNT DISTINCT` registration, predicate filtering, grouping metadata, and execution history.
- Configurable sketch precision $p$ ($4 \le p \le 18$) and $m = 2^p$.
- Relational storage of dense HLL registers in PostgreSQL, with support for sparse and dense representations.
- Sketch merging via register-wise maximum and merge lineage tracking.
- Persistence of approximate results and execution benchmarks.
- SQL-based analytical evaluation (queries per dataset, precision comparisons, error curves).
- Relational keys, constraints, indexes, 3NF normalization, and transactional consistency.

### 5.2 Out-of-Scope
- Full replacement of an enterprise cost-based SQL query optimizer.
- Arbitrary relational algebra operators (e.g. multi-way theta joins).
- Machine-learning-based cardinality estimators.
- Distributed cluster orchestration across multiple physical machines.

---

## 6. Requirement Analysis

### 6.1 Data Storage Requirements

| Data Category | Information Stored | Purpose in AQE |
| :--- | :--- | :--- |
| **Users** | user_id, full_name, email, role, created_at | Query ownership and access control |
| **Datasets** | dataset_id, dataset_name, source_uri, format, row_count, status, created_at | Identify input data sources |
| **Columns** | column_id, dataset_id, column_name, data_type, ordinal_position, is_nullable | Target, filter, and grouping column catalog |
| **Query Requests** | query_id, user_id, target_column_id, operation, query_text, precision_p, register_count, status, created_at | Persist submitted analytical requests |
| **Query Filters** | filter_id, query_id, column_id, operator, value_text, position | Normalized WHERE predicates (1NF) |
| **Query Groupings** | grouping_id, query_id, column_id, position | Normalized GROUP BY columns (1NF) |
| **HLL Sketches** | sketch_id, column_id, precision_p, register_count, algorithm_version, hash_version, representation, build_timestamp, is_current | Identify compatible sketch state |
| **HLL Registers** | sketch_id, register_index, register_value | Relational dense HLL state (2NF composite key) |
| **Sketch Merges** | merge_id, target_sketch_id, source_sketch_id, merged_at | Merge lineage for partitioned/parallel processing |
| **Query Results** | result_id, query_id, sketch_id, estimated_cardinality, relative_error_target, exact_cardinality, error_percent, generated_at | Persist approximate answers and error measurements |
| **Execution Metrics**| execution_id, query_id, start_time, end_time, latency_ms, rows_processed, memory_bytes, merge_count, exact_comparison_run | Benchmark system speedup and memory usage |

---

## 7. Database Selection & Justification

### 7.1 Selected Technology
**PostgreSQL** (with seamless SQLite fallback for zero-configuration testing).

### 7.2 Database Type
Relational Database Management System (RDBMS).

### 7.3 Justification
- **ACID Transactions**: Keeps query requests, results, and execution measurements completely consistent.
- **Relational Integrity**: Foreign keys model dataset–column, query–filter, query–result, and sketch–register relationships naturally.
- **SQL Aggregation**: Enables fast evaluation of latency, error %, and query workloads via `GROUP BY`, `AVG`, and arithmetic functions.
- **Indexing**: B-Tree indexes accelerate lookups of datasets, columns, sketches, and execution history.
- **Explicit Transparency**: Storing registers relationally in `hll_registers` makes the internal algorithm state completely visible and queryable for database lab education.

---

## 8. Relational Data Model & Schema Design

### 8.1 Relational Schema (3NF)

```text
USERS(user_id PK, full_name, email UNIQUE, role, created_at)

DATASETS(dataset_id PK, dataset_name UNIQUE, source_uri, format, row_count, status, created_at)

COLUMNS(column_id PK, dataset_id FK→DATASETS, column_name, data_type, ordinal_position, is_nullable, UNIQUE(dataset_id, column_name))

QUERY_REQUESTS(query_id PK, user_id FK→USERS, target_column_id FK→COLUMNS, operation, query_text, precision_p, register_count, status, created_at)

QUERY_FILTERS(filter_id PK, query_id FK→QUERY_REQUESTS, column_id FK→COLUMNS, operator, value_text, position)

QUERY_GROUPINGS(grouping_id PK, query_id FK→QUERY_REQUESTS, column_id FK→COLUMNS, position, UNIQUE(query_id, column_id))

HLL_SKETCHES(sketch_id PK, column_id FK→COLUMNS, precision_p, register_count, algorithm_version, hash_version, representation, build_timestamp, is_current)

HLL_REGISTERS(sketch_id PK/FK→HLL_SKETCHES, register_index PK, register_value)

SKETCH_MERGES(merge_id PK, target_sketch_id FK→HLL_SKETCHES, source_sketch_id FK→HLL_SKETCHES, merged_at)

QUERY_RESULTS(result_id PK, query_id UNIQUE/FK→QUERY_REQUESTS, sketch_id FK→HLL_SKETCHES, estimated_cardinality, relative_error_target, exact_cardinality, error_percent, generated_at)

EXECUTION_METRICS(execution_id PK, query_id FK→QUERY_REQUESTS, start_time, end_time, latency_ms, rows_processed, memory_bytes, merge_count, exact_comparison_run)
```

### 8.2 Normalization Proof

- **First Normal Form (1NF)**: All attributes are atomic. Query filters and groupings are discrete relational rows in child tables (`query_filters`, `query_groupings`), never comma-separated strings.
- **Second Normal Form (2NF)**: Non-key attributes are fully functionally dependent on the complete primary key. In `hll_registers`, `register_value` depends on both `sketch_id` and `register_index`.
- **Third Normal Form (3NF)**: No transitive functional dependencies. `dataset_id` is only stored in `columns`. In `query_requests` and `hll_sketches`, the dataset is obtained via foreign key reference to `columns(column_id)`, eliminating transitive redundancy.

---

## 9. System Architecture & Workflow

```text
USER / ANALYST
      │
      ▼
FRONTEND (React + Vite Console)
      │
      ▼
API LAYER (FastAPI) ──────────────────► PostgreSQL / Database Catalog
      │                                (Metadata, Queries, Sketches,
      ▼                                 Registers, Results, Metrics)
AQE ENGINE
(64-bit Hash → Register Update → HLL Estimate)
      │
      ▼
DATA SOURCE (NYC Taxi Yellow Cab Trips)
      │
      └───────────────────────────────► APPROXIMATE RESULT + BENCHMARK METRICS
```

---

## 10. References & Source Basis
1. **Heule, S., Nunkesser, M., & Hall, A. (2013).** *HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm.* Proceedings of the 16th International Conference on Extending Database Technology (EDBT 2013), Genoa, Italy. [Paper Link](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/40671.pdf)
2. **Flajolet, P., Fusy, É., Gandouet, O., & Meunier, F. (2007).** *HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm.* AOFA 2007.
