import { useEffect, useState } from "react";
import { getWorkloadAnalytics, getAccuracyAnalytics, getPrecisionSweep, getQueryHistory } from "../../api";
import { BarChart3, TrendingUp, Cpu, History, RefreshCw, Zap } from "lucide-react";

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
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={20} color="#10b981" />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              SQL Workload &amp; Precision Analytics
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Evaluation of analytical workload, precision sweeps, and estimation error margins (BCSE302P Section 8.9).
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            padding: "0.45rem 0.85rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Section 8.9 Query 5: Precision Sweep Evaluation (p = 8, 10, 12, 14, 16) */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <TrendingUp size={16} color="#c084fc" />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                Precision Sweep &amp; Speed–Accuracy Trade-Off (p ∈ [8, 16])
              </h3>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
              Heule et al. (2013) algorithm comparison across register configurations on column '{sweepCol}'.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <select
              value={sweepCol}
              onChange={(e) => {
                setSweepCol(e.target.value);
                runSweep(e.target.value);
              }}
              style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "0.35rem 0.6rem", color: "#f1f5f9", fontSize: "0.72rem" }}
            >
              <option value="fare_amount">fare_amount</option>
              <option value="trip_distance">trip_distance</option>
              <option value="total_amount">total_amount</option>
              <option value="pickup_datetime">pickup_datetime</option>
            </select>
          </div>
        </div>

        {loadingSweep ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            Evaluating precision sweeps...
          </div>
        ) : sweep?.sweep ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.8rem", color: "var(--text-muted)" }}>PRECISION (p)</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "var(--text-muted)" }}>REGISTERS (m=2^p)</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#38bdf8" }}>THEORETICAL ERROR</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#10b981" }}>OBSERVED ERROR</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#c084fc" }}>ESTIMATED COUNT</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#e2e8f0" }}>LATENCY</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#f59e0b" }}>SPEEDUP</th>
                </tr>
              </thead>
              <tbody>
                {sweep.sweep.map((row) => (
                  <tr key={row.p} style={{ borderBottom: "1px solid #1c1e30" }}>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#f1f5f9", fontWeight: 700 }}>p = {row.p}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-dim)" }}>{row.register_count.toLocaleString()} B</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#38bdf8" }}>±{row.theoretical_error_pct}%</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: row.observed_error_pct < 3 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                      {row.observed_error_pct.toFixed(2)}%
                    </td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#f3e8ff" }}>{row.estimated_cardinality.toLocaleString()}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#e2e8f0" }}>{row.latency_ms} ms</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#f59e0b", fontWeight: 700 }}>{row.speedup}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", textAlign: "right" }}>
              Exact Ground Truth: <strong>{sweep.exact_cardinality?.toLocaleString()}</strong> unique values (scanned in {sweep.exact_time_ms?.toFixed(2)} ms)
            </div>
          </div>
        ) : null}
      </div>

      {/* Grid: Workload (Query 2) & Accuracy (Query 3) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Workload per Dataset (Section 8.9 Query 2) */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          padding: "1.5rem"
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 1rem" }}>
            Dataset Workload (SQL Query 2)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.5rem", color: "var(--text-muted)" }}>DATASET</th>
                <th style={{ padding: "0.5rem", color: "var(--text-muted)" }}>TOTAL QUERIES</th>
                <th style={{ padding: "0.5rem", color: "#c084fc" }}>AVG LATENCY</th>
              </tr>
            </thead>
            <tbody>
              {workload.map((w) => (
                <tr key={w.dataset_id} style={{ borderBottom: "1px solid #1c1e30" }}>
                  <td style={{ padding: "0.5rem", color: "#f1f5f9" }}>{w.dataset_name}</td>
                  <td style={{ padding: "0.5rem", color: "#38bdf8", fontWeight: 600 }}>{w.query_count}</td>
                  <td style={{ padding: "0.5rem", color: "#c084fc" }}>{w.avg_latency_ms.toFixed(2)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Historical Accuracy Records (Section 8.9 Query 3) */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          padding: "1.5rem"
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 1rem" }}>
            Historical Error Observations (SQL Query 3)
          </h3>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <thead>
                <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem", color: "var(--text-muted)" }}>QID</th>
                  <th style={{ padding: "0.5rem", color: "var(--text-muted)" }}>PRECISION</th>
                  <th style={{ padding: "0.5rem", color: "#e2e8f0" }}>EXACT</th>
                  <th style={{ padding: "0.5rem", color: "#c084fc" }}>APPROX</th>
                  <th style={{ padding: "0.5rem", color: "#10b981" }}>ERROR %</th>
                </tr>
              </thead>
              <tbody>
                {accuracy.map((a) => (
                  <tr key={a.query_id} style={{ borderBottom: "1px solid #1c1e30" }}>
                    <td style={{ padding: "0.4rem 0.5rem", color: "var(--text-dim)" }}>#{a.query_id}</td>
                    <td style={{ padding: "0.4rem 0.5rem", color: "var(--text-dim)" }}>p={a.precision_p}</td>
                    <td style={{ padding: "0.4rem 0.5rem", color: "#94a3b8" }}>{a.exact_cardinality?.toLocaleString()}</td>
                    <td style={{ padding: "0.4rem 0.5rem", color: "#f3e8ff" }}>{a.estimated_cardinality?.toLocaleString()}</td>
                    <td style={{ padding: "0.4rem 0.5rem", color: a.error_percent < 4 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                      {a.error_percent?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Queries History Table */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <History size={16} color="#38bdf8" />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Recent Query Requests &amp; Relational Persistence
            </h3>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            PostgreSQL Table: <code>query_requests</code>
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.6rem", color: "var(--text-muted)" }}>QUERY ID</th>
                <th style={{ padding: "0.6rem", color: "var(--text-muted)" }}>USER</th>
                <th style={{ padding: "0.6rem", color: "var(--text-muted)" }}>OPERATION</th>
                <th style={{ padding: "0.6rem", color: "var(--text-muted)" }}>COLUMN</th>
                <th style={{ padding: "0.6rem", color: "#c084fc" }}>ESTIMATE</th>
                <th style={{ padding: "0.6rem", color: "#10b981" }}>LATENCY</th>
                <th style={{ padding: "0.6rem", color: "var(--text-dim)" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.query_id} style={{ borderBottom: "1px solid #1c1e30" }}>
                  <td style={{ padding: "0.6rem", color: "#f1f5f9" }}>#{h.query_id}</td>
                  <td style={{ padding: "0.6rem", color: "var(--text-dim)" }}>{h.user}</td>
                  <td style={{ padding: "0.6rem", color: "#38bdf8" }}>{h.operation}</td>
                  <td style={{ padding: "0.6rem", color: "#e2e8f0" }}>{h.target_column}</td>
                  <td style={{ padding: "0.6rem", color: "#f3e8ff", fontWeight: 600 }}>{h.estimated_cardinality?.toLocaleString() || "—"}</td>
                  <td style={{ padding: "0.6rem", color: "#10b981" }}>{h.latency_ms != null ? `${h.latency_ms.toFixed(2)} ms` : "—"}</td>
                  <td style={{ padding: "0.6rem", color: "#10b981" }}>
                    <span style={{ background: "#10b98118", border: "1px solid #10b98144", padding: "0.1rem 0.4rem", borderRadius: 4, fontSize: "0.6rem" }}>
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
