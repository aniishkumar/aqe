import { useEffect, useState } from "react";
import { getWorkloadAnalytics, getAccuracyAnalytics, getPrecisionSweep, getQueryHistory } from "../../api";
import { RefreshCw, Activity, Terminal } from "lucide-react";

export default function AnalyticsDashboard() {
  const [workload, setWorkload] = useState([]);
  const [accuracy, setAccuracy] = useState([]);
  const [sweep, setSweep] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingSweep, setLoadingSweep] = useState(false);
  const [sweepCol, setSweepCol] = useState("fare_amount");

  const loadData = () => {
    getWorkloadAnalytics().then(setWorkload).catch(console.error);
    getAccuracyAnalytics().then(setAccuracy).catch(console.error);
    getQueryHistory().then(setHistory).catch(console.error);
  };

  const runSweep = (col) => {
    setLoadingSweep(true);
    getPrecisionSweep(col)
      .then(setSweep)
      .catch(console.error)
      .finally(() => setLoadingSweep(false));
  };

  useEffect(() => {
    loadData();
    runSweep(sweepCol);
  }, []);

  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", background: "var(--bg-page)", minHeight: "calc(100vh - 48px)" }}>
      {/* Title Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "var(--border)",
        paddingBottom: "10px",
        flexWrap: "wrap",
        gap: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "4px 8px",
            border: "1px solid var(--accent-orange)",
            background: "var(--bg-page)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Activity size={16} color="var(--accent-orange)" strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{
                fontSize: "13px",
                fontFamily: "var(--font-pixel)",
                color: "var(--accent-orange)",
                letterSpacing: "0.05em",
                margin: 0,
                textTransform: "uppercase"
              }}>
                Workload Analytics &amp; Precision Evaluation
              </h2>
              <span className="pixel-tag">BCSE302P SECTION 8.9</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              HyperLogLog speedup vs standard deviation convergence across variable register granularities.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--bg-panel)",
            border: "1px solid var(--accent-orange)",
            color: "var(--accent-orange)",
            fontFamily: "var(--font-pixel)",
            fontSize: "10px",
            padding: "5px 10px",
            cursor: "pointer",
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}
        >
          <RefreshCw size={11} /> REFRESH METRICS
        </button>
      </div>

      {/* Section 8.9 Query 5: Precision Sweep */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pixel-tag">PRECISION SWEEP</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
              p &isin; [8, 16] &bull; Speedup vs Error convergence evaluation
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "9px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", textTransform: "uppercase" }}>
              TARGET COLUMN:
            </span>
            <select
              value={sweepCol}
              onChange={(e) => {
                setSweepCol(e.target.value);
                runSweep(e.target.value);
              }}
              style={{ padding: "4px 8px", background: "var(--bg-page)", border: "var(--border)" }}
            >
              <option value="fare_amount">fare_amount</option>
              <option value="trip_distance">trip_distance</option>
              <option value="total_amount">total_amount</option>
              <option value="pickup_datetime">pickup_datetime</option>
            </select>
          </div>
        </div>

        {loadingSweep ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--accent-orange)", fontSize: "12px", fontFamily: "var(--font-pixel)" }}>
            [COMPUTING PRECISION SWEEPS...]
          </div>
        ) : sweep?.sweep ? (
          <div style={{ overflowX: "auto", border: "var(--border)" }}>
            <table>
              <thead>
                <tr>
                  <th>PRECISION (p)</th>
                  <th>REGISTERS (m=2^p)</th>
                  <th style={{ textAlign: "right" }}>THEORETICAL STD ERR</th>
                  <th style={{ textAlign: "right" }}>OBSERVED ERROR</th>
                  <th style={{ textAlign: "right" }}>ESTIMATED COUNT</th>
                  <th style={{ textAlign: "right" }}>LATENCY</th>
                  <th style={{ textAlign: "right" }}>SPEEDUP</th>
                </tr>
              </thead>
              <tbody>
                {sweep.sweep.map((row) => (
                  <tr key={row.p}>
                    <td style={{ color: "var(--accent-orange)", fontWeight: 700 }}>p = {row.p}</td>
                    <td style={{ color: "var(--text-muted)" }}>{row.register_count.toLocaleString()} B</td>
                    <td style={{ textAlign: "right", color: "var(--star)" }}>&plusmn;{row.theoretical_error_pct}%</td>
                    <td style={{
                      textAlign: "right",
                      color: row.observed_error_pct < 3 ? "var(--up)" : "var(--down)",
                      fontWeight: 700
                    }}>
                      {row.observed_error_pct < 3 ? "▲ " : "▼ "}{row.observed_error_pct.toFixed(2)}%
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "15px" }}>
                      {row.estimated_cardinality.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{row.latency_ms} ms</td>
                    <td style={{
                      textAlign: "right",
                      color: row.speedup >= 1.0 ? "var(--up)" : "var(--down)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "16px",
                      fontWeight: 700
                    }}>
                      {row.speedup >= 1.0 ? "▲ " : "▼ "}{row.speedup}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{
              padding: "8px 12px",
              fontSize: "12px",
              color: "var(--text-muted)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-panel-alt)",
              borderTop: "var(--border)"
            }}>
              <span>GROUND TRUTH BENCHMARK</span>
              <span>
                EXACT DISTINCT COUNT: <strong style={{ color: "var(--accent-orange)", fontFamily: "var(--font-mono)", fontSize: "16px" }}>{sweep.exact_cardinality?.toLocaleString()}</strong>
                <span style={{ marginLeft: "12px", color: "var(--text-muted)" }}>({sweep.exact_time_ms?.toFixed(2)} ms)</span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Grid: Workload (Query 2) & Accuracy (Query 3) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Workload */}
        <div style={{ background: "var(--bg-panel)", border: "var(--border)", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span className="pixel-tag">DATASET WORKLOAD</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>SQL QUERY 2</span>
          </div>
          <div style={{ border: "var(--border)", overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>DATASET</th>
                  <th style={{ textAlign: "right" }}>QUERIES</th>
                  <th style={{ textAlign: "right" }}>AVG LATENCY</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((w) => (
                  <tr key={w.dataset_id}>
                    <td style={{ color: "var(--text-primary)" }}>{w.dataset_name}</td>
                    <td style={{ textAlign: "right", color: "var(--accent-orange)", fontFamily: "var(--font-mono)", fontSize: "16px" }}>{w.query_count}</td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{w.avg_latency_ms.toFixed(2)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historical Accuracy */}
        <div style={{ background: "var(--bg-panel)", border: "var(--border)", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span className="pixel-tag">HISTORICAL ACCURACY</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>SQL QUERY 3</span>
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto", border: "var(--border)" }}>
            <table>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr>
                  <th>QID</th>
                  <th>P</th>
                  <th style={{ textAlign: "right" }}>EXACT</th>
                  <th style={{ textAlign: "right" }}>APPROX</th>
                  <th style={{ textAlign: "right" }}>ERROR</th>
                </tr>
              </thead>
              <tbody>
                {accuracy.map((a) => (
                  <tr key={a.query_id}>
                    <td style={{ color: "var(--accent-orange)", fontWeight: 700 }}>#{a.query_id}</td>
                    <td style={{ color: "var(--text-muted)" }}>p={a.precision_p}</td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{a.exact_cardinality?.toLocaleString()}</td>
                    <td style={{ textAlign: "right", color: "var(--text-primary)" }}>{a.estimated_cardinality?.toLocaleString()}</td>
                    <td style={{
                      textAlign: "right",
                      color: a.error_percent < 3 ? "var(--up)" : "var(--down)",
                      fontWeight: 700
                    }}>
                      {a.error_percent < 3 ? "▲ " : "▼ "}{a.error_percent?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Query Request History Table */}
      <div style={{ background: "var(--bg-panel)", border: "var(--border)", padding: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pixel-tag">QUERY REQUESTS CATALOG</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
              PostgreSQL Relation: query_requests
            </span>
          </div>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent-orange)" }}>
            [{history.length} ENTRIES]
          </span>
        </div>
        <div style={{ overflowX: "auto", border: "var(--border)" }}>
          <table>
            <thead>
              <tr>
                <th>QUERY_ID</th>
                <th>USER</th>
                <th>OPERATION</th>
                <th>TARGET_COLUMN</th>
                <th style={{ textAlign: "right" }}>ESTIMATE</th>
                <th style={{ textAlign: "right" }}>LATENCY</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.query_id}>
                  <td style={{ color: "var(--accent-orange)", fontWeight: 700 }}>#{h.query_id}</td>
                  <td style={{ color: "var(--text-muted)" }}>{h.user}</td>
                  <td style={{ color: "var(--star)" }}>{h.operation}</td>
                  <td style={{ color: "var(--text-primary)" }}>{h.target_column}</td>
                  <td style={{ textAlign: "right", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "15px" }}>
                    {h.estimated_cardinality?.toLocaleString() || "—"}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                    {h.latency_ms != null ? `${h.latency_ms.toFixed(2)} ms` : "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      background: h.status === "COMPLETED" ? "rgba(46, 230, 46, 0.12)" : "rgba(255, 59, 59, 0.12)",
                      color: h.status === "COMPLETED" ? "var(--up)" : "var(--down)",
                      fontSize: "9px",
                      fontFamily: "var(--font-pixel)",
                      padding: "2px 6px",
                      border: "1px solid " + (h.status === "COMPLETED" ? "var(--up)" : "var(--down)")
                    }}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
