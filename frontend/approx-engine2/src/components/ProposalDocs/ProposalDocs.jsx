import { FileText, Database, Shield, BookOpen, ExternalLink, GitBranch, Check } from "lucide-react";

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
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: 1100, margin: "0 auto" }} className="animate-fade-in">
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
        border: "1px solid rgba(168, 85, 247, 0.3)",
        borderRadius: 14,
        padding: "1.75rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{ background: "#7c3aed33", border: "1px solid #7c3aed66", color: "#c084fc", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 700 }}>
              BCSE302P – DATABASE SYSTEMS LAB
            </span>
            <span style={{ background: "#06b6d433", border: "1px solid #06b6d466", color: "#38bdf8", fontFamily: "var(--font-mono)", fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: 4, fontWeight: 700 }}>
              Assessment 6 (10 Marks)
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: "0.2rem 0" }}>
            AQE – Approximate Query Engine
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
            HyperLogLog-Based Relational Platform for Fast Distinct Cardinality Estimation and Analytical Processing
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
          <a
            href="https://github.com/aniishkumar/aqe"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#161726",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              padding: "0.35rem 0.75rem",
              color: "#38bdf8",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              textDecoration: "none"
            }}
          >
            <GitBranch size={13} /> aniishkumar/aqe <ExternalLink size={11} />
          </a>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            Target Database: PostgreSQL (Relational)
          </span>
        </div>
      </div>

      {/* 11 Relational Entities Table */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Database size={18} color="#c084fc" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Relational Data Model &amp; Table Specifications (Section 8.1 - 8.3)
          </h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.65rem 0.8rem", color: "#f1f5f9" }}>ENTITY / TABLE</th>
                <th style={{ padding: "0.65rem 0.8rem", color: "#c084fc" }}>PRIMARY KEY</th>
                <th style={{ padding: "0.65rem 0.8rem", color: "var(--text-muted)" }}>FUNCTION IN AQE SYSTEM</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.name} style={{ borderBottom: "1px solid #1c1e30" }}>
                  <td style={{ padding: "0.65rem 0.8rem", color: "#f8fafc", fontWeight: 700 }}>{e.name}</td>
                  <td style={{ padding: "0.65rem 0.8rem", color: "#c084fc" }}><code>{e.pk}</code></td>
                  <td style={{ padding: "0.65rem 0.8rem", color: "var(--text-muted)" }}>{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3NF Normalization Section */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Shield size={18} color="#10b981" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Normalization Justification (Section 8.6)
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          <div style={{ background: "#161726", padding: "1.2rem", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#38bdf8", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              FIRST NORMAL FORM (1NF)
            </span>
            <ul style={{ paddingLeft: "1.1rem", fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li>All attributes contain atomic values.</li>
              <li>Multiple query predicates stored as discrete rows in <code>QUERY_FILTERS</code>, not strings.</li>
              <li>Multiple <code>GROUP BY</code> columns stored as separate rows in <code>QUERY_GROUPINGS</code>.</li>
            </ul>
          </div>

          <div style={{ background: "#161726", padding: "1.2rem", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#a855f7", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              SECOND NORMAL FORM (2NF)
            </span>
            <ul style={{ paddingLeft: "1.1rem", fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li>Non-key attributes depend on the complete composite primary key.</li>
              <li><code>HLL_REGISTERS.register_value</code> strictly depends on <code>(sketch_id, register_index)</code>.</li>
              <li>Lineage table <code>SKETCH_MERGES</code> separates merge relationships cleanly.</li>
            </ul>
          </div>

          <div style={{ background: "#161726", padding: "1.2rem", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#10b981", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              THIRD NORMAL FORM (3NF)
            </span>
            <ul style={{ paddingLeft: "1.1rem", fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li>No transitive functional dependencies.</li>
              <li><code>dataset_id</code> is only stored in <code>COLUMNS</code>. Associated dataset for queries and sketches is obtained via target column FK.</li>
              <li>Execution metrics separated from query definitions.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Relational ER Diagram Visual */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 1rem" }}>
          Relational Entity-Relationship Diagram (Section 8.8)
        </h3>
        <pre style={{
          background: "#0c0d16",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          padding: "1.2rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "#94a3b8",
          lineHeight: 1.5,
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
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <BookOpen size={18} color="#f59e0b" />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Reference Paper Mapping (Section 8.10)
          </h3>
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Heule, S., Nunkesser, M., &amp; Hall, A. (2013). <em>HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm</em>. EDBT 2013 (Google PowerDrill).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
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
            <div key={i} style={{ background: "#161726", padding: "0.6rem 0.8rem", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#e2e8f0" }}>{item.concept}</span>
              <code style={{ color: "#c084fc", background: "#1c1e30", padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.65rem" }}>
                {item.aqe}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
