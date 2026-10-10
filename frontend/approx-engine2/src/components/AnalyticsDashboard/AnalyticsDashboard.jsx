import { useEffect, useState } from "react";
import { getWorkloadAnalytics, getAccuracyAnalytics, getPrecisionSweep, getQueryHistory } from "../../api";
import { RefreshCw } from "lucide-react";

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
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Title Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
        <div>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", margin: 0 }}>
            Analytical Workload &amp; Precision Evaluation
          </h2>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            SQL aggregation benchmarks corresponding to Section 8.9 of BCSE302P Assessment 6.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "4px",
            padding: "4px 10px",
            fontSize: "11px",
            color: "#94a3b8",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Section 8.9 Query 5: Precision Sweep */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
              Precision Parameter Sweep (p &isin; [8, 16])
            </div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>
              Evaluation of speed vs accuracy trade-off on column '{sweepCol}'
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Column:</span>
            <select
              value={sweepCol}
              onChange={(e) => {
                setSweepCol(e.target.value);
                runSweep(e.target.value);
              }}
              style={{ padding: "3px 6px", fontSize: "11px" }}
            >
              <option value="fare_amount">fare_amount</option>
              <option value="trip_distance">trip_distance</option>
              <option value="total_amount">total_amount</option>
              <option value="pickup_datetime">pickup_datetime</option>
            </select>
          </div>
        </div>

        {loadingSweep ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "11px" }}>
            Evaluating precision sweeps...
          </div>
        ) : sweep?.sweep ? (
          <div style={{ overflowX: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
            <table>
              <thead>
                <tr>
                  <th>Precision (p)</th>
                  <th>Registers (m=2^p)</th>
                  <th style={{ textAlign: "right" }}>Theoretical Std Error</th>
                  <th style={{ textAlign: "right" }}>Observed Error</th>
                  <th style={{ textAlign: "right" }}>Estimated Count</th>
                  <th style={{ textAlign: "right" }}>Latency</th>
                  <th style={{ textAlign: "right" }}>Speedup</th>
                </tr>
              </thead>
              <tbody>
                {sweep.sweep.map((row) => (
                  <tr key={row.p}>
                    <td className="mono" style={{ fontWeight: 600 }}>p = {row.p}</td>
                    <td className="mono" style={{ color: "#94a3b8" }}>{row.register_count.toLocaleString()} B</td>
                    <td className="mono" style={{ textAlign: "right", color: "#38bdf8" }}>&plusmn;{row.theoretical_error_pct}%</td>
                    <td className="mono" style={{ textAlign: "right", color: row.observed_error_pct < 3 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
                      {row.observed_error_pct.toFixed(2)}%
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: "#f8fafc" }}>{row.estimated_cardinality.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#94a3b8" }}>{row.latency_ms} ms</td>
                    <td className="mono" style={{ textAlign: "right", color: "#f8fafc", fontWeight: 600 }}>{row.speedup}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "6px 10px", fontSize: "11px", color: "#64748b", textAlign: "right", borderTop: "1px solid #1e293b" }}>
              Exact Distinct Count: <strong style={{ color: "#f8fafc" }}>{sweep.exact_cardinality?.toLocaleString()}</strong> (evaluated in {sweep.exact_time_ms?.toFixed(2)} ms)
            </div>
          </div>
        ) : null}
      </div>

      {/* Grid: Workload (Query 2) & Accuracy (Query 3) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {/* Workload */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "12px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>
            Dataset Workload (SQL Query 2)
          </div>
          <div style={{ border: "1px solid #1e293b", borderRadius: "3px", overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th style={{ textAlign: "right" }}>Total Queries</th>
                  <th style={{ textAlign: "right" }}>Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((w) => (
                  <tr key={w.dataset_id}>
                    <td>{w.dataset_name}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#f8fafc" }}>{w.query_count}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#94a3b8" }}>{w.avg_latency_ms.toFixed(2)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historical Accuracy */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "12px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>
            Historical Error Observations (SQL Query 3)
          </div>
          <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
            <table>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr>
                  <th>QID</th>
                  <th>Precision</th>
                  <th style={{ textAlign: "right" }}>Exact</th>
                  <th style={{ textAlign: "right" }}>Approx</th>
                  <th style={{ textAlign: "right" }}>Observed Error</th>
                </tr>
              </thead>
              <tbody>
                {accuracy.map((a) => (
                  <tr key={a.query_id}>
                    <td className="mono" style={{ color: "#64748b" }}>#{a.query_id}</td>
                    <td className="mono" style={{ color: "#64748b" }}>p={a.precision_p}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#94a3b8" }}>{a.exact_cardinality?.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#f8fafc" }}>{a.estimated_cardinality?.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: "right", color: a.error_percent < 3 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
                      {a.error_percent?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Query Request History Table */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "4px", padding: "12px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>
          Query Requests Catalog (PostgreSQL Table: <code>query_requests</code>)
        </div>
        <div style={{ overflowX: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
          <table>
            <thead>
              <tr>
                <th>query_id</th>
                <th>User</th>
                <th>Operation</th>
                <th>Column</th>
                <th style={{ textAlign: "right" }}>Estimate</th>
                <th style={{ textAlign: "right" }}>Latency</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.query_id}>
                  <td className="mono" style={{ color: "#64748b" }}>#{h.query_id}</td>
                  <td style={{ color: "#94a3b8" }}>{h.user}</td>
                  <td className="mono" style={{ color: "#38bdf8" }}>{h.operation}</td>
                  <td className="mono">{h.target_column}</td>
                  <td className="mono" style={{ textAlign: "right", color: "#f8fafc", fontWeight: 500 }}>
                    {h.estimated_cardinality?.toLocaleString() || "—"}
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: "#94a3b8" }}>
                    {h.latency_ms != null ? `${h.latency_ms.toFixed(2)} ms` : "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      background: h.status === "COMPLETED" ? "#16a34a22" : "#dc262622",
                      color: h.status === "COMPLETED" ? "#16a34a" : "#dc2626",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      padding: "1px 6px",
                      borderRadius: "2px",
                      border: "1px solid " + (h.status === "COMPLETED" ? "#16a34a44" : "#dc262644")
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
