import { Database } from "lucide-react";

export default function QueryOutput({ result }) {
  if (!result) return null;

  const exactVal = result.exact_result;
  const approxVal = result.approx_result;
  const isGrouped = typeof approxVal === "object" && approxVal !== null && !Array.isArray(approxVal);

  const fmt = (v) => {
    if (v == null) return "—";
    if (typeof v === "number") {
      return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return String(v);
  };

  return (
    <section style={{
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "4px",
      padding: "14px",
      marginBottom: "16px"
    }}>
      {/* SQL Statement Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
          Query Output
        </span>

        {result.query_text && (
          <code style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            background: "#0b0f19",
            border: "1px solid #1e293b",
            borderRadius: "3px",
            padding: "4px 8px",
            color: "#94a3b8"
          }}>
            {result.query_text}
          </code>
        )}
      </div>

      {/* Main Single Result Comparison */}
      {!isGrouped ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {/* Exact Benchmark */}
          <div style={{
            background: "#0b0f19",
            border: "1px solid #1e293b",
            borderRadius: "4px",
            padding: "12px"
          }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
              Exact Value (Ground Truth)
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "24px",
              fontWeight: 600,
              color: "#f8fafc"
            }}>
              {fmt(exactVal)}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
              {result.exact_time_ms ? `Scanned in ${result.exact_time_ms.toFixed(2)} ms` : "Full table benchmark"}
            </div>
          </div>

          {/* Approximate Estimate */}
          <div style={{
            background: "#0b0f19",
            border: "1px solid #2563eb44",
            borderRadius: "4px",
            padding: "12px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
              <span style={{ fontSize: "11px", color: "#60a5fa" }}>
                Approximate Estimate (AQE)
              </span>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#64748b" }}>
                p = {result.precision_p || 10}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "24px",
              fontWeight: 600,
              color: "#ffffff"
            }}>
              {fmt(approxVal)}
            </div>
            <div style={{ fontSize: "10px", color: "#3b82f6", marginTop: "4px" }}>
              Estimated in {result.approx_time_ms?.toFixed(2)} ms
            </div>
          </div>
        </div>
      ) : (
        /* Grouped Results Table */
        <div style={{ overflowX: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
          <table>
            <thead>
              <tr>
                <th>Group Key</th>
                <th style={{ textAlign: "right" }}>Exact Count</th>
                <th style={{ textAlign: "right" }}>Approx Estimate</th>
                <th style={{ textAlign: "right" }}>Deviation %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(approxVal).map(([grpKey, appCount]) => {
                const exCount = exactVal?.[grpKey];
                const err = exCount ? Math.abs((appCount - exCount) / exCount * 100).toFixed(2) : "—";
                return (
                  <tr key={grpKey}>
                    <td style={{ fontWeight: 500 }}>{grpKey}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#94a3b8" }}>{fmt(exCount)}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#f8fafc", fontWeight: 500 }}>{fmt(appCount)}</td>
                    <td className="mono" style={{ textAlign: "right", color: parseFloat(err) < 4 ? "#16a34a" : "#d97706" }}>
                      {err !== "—" ? `${err}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Relational Persistence Info */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "12px",
        paddingTop: "8px",
        borderTop: "1px solid #1e293b",
        fontSize: "11px",
        color: "#64748b"
      }}>
        <div>
          Persisted: <code>query_requests</code> (id: {result.query_id}) &rarr; <code>query_results</code>
        </div>
        <div>
          Target: <code>{result.column}</code> | Rows Scanned: <code>{result.rows_processed?.toLocaleString() || "100,000"}</code>
        </div>
      </div>
    </section>
  );
}
