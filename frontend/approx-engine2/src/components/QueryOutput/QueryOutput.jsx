import { Terminal } from "lucide-react";

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
      background: "var(--bg-panel)",
      border: "var(--border)",
      padding: "12px 14px",
      marginBottom: "14px"
    }}>
      {/* SQL Snippet in Black Inset Box */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px"
        }}>
          <span className="pixel-tag">
            QUERY_OUTPUT // SQL_STATEMENT
          </span>
          <span style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
            TARGET_FIELD: {result.column || "fare_amount"}
          </span>
        </div>

        {result.query_text && (
          <div style={{
            background: "var(--bg-page)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "8px 10px",
            fontFamily: "var(--font-code)",
            fontSize: "11px",
            color: "var(--accent-orange)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto"
          }}>
            <span style={{ color: "var(--text-muted)" }}>AQE&gt;</span>
            <span>{result.query_text}</span>
          </div>
        )}
      </div>

      {/* Main Single Result Comparison - Two Navy Panels */}
      {!isGrouped ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {/* Panel 1: Exact Value */}
          <div style={{
            background: "var(--bg-panel-alt)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="pixel-tag" style={{ background: "var(--bg-panel-alt)", color: "var(--text-primary)", border: "var(--border)" }}>
                GROUND_TRUTH // EXACT_COUNT
              </span>
              <span style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
                [FULL_SCAN]
              </span>
            </div>

            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "46px",
              lineHeight: 1,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "0.02em"
            }}>
              {fmt(exactVal)}
            </div>

            <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
              {result.exact_time_ms ? `SCANNED IN ${result.exact_time_ms.toFixed(2)} MS` : "BENCHMARK EVALUATION"}
            </div>
          </div>

          {/* Panel 2: Approximate Estimate */}
          <div style={{
            background: "var(--bg-panel-alt)",
            border: "2px solid var(--accent-orange)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="pixel-tag">
                AQE_ESTIMATE // HLL++
              </span>
              <span style={{ fontFamily: "var(--font-pixel)", fontSize: "9px", color: "var(--accent-orange)" }}>
                [p={result.precision_p || 10} | m={result.register_count || 1024}]
              </span>
            </div>

            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "46px",
              lineHeight: 1,
              fontWeight: 700,
              color: "var(--accent-orange)",
              letterSpacing: "0.02em"
            }}>
              {fmt(approxVal)}
            </div>

            <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--up)" }}>
              CALCULATED IN {result.approx_time_ms?.toFixed(2)} MS
            </div>
          </div>
        </div>
      ) : (
        /* Grouped Results Table */
        <div style={{ border: "var(--border)", overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>GROUP_KEY</th>
                <th style={{ textAlign: "right" }}>EXACT_COUNT</th>
                <th style={{ textAlign: "right" }}>APPROX_ESTIMATE</th>
                <th style={{ textAlign: "right" }}>DEVIATION_%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(approxVal).map(([grpKey, appCount]) => {
                const exCount = exactVal?.[grpKey];
                const err = exCount ? Math.abs((appCount - exCount) / exCount * 100).toFixed(2) : "—";
                return (
                  <tr key={grpKey}>
                    <td style={{ fontFamily: "var(--font-pixel)", fontSize: "9px", color: "var(--accent-orange)" }}>
                      {grpKey}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text-muted)" }}>
                      {fmt(exCount)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text-primary)" }}>
                      {fmt(appCount)}
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: "18px",
                      color: parseFloat(err) < 4 ? "var(--up)" : "var(--down)"
                    }}>
                      {err !== "—" ? `${err}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Retro Status Inset Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "12px",
        paddingTop: "6px",
        borderTop: "var(--border)",
        fontFamily: "var(--font-code)",
        fontSize: "10px",
        color: "var(--text-muted)"
      }}>
        <div>
          [PERSISTED: <code>query_requests(id:{result.query_id})</code> &rarr; <code>query_results</code>]
        </div>
        <div>
          SCANNED: <code>{result.rows_processed?.toLocaleString() || "100,000"}</code> ROWS
        </div>
      </div>
    </section>
  );
}
