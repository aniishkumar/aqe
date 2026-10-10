import { ExternalLink, Database, GitBranch, FileText } from "lucide-react";

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
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", maxWidth: 1080, margin: "0 auto", background: "var(--bg-page)", minHeight: "calc(100vh - 48px)" }}>
      {/* Document Header */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{
            padding: "6px 10px",
            border: "1px solid var(--accent-orange)",
            background: "var(--bg-page)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Database size={20} color="var(--accent-orange)" strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="pixel-tag">BCSE302P ASSESSMENT 6</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>DATABASE SYSTEMS LAB</span>
            </div>
            <h1 style={{ fontSize: "15px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", letterSpacing: "0.05em", margin: "0 0 4px", textTransform: "uppercase" }}>
              AQE &ndash; Approximate Query Engine Specification
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              HyperLogLog-Based Relational Platform for Fast Distinct Cardinality Estimation (PostgreSQL)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <a
            href="https://github.com/aniishkumar/aqe"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg-page)",
              border: "1px solid var(--accent-orange)",
              padding: "5px 10px",
              color: "var(--accent-orange)",
              fontFamily: "var(--font-pixel)",
              fontSize: "10px",
              textDecoration: "none",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}
          >
            <GitBranch size={12} /> REPO: aniishkumar/aqe <ExternalLink size={10} />
          </a>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
            TARGET RDBMS: <strong style={{ color: "var(--star)" }}>PostgreSQL 16</strong>
          </span>
        </div>
      </div>

      {/* Relational Data Model */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span className="pixel-tag">RELATIONAL SCHEMA</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
            11 Normalized Entities (Lab Document Section 8.1 &ndash; 8.3)
          </span>
        </div>
        <div style={{ overflowX: "auto", border: "var(--border)" }}>
          <table>
            <thead>
              <tr>
                <th>RELATION / TABLE</th>
                <th>PRIMARY KEY</th>
                <th>RELATIONAL PURPOSE &amp; CONSTRAINTS</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.name}>
                  <td style={{ fontWeight: 700, color: "var(--accent-orange)" }}>{e.name}</td>
                  <td style={{ color: "var(--star)" }}>{e.pk}</td>
                  <td style={{ color: "var(--text-primary)" }}>{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Normalization Proofs */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span className="pixel-tag">NORMALIZATION PROOFS</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
            Section 8.6 Mathematical Relational Integrity
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          <div style={{ background: "var(--bg-page)", border: "var(--border)", padding: "12px" }}>
            <div style={{ fontSize: "10px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", letterSpacing: "0.05em", marginBottom: "6px" }}>
              FIRST NORMAL FORM (1NF)
            </div>
            <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li>All attributes contain strictly atomic scalar values.</li>
              <li>WHERE predicates stored as distinct rows in <code style={{ color: "var(--star)" }}>QUERY_FILTERS</code>.</li>
              <li>GROUP BY columns stored as rows in <code style={{ color: "var(--star)" }}>QUERY_GROUPINGS</code>.</li>
            </ul>
          </div>

          <div style={{ background: "var(--bg-page)", border: "var(--border)", padding: "12px" }}>
            <div style={{ fontSize: "10px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", letterSpacing: "0.05em", marginBottom: "6px" }}>
              SECOND NORMAL FORM (2NF)
            </div>
            <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li>Non-key attributes depend on complete primary keys.</li>
              <li><code style={{ color: "var(--star)" }}>HLL_REGISTERS.register_value</code> strictly depends on composite key <code style={{ color: "var(--star)" }}>(sketch_id, register_index)</code>.</li>
              <li>Lineage tracked separately in <code style={{ color: "var(--star)" }}>SKETCH_MERGES</code>.</li>
            </ul>
          </div>

          <div style={{ background: "var(--bg-page)", border: "var(--border)", padding: "12px" }}>
            <div style={{ fontSize: "10px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", letterSpacing: "0.05em", marginBottom: "6px" }}>
              THIRD NORMAL FORM (3NF)
            </div>
            <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <li>No transitive functional dependencies exist.</li>
              <li><code style={{ color: "var(--star)" }}>dataset_id</code> stored exclusively in <code style={{ color: "var(--star)" }}>COLUMNS</code>. Associated dataset obtained via target column FK.</li>
              <li>Execution metrics fully decoupled from requests.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Relational ER Diagram */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span className="pixel-tag">RELATIONAL ER TOPOLOGY</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
            ASCII Entity-Relationship Diagram (Section 8.8)
          </span>
        </div>
        <pre style={{
          background: "var(--bg-page)",
          border: "var(--border)",
          padding: "12px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          color: "var(--accent-orange)",
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
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span className="pixel-tag">ALGORITHM MAPPING</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
            Google PowerDrill HLL in Practice (Heule et al., EDBT 2013)
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 10px" }}>
          Heule, S., Nunkesser, M., &amp; Hall, A. (2013). <em>HyperLogLog in Practice: Algorithmic Engineering of a State of the Art Cardinality Estimation Algorithm</em>. EDBT 2013.
        </p>

        <div style={{ border: "var(--border)", overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>PAPER ALGORITHM CONCEPT</th>
                <th>AQE RELATIONAL IMPLEMENTATION</th>
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
                  <td style={{ color: "var(--text-primary)" }}>{item.concept}</td>
                  <td style={{ color: "var(--star)", fontWeight: 600 }}>{item.aqe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
