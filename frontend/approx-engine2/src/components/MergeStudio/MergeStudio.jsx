import { useEffect, useState } from "react";
import { getSketches, mergeSketches, getMergeLineage } from "../../api";
import { GitMerge, ArrowRight, ShieldCheck, Database, Layers, CheckCircle } from "lucide-react";

export default function MergeStudio() {
  const [sketches, setSketches] = useState([]);
  const [targetId, setTargetId] = useState(null);
  const [sourceId, setSourceId] = useState(null);
  const [mergeResult, setMergeResult] = useState(null);
  const [lineage, setLineage] = useState([]);
  const [loading, setLoading] = useState(false);

  const reloadData = () => {
    getSketches().then((res) => {
      setSketches(res);
      if (res?.length >= 2) {
        if (!targetId) setTargetId(res[0].sketch_id);
        if (!sourceId) setSourceId(res[1].sketch_id);
      }
    }).catch(console.error);

    getMergeLineage().then(setLineage).catch(console.error);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleMerge = async () => {
    if (!targetId || !sourceId || targetId === sourceId) {
      alert("Please select two distinct sketches with compatible precision p.");
      return;
    }
    setLoading(true);
    try {
      const res = await mergeSketches(targetId, sourceId);
      setMergeResult(res);
      reloadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const targetSketch = sketches.find((s) => s.sketch_id === targetId);
  const sourceSketch = sketches.find((s) => s.sketch_id === sourceId);
  const canMerge = targetSketch && sourceSketch && targetSketch.precision_p === sourceSketch.precision_p;

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} className="animate-fade-in">
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <GitMerge size={20} color="#06b6d4" />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Sketch Merge Studio &amp; Lineage Tracking
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
          Lossless merging of compatible HyperLogLog sketches for partitioned and distributed query processing (Heule et al., 2013).
        </p>
      </div>

      {/* Merge Theory Callout */}
      <div style={{
        background: "rgba(6, 182, 212, 0.08)",
        border: "1px solid rgba(6, 182, 212, 0.3)",
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8", marginBottom: "0.3rem" }}>
            MATHEMATICAL PRINCIPLE: REGISTER-WISE MAXIMUM
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Because each register records the maximum leading zeros statistic for a hash-partitioned substream, two sketches S<sub>1</sub> and S<sub>2</sub> with equal precision <em>p</em> are combined losslessly via:
            <code style={{ background: "#161726", padding: "0.15rem 0.4rem", borderRadius: 4, color: "#e2e8f0", marginLeft: 6 }}>
              R<sub>merged</sub>[j] = max(R<sub>1</sub>[j], R<sub>2</sub>[j])
            </code>.
          </p>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-dim)", background: "#161726", padding: "0.5rem 0.75rem", borderRadius: 8 }}>
          PostgreSQL Table: <code>sketch_merges</code>
        </div>
      </div>

      {/* Interactive Merge Control Panel */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
          Execute Sketch Merge
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "center" }}>
          {/* Target Sketch */}
          <div style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "1.2rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#c084fc", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              TARGET SKETCH (BASE)
            </span>
            <select
              value={targetId || ""}
              onChange={(e) => setTargetId(parseInt(e.target.value))}
              style={{ width: "100%", background: "#1a1b2e", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: "0.75rem" }}
            >
              {sketches.map((s) => (
                <option key={s.sketch_id} value={s.sketch_id}>
                  #{s.sketch_id} - {s.column_name} (p={s.precision_p}, m={s.register_count})
                </option>
              ))}
            </select>
            {targetSketch && (
              <div style={{ marginTop: "0.6rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
                Precision: p={targetSketch.precision_p} | Registers: {targetSketch.register_count}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
            <GitMerge size={24} color="#a855f7" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>+</span>
          </div>

          {/* Source Sketch */}
          <div style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: "1.2rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#06b6d4", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              SOURCE SKETCH (TO INGEST)
            </span>
            <select
              value={sourceId || ""}
              onChange={(e) => setSourceId(parseInt(e.target.value))}
              style={{ width: "100%", background: "#1a1b2e", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "0.5rem", color: "#fff", fontSize: "0.75rem" }}
            >
              {sketches.map((s) => (
                <option key={s.sketch_id} value={s.sketch_id}>
                  #{s.sketch_id} - {s.column_name} (p={s.precision_p}, m={s.register_count})
                </option>
              ))}
            </select>
            {sourceSketch && (
              <div style={{ marginTop: "0.6rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
                Precision: p={sourceSketch.precision_p} | Registers: {sourceSketch.register_count}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {!canMerge && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "#f43f5e" }}>
                ⚠️ Precision mismatch: Sketches must have the same precision p to be merged.
              </span>
            )}
          </div>

          <button
            onClick={handleMerge}
            disabled={!canMerge || loading}
            style={{
              background: canMerge ? "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" : "#2a2b3d",
              border: "none",
              borderRadius: 8,
              padding: "0.65rem 1.5rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#fff",
              cursor: canMerge ? "pointer" : "not-allowed"
            }}
          >
            {loading ? "MERGING..." : "MERGE SKETCHES"}
          </button>
        </div>

        {/* Merge Success Card */}
        {mergeResult && (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 10,
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10b981", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                <CheckCircle size={14} /> NEW MERGED SKETCH CREATED: #{mergeResult.merged_sketch_id}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Combined Sketch #{mergeResult.target_source_id} and #{mergeResult.second_source_id} via register-wise max.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: "#10b981" }}>
                {mergeResult.merged_cardinality?.toLocaleString()}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>
                COMBINED ESTIMATE
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Merge Lineage Table (sketch_merges) */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Merge Lineage History (PostgreSQL Table: <code>sketch_merges</code>)
          </h3>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            {lineage.length} Merge Records
          </span>
        </div>

        {lineage.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            No merge operations recorded yet. Execute a merge above to track lineage.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ background: "#161726", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.8rem", color: "var(--text-muted)" }}>MERGE ID</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#c084fc" }}>TARGET SKETCH ID</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "#06b6d4" }}>SOURCE SKETCH ID</th>
                  <th style={{ padding: "0.6rem 0.8rem", color: "var(--text-dim)" }}>MERGED TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {lineage.map((m) => (
                  <tr key={m.merge_id} style={{ borderBottom: "1px solid #1c1e30" }}>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#f1f5f9" }}>#{m.merge_id}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#c084fc", fontWeight: 600 }}>Sketch #{m.target_sketch_id}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "#06b6d4", fontWeight: 600 }}>Sketch #{m.source_sketch_id}</td>
                    <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-dim)" }}>{m.merged_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
