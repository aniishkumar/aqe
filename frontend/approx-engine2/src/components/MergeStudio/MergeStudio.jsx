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
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", background: "var(--bg-page)", minHeight: "calc(100vh - 48px)" }}>
      {/* Header Strip */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
            <GitMerge size={16} color="var(--accent-orange)" strokeWidth={2} />
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
                Sketch Merge &amp; Lineage Studio
              </h2>
              <span className="pixel-tag">HEULE ET AL. (2013)</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Deterministic lossless register-wise maximum merging for partitioned distributed streams.
            </p>
          </div>
        </div>

        <div style={{
          padding: "3px 8px",
          border: "var(--border)",
          background: "var(--bg-panel)",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          color: "var(--text-primary)"
        }}>
          RELATION: <span style={{ color: "var(--star)" }}>sketch_merges</span>
        </div>
      </div>

      {/* Technical Overview Box */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px"
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          <span style={{ fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", fontSize: "9px", marginRight: "6px" }}>ALGORITHM RULE:</span>
          <code style={{ color: "var(--star)", fontFamily: "var(--font-code)", background: "var(--bg-page)", padding: "2px 6px", border: "var(--border)" }}>
            R_merged[j] = max(R_1[j], R_2[j])
          </code>
          <span style={{ marginLeft: "8px", color: "var(--text-muted)" }}>
            (Lossless register-wise maximum for sketches with equal precision p)
          </span>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          AVAILABLE SKETCHES: <strong style={{ color: "var(--accent-orange)" }}>{sketches.length}</strong>
        </div>
      </div>

      {/* Merge Action Panel */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pixel-tag">EXECUTE MERGE</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
            Select target and source sketches with identical precision
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center" }}>
          {/* Target */}
          <div style={{ background: "var(--bg-page)", border: "var(--border)", padding: "10px" }}>
            <label style={{ display: "block", fontSize: "9px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", textTransform: "uppercase", marginBottom: "6px" }}>
              Target Sketch (Base)
            </label>
            <select
              value={targetId || ""}
              onChange={(e) => setTargetId(parseInt(e.target.value))}
              style={{ width: "100%", background: "var(--bg-panel)", border: "var(--border)" }}
            >
              {sketches.map((s) => (
                <option key={s.sketch_id} value={s.sketch_id}>
                  #{s.sketch_id} - {s.column_name} (p={s.precision_p}, m={s.register_count})
                </option>
              ))}
            </select>
          </div>

          <div style={{ color: "var(--accent-orange)", padding: "0 4px" }}>
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>

          {/* Source */}
          <div style={{ background: "var(--bg-page)", border: "var(--border)", padding: "10px" }}>
            <label style={{ display: "block", fontSize: "9px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", textTransform: "uppercase", marginBottom: "6px" }}>
              Source Sketch (To Ingest)
            </label>
            <select
              value={sourceId || ""}
              onChange={(e) => setSourceId(parseInt(e.target.value))}
              style={{ width: "100%", background: "var(--bg-panel)", border: "var(--border)" }}
            >
              {sketches.map((s) => (
                <option key={s.sketch_id} value={s.sketch_id}>
                  #{s.sketch_id} - {s.column_name} (p={s.precision_p}, m={s.register_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            {!canMerge && (
              <span style={{ fontSize: "11px", color: "var(--down)", fontFamily: "var(--font-code)", background: "rgba(255,59,59,0.1)", padding: "3px 8px", border: "1px solid var(--down)" }}>
                &times; Error: Both sketches must have identical precision p to be mergeable.
              </span>
            )}
          </div>

          <button
            onClick={handleMerge}
            disabled={!canMerge || loading}
            className="btn-orange"
            style={{
              opacity: canMerge && !loading ? 1 : 0.45,
              cursor: canMerge && !loading ? "pointer" : "not-allowed"
            }}
          >
            {loading ? "MERGING REGISTERS..." : "EXECUTE MERGE"}
          </button>
        </div>

        {/* Merge Output */}
        {mergeResult && (
          <div style={{
            background: "var(--bg-page)",
            border: "1px solid var(--up)",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "var(--up)", fontSize: "11px", fontFamily: "var(--font-pixel)" }}>
                  ▲ MERGED SKETCH CREATED: #{mergeResult.merged_sketch_id}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-code)" }}>
                Combined Sketch #{mergeResult.target_source_id} &amp; #{mergeResult.second_source_id} via register-wise max.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "28px", lineHeight: 1, fontWeight: 700, color: "var(--text-primary)" }}>
                {mergeResult.merged_cardinality?.toLocaleString()}
              </div>
              <div style={{ fontSize: "9px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", letterSpacing: "0.05em", marginTop: "2px" }}>
                COMBINED ESTIMATE
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lineage Table */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "14px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="pixel-tag">MERGE LINEAGE</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-code)" }}>
              PostgreSQL Relation: sketch_merges
            </span>
          </div>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent-orange)" }}>
            [{lineage.length} RECORDS]
          </span>
        </div>

        {lineage.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--font-code)" }}>
            NO MERGE OPERATIONS RECORDED YET.
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "var(--border)" }}>
            <table>
              <thead>
                <tr>
                  <th>MERGE_ID</th>
                  <th>TARGET_SKETCH_ID</th>
                  <th>SOURCE_SKETCH_ID</th>
                  <th style={{ textAlign: "right" }}>MERGED_AT</th>
                </tr>
              </thead>
              <tbody>
                {lineage.map((m) => (
                  <tr key={m.merge_id}>
                    <td style={{ color: "var(--accent-orange)", fontWeight: 700 }}>#{m.merge_id}</td>
                    <td style={{ color: "var(--text-primary)" }}>Sketch #{m.target_sketch_id}</td>
                    <td style={{ color: "var(--star)" }}>Sketch #{m.source_sketch_id}</td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{m.merged_at}</td>
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
