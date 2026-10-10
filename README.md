# AQE – Approximate Query Engine
### A HyperLogLog-Based Relational Platform for Fast Cardinality Estimation and Approximate Analytical Query Processing

[![Course](https://img.shields.io/badge/Course-BCSE302P%20Database%20Systems%20Lab-purple.svg)](https://github.com/aniishkumar/aqe)
[![Assessment](https://img.shields.io/badge/Assessment-Assessment%206%20(10%20Marks)-blue.svg)](https://github.com/aniishkumar/aqe)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![Algorithm](https://img.shields.io/badge/Algorithm-HyperLogLog%20(Heule%20et%20al.%202013)-10b981.svg)](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/40671.pdf)
[![Tests](https://img.shields.io/badge/Tests-PyTest%20Passing-brightgreen.svg)](https://github.com/aniishkumar/aqe)

---

## 📌 Executive Summary
**AQE (Approximate Query Engine)** is a database-backed relational platform designed to trade a controlled amount of accuracy for substantially faster analytical processing. Distinct cardinality estimation (`COUNT DISTINCT`) over massive datasets is typically bounded by expensive full table scans and memory-heavy hash tables. 

AQE solves this challenge by implementing an engineered **HyperLogLog (HLL++)** engine with persistent relational control, lineage tracking, and benchmark evaluation in **PostgreSQL**.

- **Paper Basis**: *HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm* (Stefan Heule, Marc Nunkesser, Alex Hall — Google PowerDrill, EDBT 2013).
- **Relational Schema**: 11 tables normalized to **Third Normal Form (3NF)** with explicit foreign keys, check constraints, and composite indexes.
- **Frontend Console**: Interactive web application featuring live speedup benchmarks, an HLL register visualizer, a sketch merge laboratory, and SQL analytical views.

---

## 🏗️ System Architecture

```text
               +-------------------------------------------+
               |             USER / ANALYST                |
               +-------------------------------------------+
                                     |
                                     v
               +-------------------------------------------+
               |     FRONTEND CONSOLE (React + Vite)       |
               +-------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         API LAYER (FastAPI)                             |
|  * /query              * /sketches/build        * /analytics/workload   |
|  * /sketches/merge     * /sketches/{id}/regs    * /analytics/accuracy   |
+-------------------------------------------------------------------------+
             |                                              |
             v                                              v
+--------------------------+              +-------------------------------+
|      AQE CORE ENGINE     |              |     PostgreSQL RELATIONAL DB  |
|  * 64-bit C Hashing      |              |  * users           * columns  |
|  * Substream Partitioning|              |  * datasets        * requests |
|  * Harmonic Mean Est     |<------------>|  * hll_sketches    * registers|
|  * Linear Counting Small |              |  * query_filters   * groupings|
|  * Sketch Merging (Max)  |              |  * sketch_merges   * results  |
+--------------------------+              |  * execution_metrics          |
             |                            +-------------------------------+
             v
+--------------------------+
|  DATA SOURCE (NYC Taxi)  |
+--------------------------+
```

---

## 📊 Relational Database Design (3NF)

AQE maintains 11 normalized tables in PostgreSQL:

| Entity | Primary Key | Description & Function in AQE |
| :--- | :--- | :--- |
| **`users`** | `user_id` | Application identities and query owners (`ADMIN`, `ANALYST`, `DEVELOPER`). |
| **`datasets`** | `dataset_id` | Input analytical dataset catalog (`row_count`, format, status). |
| **`columns`** | `column_id` | Schema columns; foreign key to `datasets` guarantees 3NF normalization. |
| **`query_requests`** | `query_id` | Analytical query definitions with precision $p$ and $m = 2^p$ register count. |
| **`query_filters`** | `filter_id` | Normalized `WHERE` predicates (1NF compliant: atomic rows). |
| **`query_groupings`** | `grouping_id` | Normalized `GROUP BY` columns (1NF compliant: atomic rows). |
| **`hll_sketches`** | `sketch_id` | Active and historical HLL sketches ($p$, $m$, algorithm version, representation). |
| **`hll_registers`** | `(sketch_id, register_index)` | Relational dense register values (2NF composite primary key). |
| **`sketch_merges`** | `merge_id` | Merge lineage log for parallel/partitioned sketch aggregations. |
| **`query_results`** | `result_id` | Approximate answers, theoretical error targets, exact benchmark counts, and error %. |
| **`execution_metrics`** | `execution_id` | Latency (ms), rows processed, memory footprint, speedup factor. |

### 3NF Normalization Guarantee
- **1NF**: All attributes are atomic. Filters and groupings are discrete rows, not comma-separated lists.
- **2NF**: In `hll_registers`, `register_value` strictly depends on the full composite key `(sketch_id, register_index)`.
- **3NF**: `dataset_id` is stored exclusively in `columns`. In `query_requests` and `hll_sketches`, the dataset is resolved via foreign key to `columns(column_id)`, eliminating transitive redundancy.

---

## ⚡ Algorithmic Engineering (Heule et al. 2013)

1. **Configurable Precision ($p$)**:
   - $m = 2^p$ registers (e.g., $p=10 \Rightarrow 1,024$ registers; $p=14 \Rightarrow 16,384$ registers).
   - Theoretical standard error: $\sigma = \frac{1.04}{\sqrt{m}}$.
2. **Vectorized 64-bit Hashing**:
   - Extracts substream index $j = \text{hash} \ \& \ (m - 1)$.
   - Computes leading zero count $\rho(w) = \text{clz}(w) + 1$.
   - Updates registers using in-place maximum reduction: $M[j] = \max(M[j], \rho(w))$.
3. **Normalized Estimator**:
   $$E = \alpha_m \cdot m^2 \cdot \left(\sum_{j=0}^{m-1} 2^{-M[j]}\right)^{-1}$$
   - Bias correction factors $\alpha_m$: $0.673$ ($m=16$), $0.697$ ($m=32$), $0.709$ ($m=64$), $\frac{0.7213}{1 + 1.079/m}$ ($m \ge 128$).
4. **Small Cardinality Correction (Linear Counting)**:
   - When raw estimate $E \le 2.5m$, uses zero register count $V$: $E^* = m \cdot \ln(m / V)$.
5. **Sketch Merging**:
   - Merges two sketches losslessly via register-wise maximum: $M_{\text{merged}}[j] = \max(M_1[j], M_2[j])$.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL (or automated SQLite fallback for local developer testing)

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/aniishkumar/aqe.git
cd aqe

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Set your PostgreSQL connection string:
# export AQE_DATABASE_URL="postgresql://postgres:password@localhost:5432/aqe_db"

# Initialize database schema and generate sample taxi dataset
python database/db_session.py

# Run tests
pytest tests/test_aqe.py -v

# Start FastAPI server
uvicorn api.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend/approx-engine2
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Benchmark Results

Tested on 100,000 NYC Taxi Trip records (`fare_amount` distinct estimation):

| Precision ($p$) | Registers ($m$) | Memory | Theoretical Error | Observed Error | Speedup |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **$p = 8$** | 256 | 256 B | $\pm 6.50\%$ | **$2.41\%$** | **$16.8\times$** |
| **$p = 10$** | 1,024 | 1.0 KB | $\pm 3.25\%$ | **$1.85\%$** | **$14.2\times$** |
| **$p = 12$** | 4,096 | 4.0 KB | $\pm 1.62\%$ | **$0.94\%$** | **$11.5\times$** |
| **$p = 14$** | 16,384 | 16.0 KB | $\pm 0.81\%$ | **$0.42\%$** | **$8.9\times$** |

---

## 📖 Lab Documentation & Deliverables
- Complete Project Proposal Document: [`docs/PROJECT_PROPOSAL_BCSE302P.md`](docs/PROJECT_PROPOSAL_BCSE302P.md)
- PostgreSQL DDL Script: [`database/schema.sql`](database/schema.sql)
- PostgreSQL Seed Data: [`database/seed.sql`](database/seed.sql)
- Section 8.9 SQL Analytical Queries: [`database/queries.sql`](database/queries.sql)
- Test Suite: [`tests/test_aqe.py`](tests/test_aqe.py)
