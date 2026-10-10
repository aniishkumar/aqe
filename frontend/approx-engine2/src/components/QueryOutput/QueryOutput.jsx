import { Terminal, Database, CheckCircle2, ArrowRight } from "lucide-react";

export default function QueryOutput({ result, queryParams }) {
  if (!result) return null;

  const exactVal = result.exact_result;
  const approxVal = result.approx_result;
  const approxTime = result.approx_time_ms != null ? `${result.approx_time_ms.toFixed(2)}ms` : null;

  const fmt = (v) => {
    if (v == null) return "—";
    if (typeof v === "number") {
      return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return String(v);
  };

  const isGrouped = typeof approxVal === "object" && approxVal !== null && !Array.isArray(approxVal);

  return (
    <section style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 14,
      padding: "1.5rem",
      marginBottom: "2rem"
    }}>
      {/* Header and SQL string */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Terminal size={18} color="#c084fc" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Query Results &amp; Analytical Evaluation
          </h2>
        </div>

        {result.query_text && (
          <code style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            background: "#161726",
            border: "1px solid var(--border-subtle)",
            borderRadius: 6,
            padding: "0.4rem 0.8rem",
            color: "#c084fc",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}>
            <Database size={12} />
            {result.query_text}
          </code>
        )}
      </div>

      {/* Main Single Result Comparison */}
      {!isGrouped ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Exact Value */}
          <div style={{
            background: "#141524",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            padding: "1.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
                EXACT GROUND TRUTH (100%)
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)" }}>
                Full Unique Table Scan
              </span>
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.4rem",
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "-0.03em",
              lineHeight: 1.1
            }}>
              {fmt(exactVal)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.6rem" }}>
              {result.exact_time_ms ? `Computed in ${result.exact_time_ms.toFixed(2)} ms` : "Benchmark evaluation"}
            </div>
          </div>

          {/* Approximate Value */}
          <div style={{
            background: "linear-gradient(135deg, rgba(20, 21, 36, 0.9) 0%, rgba(35, 23, 58, 0.6) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            borderRadius: 10,
            padding: "1.5rem",
            boxShadow: "0 4px 20px rgba(124, 58, 237, 0.12)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "#c084fc", fontWeight: 700 }}>
                APPROXIMATE ESTIMATE (AQE)
              </span>
              <span style={{
                background: "#7c3aed22",
                border: "1px solid #7c3aed55",
                borderRadius: 4,
                padding: "0.1rem 0.45rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                color: "#c084fc"
              }}>
                p = {result.precision_p || 10}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.4rem",
              fontWeight: 700,
              color: "#f3e8ff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1
            }}>
              {fmt(approxVal)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#a855f7", marginTop: "0.6rem" }}>
              {approxTime ? `Calculated in ${approxTime}` : "HyperLogLog Stream Estimation"}
            </div>
          </div>
        </div>
      ) : (
        /* Grouped Results Table */
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            <thead>
              <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>GROUP KEY</th>
                <th style={{ padding: "0.75rem 1rem", color: "#e2e8f0" }}>EXACT CARDINALITY</th>
                <th style={{ padding: "0.75rem 1rem", color: "#c084fc" }}>APPROX ESTIMATE</th>
                <th style={{ padding: "0.75rem 1rem", color: "#38bdf8" }}>OBSERVED ERROR</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(approxVal).map(([grpKey, appCount]) => {
                const exCount = exactVal?.[grpKey];
                const err = exCount ? Math.abs((appCount - exCount) / exCount * 100).toFixed(2) : "—";
                return (
                  <tr key={grpKey} style={{ borderBottom: "1px solid #1c1e30" }}>
                    <td style={{ padding: "0.6rem 1rem", color: "#f1f5f9", fontWeight: 600 }}>{grpKey}</td>
                    <td style={{ padding: "0.6rem 1rem", color: "#94a3b8" }}>{fmt(exCount)}</td>
                    <td style={{ padding: "0.6rem 1rem", color: "#f3e8ff" }}>{fmt(appCount)}</td>
                    <td style={{ padding: "0.6rem 1rem", color: parseFloat(err) < 5 ? "#10b981" : "#f59e0b" }}>
                      {err !== "—" ? `${err}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Relational Persistence Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "1.25rem",
        paddingTop: "1rem",
        borderTop: "1px solid var(--border-subtle)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.68rem",
        color: "var(--text-dim)",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={13} color="#10b981" />
          <span>PostgreSQL Table: <code>query_results</code> (ID: {result.query_id})</span>
        </div>
        <div>
          <span>Target Column ID: <code>{result.column}</code></span> | 
          <span> Rows Scanned: <code>{result.rows_processed?.toLocaleString() || "100,000"}</code></span>
        </div>
      </div>
    </section>
  );
}
