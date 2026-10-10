import { Gauge, Clock, Zap, Target, Database, HardDrive, ShieldCheck } from "lucide-react";

function MetricCard({ icon: Icon, label, value, sub, color, borderGlow }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${borderGlow ? "rgba(168, 85, 247, 0.4)" : "var(--border-subtle)"}`,
      borderRadius: 12,
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      boxShadow: borderGlow ? "0 4px 20px rgba(124, 58, 237, 0.15)" : "none",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
          {label}
        </span>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.9rem",
        fontWeight: 700,
        color: color || "#f1f5f9",
        letterSpacing: "-0.02em",
        lineHeight: 1.1
      }}>
        {value}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
        {sub}
      </div>
    </div>
  );
}

export default function BenchmarkResults({ result }) {
  if (!result) return null;

  const speedup = result.speedup != null ? `${result.speedup}x` : "—";
  const approxTime = result.approx_time_ms != null ? `${result.approx_time_ms.toFixed(2)} ms` : "—";
  const exactTime = result.exact_time_ms != null ? `${result.exact_time_ms.toFixed(2)} ms` : "Not Run";
  const errorPct = typeof result.error_pct === "number" ? result.error_pct : null;
  const theoretical = result.theoretical_error ? (result.theoretical_error * 100).toFixed(2) : null;

  const errorColor = errorPct == null ? "#94a3b8" : errorPct <= 2.0 ? "#10b981" : errorPct <= 6.0 ? "#06b6d4" : "#f59e0b";
  const errorQuality = errorPct == null ? "N/A" : errorPct <= 2.0 ? "EXCELLENT (< 2%)" : errorPct <= 6.0 ? "GOOD (< 6%)" : "ACCEPTABLE";

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Execution &amp; Benchmark Performance
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Real-time comparison between compact probabilistic state and full-table exact evaluation.
          </p>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "#161726",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          padding: "0.35rem 0.75rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          color: "#c084fc"
        }}>
          <ShieldCheck size={14} color="#a855f7" />
          <span>Query #{result.query_id} (PostgreSQL Persisted)</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <MetricCard
          icon={Zap}
          label="ANALYTICAL SPEEDUP"
          value={speedup}
          sub="FASTER THAN EXACT FULL SCAN"
          color="#10b981"
          borderGlow={true}
        />
        <MetricCard
          icon={Clock}
          label="APPROXIMATE LATENCY"
          value={approxTime}
          sub="HLL SKETCH ESTIMATOR"
          color="#a855f7"
        />
        <MetricCard
          icon={Gauge}
          label="EXACT SCAN LATENCY"
          value={exactTime}
          sub="FULL SCAN WITH UNIQUE SET"
          color="#94a3b8"
        />
        <MetricCard
          icon={HardDrive}
          label="SKETCH MEMORY"
          value={result.memory_bytes ? `${result.memory_bytes} B` : `${result.register_count || 1024} B`}
          sub={`m = ${result.register_count || 1024} REGISTERS`}
          color="#06b6d4"
        />
      </div>

      {/* Accuracy & Error Analysis Card */}
      {errorPct != null && (
        <div style={{
          background: "var(--bg-card)",
          border: `1px solid ${errorColor}33`,
          borderRadius: 12,
          padding: "1.25rem",
          marginTop: "1rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Target size={16} color={errorColor} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
                OBSERVED ESTIMATION ERROR
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                color: errorColor,
                background: `${errorColor}18`,
                border: `1px solid ${errorColor}44`,
                borderRadius: 20,
                padding: "0.2rem 0.65rem",
                fontWeight: 700
              }}>
                {errorQuality}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, color: errorColor }}>
                {errorPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Error comparison progress bar */}
          <div style={{ background: "#1c1e30", borderRadius: 4, height: 8, overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${Math.min(errorPct * 10, 100)}%`,
              height: "100%",
              background: errorColor,
              borderRadius: 4,
              transition: "width 0.6s ease"
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)" }}>
            <span>0% (EXACT)</span>
            <span>Theoretical Bound: ±{theoretical}% (Heule et al. 1.04/√m)</span>
            <span>Observed: {errorPct.toFixed(3)}%</span>
          </div>
        </div>
      )}
    </section>
  );
}
