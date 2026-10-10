import { ExternalLink, Database, GitBranch } from "lucide-react";

export default function ProposalDocs() {
  const entities = [
    { name: "USERS", pk: "user_id", purpose: "Application identity and query authorization (ADMIN, ANALYST, DEVELOPER)" },
    { name: "DATASETS", pk: "dataset_id", purpose: "Input analytical dataset metadata (CSV, Parquet, row count, status)" },
    { name: "COLUMNS", pk: "column_id", purpose: "Schema columns metadata; FK to DATASETS enforces 3NF normalization" },
    { name: "QUERY_REQUESTS", pk: "query_id", purpose: "Submitted approximate queries with configured precision p and m=2^p" },
    { name: "QUERY_FILTERS", pk: "filter_id", purpose: "Normalized WHERE predicates (1NF compliant: separate rows)" },
    { name: "QUERY_GROUPINGS", pk: "grouping_id", purpose: "Normalized GROUP BY columns (1NF compliant: separate rows)" },
    { name: "HLL_SKETCHES", pk: "sketch_id", purpose: "HLL metadata, precision p, algorithm/hash versions, SPARSE/DENSE state" },
    { name: "HLL_REGISTERS", pk: "(sketch_id, register_index)", purpose: "Relational dense register state (2NF composite primary key)" },
    { name: "SKETCH_MERGES", pk: "merge_id", purpose: "Tracks sketch merge operations and lineage for partitioned processing" },
    { name: "QUERY_RESULTS", pk: "result_id", purpose: "Approximate cardinality, theoretical error target, and observed error" },
    { name: "EXECUTION_METRICS", pk: "execution_id", purpose: "Execution latency (ms), rows processed, memory footprint, speedup" },
  ];

  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Document Header */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
            BCSE302P – DATABASE SYSTEMS LAB | ASSESSMENT 6
          </div>
          <h1 style={{ fontSize: "16px", fontWeight: 600, color: "#f8fafc", margin: "0 0 4px" }}>
            AQE – Approximate Query Engine Design Document
          </h1>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            HyperLogLog-Based Relational Platform for Fast Distinct Cardinality Estimation
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <a
            href="https://github.com/aniishkumar/aqe"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "3px",
              padding: "4px 8px",
              color: "#38bdf8",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              textDecoration: "none"
            }}
          >
            <GitBranch size={12} /> aniishkumar/aqe <ExternalLink size={10} />
          </a>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Target Database: PostgreSQL
          </span>
        </div>
      </div>

      {/* Relational Data Model */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px"
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>
          Relational Schema: 11 Normalized Entities (Section 8.1 - 8.3)
        </div>
        <div style={{ overflowX: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
          <table>
            <thead>
              <tr>
                <th>Entity / Table</th>
                <th>Primary Key</th>
                <th>Relational Purpose &amp; Constraints</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.name}>
                  <td className="mono" style={{ fontWeight: 600, color: "#f8fafc" }}>{e.name}</td>
                  <td className="mono" style={{ color: "#38bdf8" }}>{e.pk}</td>
                  <td style={{ color: "#94a3b8" }}>{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Normalization Proofs */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px"
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", marginBottom: "10px" }}>
          Normalization Proof (Section 8.6)
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "10px", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc", marginBottom: "4px" }}>
              First Normal Form (1NF)
            </div>
            <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
              <li>All attributes contain atomic values.</li>
              <li>WHERE predicates stored as separate rows in <code>QUERY_FILTERS</code>.</li>
              <li>GROUP BY columns stored as rows in <code>QUERY_GROUPINGS</code>.</li>
            </ul>
          </div>

          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "10px", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc", marginBottom: "4px" }}>
              Second Normal Form (2NF)
            </div>
            <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
              <li>Non-key attributes depend on complete primary keys.</li>
              <li><code>HLL_REGISTERS.register_value</code> strictly depends on composite key <code>(sketch_id, register_index)</code>.</li>
              <li>Merge lineage tracked in separate <code>SKETCH_MERGES</code> relation.</li>
            </ul>
          </div>

          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "10px", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc", marginBottom: "4px" }}>
              Third Normal Form (3NF)
            </div>
            <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
              <li>No transitive functional dependencies.</li>
              <li><code>dataset_id</code> stored exclusively in <code>COLUMNS</code>. Associated dataset for queries is obtained via target column FK.</li>
              <li>Metrics separated from query requests.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Relational ER Diagram */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px"
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>
          Relational ER Diagram (Section 8.8)
        </div>
        <pre style={{
          background: "#0b0f19",
          border: "1px solid #1e293b",
          borderRadius: "3px",
          padding: "10px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#94a3b8",
          lineHeight: 1.4,
          overflowX: "auto"
        }}>
{`
[USERS] (1) ───<submits>───> (N) [QUERY_REQUESTS] (1) ───<generates>───> (1) [QUERY_RESULTS]
                                    │               │
                                    │ (1)           │ (1)
                                    ▼ (N)           ▼ (N)
                             [QUERY_FILTERS]  [EXECUTION_METRICS]
                                    │
                                    │ (N:1)
                                    ▼
[DATASETS] (1) ───<contains>───> (N) [COLUMNS] (1) ───<maintains>───> (N) [HLL_SKETCHES]
                                                                                │
                                                                                │ (1)
                                                                                ▼ (N)
                                                                        [HLL_REGISTERS]
                                                                                │
                                                                                ▼ (M:N)
                                                                        [SKETCH_MERGES]
`}
        </pre>
      </div>

      {/* Reference Paper Mapping */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px"
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", marginBottom: "4px" }}>
          Reference Paper Implementation Mapping (Section 8.10)
        </div>
        <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px" }}>
          Heule, S., Nunkesser, M., &amp; Hall, A. (2013). <em>HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm</em>. EDBT 2013 (Google PowerDrill).
        </p>

        <div style={{ border: "1px solid #1e293b", borderRadius: "3px", overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Paper Algorithm Concept</th>
                <th>AQE Relational Implementation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { concept: "Distinct Cardinality Estimation", aqe: "QUERY_RESULTS.estimated_cardinality" },
                { concept: "Precision p & Register Count m=2^p", aqe: "HLL_SKETCHES.precision_p + register_count" },
                { concept: "Substream Registers State", aqe: "HLL_REGISTERS(sketch_id, register_index)" },
                { concept: "Small Cardinality Handling", aqe: "representation = SPARSE / DENSE + LinearCounting" },
                { concept: "Harmonic Mean Alpha Bias Correction", aqe: "ALGORITHM_VERSION (alpha_16, 32, 64, m>=128)" },
                { concept: "Sketch Mergeability & Distributed Stream", aqe: "SKETCH_MERGES table (register-wise max)" },
                { concept: "Accuracy & Theoretical Bound 1.04/√m", aqe: "relative_error_target + error_percent" },
                { concept: "Memory Footprint & Performance", aqe: "EXECUTION_METRICS (latency_ms, memory_bytes)" }
              ].map((item, i) => (
                <tr key={i}>
                  <td>{item.concept}</td>
                  <td className="mono" style={{ color: "#38bdf8" }}>{item.aqe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
