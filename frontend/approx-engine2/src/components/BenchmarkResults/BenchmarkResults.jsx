import { Activity, Zap, Clock, ShieldCheck, Database } from "lucide-react";

export default function BenchmarkResults({ result }) {
  if (!result) return null;

  const speedupVal = typeof result.speedup === "number" ? result.speedup : parseFloat(result.speedup) || 0;
  const isSpeedupPositive = speedupVal >= 1.0;
  const speedupText = result.speedup != null ? `${result.speedup}X` : "—";

  const approxTime = result.approx_time_ms != null ? `${result.approx_time_ms.toFixed(2)} MS` : "—";
  const exactTime = result.exact_time_ms != null ? `${result.exact_time_ms.toFixed(2)} MS` : "NOT_EVALUATED";
  const errorPct = typeof result.error_pct === "number" ? result.error_pct : null;
  const theoretical = result.theoretical_error ? (result.theoretical_error * 100).toFixed(2) : "3.25";

  // Segmented block bar calculation (total 30 blocks)
  const totalBlocks = 30;
  const activeBlocks = errorPct != null ? Math.min(Math.round((errorPct / 10.0) * totalBlocks), totalBlocks) : 0;
  const theoBlockPos = Math.min(Math.round((parseFloat(theoretical) / 10.0) * totalBlocks), totalBlocks);

  return (
    <section style={{ marginBottom: "14px" }}>
      {/* Retro Window Header Strip */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-panel)",
        border: "var(--border)",
        borderBottom: "2px solid var(--accent-orange)",
        padding: "6px 10px",
        marginBottom: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            border: "1px solid var(--accent-orange)",
            color: "var(--accent-orange)",
            padding: "2px 5px",
            fontFamily: "var(--font-pixel)",
            fontSize: "10px"
          }}>
            [■]
          </span>
          <h2 style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "12px",
            color: "var(--accent-orange)",
            letterSpacing: "0.05em",
            margin: 0
          }}>
            EXECUTION_METRICS // Q_ID: #{result.query_id}
          </h2>
          <span style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
            [POSTGRES_COMMITTED]
          </span>
        </div>

        {/* Terminal Window Action Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{
            background: "var(--accent-orange)",
            color: "var(--text-on-orange)",
            fontFamily: "var(--font-pixel)",
            fontSize: "9px",
            padding: "1px 6px"
          }}>
            ACTIVE_RUN
          </span>
          <span style={{
            background: "var(--bg-page)",
            border: "var(--border)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-pixel)",
            fontSize: "9px",
            padding: "1px 5px",
            cursor: "pointer"
          }}>
            x
          </span>
        </div>
      </div>

      {/* 4 Metric Tiles on Navy Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {/* Tile 1: Speedup Ratio */}
        <div style={{
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="pixel-tag">
              SPEEDUP_RATIO
            </span>
            <span style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "11px",
              color: isSpeedupPositive ? "var(--up)" : "var(--down)"
            }}>
              {isSpeedupPositive ? "▲ FAST" : "▼ SCAN"}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)" }}>
            VS_FULL_TABLE_SCAN
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "32px",
            lineHeight: 1,
            color: isSpeedupPositive ? "var(--up)" : "var(--down)",
            fontWeight: 700
          }}>
            {isSpeedupPositive ? "▲" : "▼"} {speedupText}
          </div>
        </div>

        {/* Tile 2: Approximate Latency */}
        <div style={{
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="pixel-tag">
              APPROX_LATENCY
            </span>
            <span style={{ fontFamily: "var(--font-pixel)", fontSize: "10px", color: "var(--star)" }}>
              ⚡ HLL
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)" }}>
            STREAM_REGISTER_UPDATE
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "32px",
            lineHeight: 1,
            color: "var(--text-primary)",
            fontWeight: 700
          }}>
            {approxTime}
          </div>
        </div>

        {/* Tile 3: Exact Scan Latency */}
        <div style={{
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="pixel-tag">
              EXACT_LATENCY
            </span>
            <span style={{ fontFamily: "var(--font-pixel)", fontSize: "10px", color: "var(--text-muted)" }}>
              ⏱ BENCH
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)" }}>
            SCAN_ENTIRE_COLUMN
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "32px",
            lineHeight: 1,
            color: "var(--text-muted)",
            fontWeight: 700
          }}>
            {exactTime}
          </div>
        </div>

        {/* Tile 4: Sketch Memory */}
        <div style={{
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="pixel-tag">
              SKETCH_MEMORY
            </span>
            <span style={{ fontFamily: "var(--font-pixel)", fontSize: "10px", color: "var(--accent-orange)" }}>
              [m={result.register_count || 1024}]
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)" }}>
            POSTGRES_DENSE_STORAGE
          </div>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "32px",
            lineHeight: 1,
            color: "var(--accent-orange)",
            fontWeight: 700
          }}>
            {result.memory_bytes ? `${result.memory_bytes} B` : `${result.register_count || 1024} B`}
          </div>
        </div>
      </div>

      {/* Accuracy & Deviation Segmented Sparkline Panel */}
      {errorPct != null && (
        <div style={{
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "10px 12px",
          marginTop: "8px"
        }}>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="pixel-tag">
                OBSERVED_ERROR
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "18px",
                fontWeight: 700,
                color: errorPct <= 3.0 ? "var(--up)" : "var(--down)"
              }}>
                {errorPct.toFixed(2)}%
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "var(--font-code)", fontSize: "10px" }}>
              <span style={{ color: "var(--text-muted)" }}>
                THEORETICAL_BOUND (1.04/√m): <strong style={{ color: "var(--star)" }}>&plusmn;{theoretical}%</strong>
              </span>
              <span style={{ color: errorPct <= parseFloat(theoretical) ? "var(--up)" : "var(--accent-orange)" }}>
                {errorPct <= parseFloat(theoretical) ? "[WITHIN_BOUND]" : "[TOLERANCE_OK]"}
              </span>
            </div>
          </div>

          {/* Timeline Ruler / Tick Grid */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-muted)",
            borderBottom: "1px dashed rgba(255, 255, 255, 0.15)",
            paddingBottom: "2px",
            marginBottom: "4px"
          }}>
            <span>| 0.0% [EXACT]</span>
            <span>| 2.5%</span>
            <span style={{ color: "var(--star)" }}>| THEO: ±{theoretical}%</span>
            <span>| 7.5%</span>
            <span>| 10.0% [MAX] |</span>
          </div>

          {/* Chunky Segmented Block Meter */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            background: "var(--bg-page)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "4px"
          }}>
            {Array.from({ length: totalBlocks }).map((_, idx) => {
              const isFilled = idx < activeBlocks;
              const isTheoMarker = idx === theoBlockPos;
              return (
                <div
                  key={idx}
                  title={`Block ${idx}: ${(idx / totalBlocks * 10).toFixed(1)}%`}
                  style={{
                    flex: 1,
                    height: "14px",
                    background: isFilled
                      ? "var(--accent-orange)"
                      : isTheoMarker
                      ? "var(--star)"
                      : "var(--bg-panel-alt)",
                    border: isTheoMarker ? "1px solid var(--text-primary)" : "none"
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
