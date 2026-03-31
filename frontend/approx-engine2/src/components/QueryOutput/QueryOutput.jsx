export default function QueryOutput({ result, queryParams }) {
  if (!result) return null;

  const exactVal = result.exact_result;
  const approxVal = result.approx_result;
  const approxTime = result.approx_time_ms != null ? `${result.approx_time_ms.toFixed(2)}ms` : null;
  const sqlLabel = queryParams
    ? `SELECT ${queryParams.query_type}(${queryParams.column})${queryParams.group_by ? ` GROUP BY ${queryParams.group_by}` : ""}`
    : null;
  const fmt = (v) => v == null ? "—" : typeof v === "number" ? v.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(v);

  return (
    <section style={{ background: "#151515", border: "1px solid #222", borderRadius: 14, padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Query Output</h2>
        {sqlLabel && (
          <code style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, padding: "0.35rem 0.75rem", color: "#888" }}>
            {sqlLabel}
          </code>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "1.5rem" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#666", fontWeight: 700, marginBottom: "0.75rem" }}>EXACT RESULT</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "2.2rem", fontWeight: 700, color: "#e0e0e0", letterSpacing: "-0.03em", lineHeight: 1, wordBreak: "break-all" }}>{fmt(exactVal)}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "#555", marginTop: "0.5rem" }}>100% precision</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #1a1228 100%)", border: "1px solid #7c3aed55", borderRadius: 10, padding: "1.5rem" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#c084fc", fontWeight: 700, marginBottom: "0.75rem" }}>APPROX RESULT</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "2.2rem", fontWeight: 700, color: "#e0e0e0", letterSpacing: "-0.03em", lineHeight: 1, wordBreak: "break-all" }}>{fmt(approxVal)}</div>
          {approxTime && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "#9333ea", marginTop: "0.5rem" }}>Calculated in {approxTime}</div>}
        </div>
      </div>
    </section>
  );
}
