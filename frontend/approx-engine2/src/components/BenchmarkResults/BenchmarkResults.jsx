export default function BenchmarkResults({ result }) {
  if (!result) return null;

  const speedup = result.speedup != null ? `${result.speedup}x` : "—";
  const approxTime = result.approx_time_ms != null ? `${result.approx_time_ms.toFixed(2)} ms` : "—";
  const exactTime = result.exact_time_ms != null ? `${result.exact_time_ms.toFixed(2)} ms` : "Not evaluated";
  const errorPct = typeof result.error_pct === "number" ? result.error_pct : null;
  const theoretical = result.theoretical_error ? (result.theoretical_error * 100).toFixed(2) : null;

  const errorColor = errorPct == null ? "#94a3b8" : errorPct <= 3.0 ? "#16a34a" : errorPct <= 6.0 ? "#0284c7" : "#d97706";

  return (
    <section style={{ marginBottom: "16px" }}>
      {/* Title bar with execution ID */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "8px",
        borderBottom: "1px solid #1e293b",
        marginBottom: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>
            Execution Metrics
          </span>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Query Execution #{result.query_id} (PostgreSQL Transaction committed)
          </span>
        </div>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#94a3b8" }}>
          Rows: {result.rows_processed?.toLocaleString() || "100,000"}
        </div>
      </div>

      {/* Metric Tiles - Clean & Flat */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {/* Speedup */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Speedup Ratio</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color: "#16a34a", marginTop: "2px" }}>
            {speedup}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>vs exact table scan</div>
        </div>

        {/* Approx Latency */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Approximate Latency</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color: "#f8fafc", marginTop: "2px" }}>
            {approxTime}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>HLL register update</div>
        </div>

        {/* Exact Latency */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Exact Scan Latency</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color: "#94a3b8", marginTop: "2px" }}>
            {exactTime}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>Full table unique scan</div>
        </div>

        {/* Memory Footprint */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Sketch Memory</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color: "#f8fafc", marginTop: "2px" }}>
            {result.memory_bytes ? `${result.memory_bytes} B` : `${result.register_count || 1024} B`}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
            {result.register_count || 1024} dense registers
          </div>
        </div>
      </div>

      {/* Error Margin Row */}
      {errorPct != null && (
        <div style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "4px",
          padding: "10px 12px",
          marginTop: "8px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#94a3b8" }}>
              Estimation Accuracy &amp; Deviation
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Theoretical Target (1.04/√m): <strong style={{ color: "#94a3b8" }}>±{theoretical}%</strong>
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: errorColor,
                background: "#1e293b",
                padding: "1px 6px",
                borderRadius: "3px"
              }}>
                Observed: {errorPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div style={{ background: "#1e293b", height: "4px", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              width: `${Math.min(errorPct * 10, 100)}%`,
              height: "100%",
              background: errorColor,
              borderRadius: "2px"
            }} />
          </div>
        </div>
      )}
    </section>
  );
}
