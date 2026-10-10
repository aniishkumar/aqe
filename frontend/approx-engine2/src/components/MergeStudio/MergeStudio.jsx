import { useEffect, useState } from "react";
import { getSketches, mergeSketches, getMergeLineage } from "../../api";
import { GitMerge, ArrowRight, Check } from "lucide-react";

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
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", margin: 0 }}>
          Sketch Merge &amp; Lineage Tracking
        </h2>
        <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
          Deterministic merging of compatible HyperLogLog sketches for partitioned and distributed processing (Heule et al., 2013).
        </p>
      </div>

      {/* Technical Overview Box */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px"
      }}>
        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
          Operation Principle: <code style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>R_merged[j] = max(R_1[j], R_2[j])</code>
          <span style={{ color: "#64748b", marginLeft: "6px" }}>
            (lossless register-wise maximum for sketches with equal precision p)
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
          Target Table: <code>sketch_merges</code>
        </div>
      </div>

      {/* Merge Action Panel */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
          Execute Sketch Merge
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", alignItems: "center" }}>
          {/* Target */}
          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
              Target Sketch (Base)
            </label>
            <select
              value={targetId || ""}
              onChange={(e) => setTargetId(parseInt(e.target.value))}
              style={{ width: "100%", padding: "5px 8px" }}
            >
              {sketches.map((s) => (
                <option key={s.sketch_id} value={s.sketch_id}>
                  #{s.sketch_id} - {s.column_name} (p={s.precision_p}, m={s.register_count})
                </option>
              ))}
            </select>
          </div>

          <div style={{ color: "#64748b", padding: "0 4px" }}>
            <ArrowRight size={16} />
          </div>

          {/* Source */}
          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "4px", padding: "10px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
              Source Sketch (To Ingest)
            </label>
            <select
              value={sourceId || ""}
              onChange={(e) => setSourceId(parseInt(e.target.value))}
              style={{ width: "100%", padding: "5px 8px" }}
            >
              {sketches.map((s) => (
                <option key={s.sketch_id} value={s.sketch_id}>
                  #{s.sketch_id} - {s.column_name} (p={s.precision_p}, m={s.register_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {!canMerge && (
              <span style={{ fontSize: "11px", color: "#ef4444" }}>
                Error: Both sketches must have identical precision p to be mergeable.
              </span>
            )}
          </div>

          <button
            onClick={handleMerge}
            disabled={!canMerge || loading}
            style={{
              background: canMerge ? "#2563eb" : "#1e293b",
              border: "1px solid " + (canMerge ? "#1d4ed8" : "#334155"),
              borderRadius: "4px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 500,
              color: canMerge ? "#ffffff" : "#64748b",
              cursor: canMerge ? "pointer" : "not-allowed"
            }}
          >
            {loading ? "Merging..." : "Execute Merge"}
          </button>
        </div>

        {/* Merge Output */}
        {mergeResult && (
          <div style={{
            background: "#0b0f19",
            border: "1px solid #16a34a44",
            borderRadius: "4px",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                Merged Sketch Created: #{mergeResult.merged_sketch_id}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                Combined Sketch #{mergeResult.target_source_id} &amp; #{mergeResult.second_source_id} via register-wise max.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color: "#f8fafc" }}>
                {mergeResult.merged_cardinality?.toLocaleString()}
              </div>
              <div style={{ fontSize: "10px", color: "#64748b" }}>Combined Estimate</div>
            </div>
          </div>
        )}
      </div>

      {/* Lineage Table */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "4px",
        padding: "14px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
            Merge Lineage Records (PostgreSQL Table: <code>sketch_merges</code>)
          </span>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            {lineage.length} records
          </span>
        </div>

        {lineage.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "11px" }}>
            No merge operations recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
            <table>
              <thead>
                <tr>
                  <th>merge_id</th>
                  <th>target_sketch_id</th>
                  <th>source_sketch_id</th>
                  <th style={{ textAlign: "right" }}>merged_at</th>
                </tr>
              </thead>
              <tbody>
                {lineage.map((m) => (
                  <tr key={m.merge_id}>
                    <td className="mono" style={{ color: "#64748b" }}>#{m.merge_id}</td>
                    <td className="mono">Sketch #{m.target_sketch_id}</td>
                    <td className="mono">Sketch #{m.source_sketch_id}</td>
                    <td className="mono" style={{ textAlign: "right", color: "#64748b" }}>{m.merged_at}</td>
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
