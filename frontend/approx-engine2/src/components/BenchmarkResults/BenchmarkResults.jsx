function MetricCard({ icon, label, value, sub, valueColor }) {
  return (
    <div style={{ background: "#151515", border: "1px solid #222", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.1em", color: "#666", fontWeight: 700, lineHeight: 1.4 }}>{label}</span>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.8rem", fontWeight: 700, color: valueColor || "#e0e0e0", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.08em", color: "#555", textTransform: "uppercase" }}>{sub}</div>
    </div>
  );
}

function ErrorBar({ errorPct }) {
  if (errorPct == null) return null;
  const clamped = Math.min(errorPct, 100);
  const color = errorPct >= 10 ? "#ef4444" : "#22c55e";
  const label = errorPct >= 10 ? "HIGH ERROR" : "GOOD";

  return (
    <div style={{ background: "#151515", border: `1px solid ${color}33`, borderRadius: 12, padding: "1.25rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.1em", color: "#666", fontWeight: 700 }}>ERROR MARGIN</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 20, padding: "0.15rem 0.6rem", fontWeight: 700 }}>
            {label}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color }}>{errorPct.toFixed(2)}%</span>
        </div>
      </div>
      <div style={{ background: "#222", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${clamped}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#555" }}>0% PERFECT</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#555" }}>10% THRESHOLD</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#555" }}>100%</span>
      </div>
    </div>
  );
}

export default function BenchmarkResults({ result }) {
  if (!result) return null;

  const speedup = result.speedup != null ? parseFloat(result.speedup).toFixed(2) : null;

  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: "#f0f0f0", margin: "0 0 1.25rem", letterSpacing: "-0.01em" }}>
        Benchmark Results
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <MetricCard
          icon=""
          label="PERFORMANCE SPEEDUP"
          value={speedup ? `${speedup}x` : "—"}
          sub="FASTER THAN EXACT"
          valueColor="#22c55e"
        />
        <MetricCard
          icon=""
          label="APPROXIMATE TIME"
          value={result.approx_time_ms != null ? `${result.approx_time_ms.toFixed(2)} ms` : "—"}
          sub="USING SKETCHES/SAMPLING"
        />
        <MetricCard
          icon=""
          label="EXACT TIME"
          value={result.exact_time_ms != null ? `${result.exact_time_ms.toFixed(2)} ms` : "—"}
          sub="FULL TABLE SCAN"
        />
      </div>
      <ErrorBar errorPct={result.error_pct} />
    </section>
  );
}
