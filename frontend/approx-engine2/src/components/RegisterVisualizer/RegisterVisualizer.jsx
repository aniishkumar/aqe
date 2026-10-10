import { useEffect, useState } from "react";
import { getSketches, getSketchRegisters, buildSketch, getDataInfo } from "../../api";
import { Database, RefreshCw, BarChart2, Layers, Search, Cpu } from "lucide-react";

export default function RegisterVisualizer() {
  const [sketches, setSketches] = useState([]);
  const [selectedSketchId, setSelectedSketchId] = useState(null);
  const [registerData, setRegisterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [buildCol, setBuildCol] = useState("fare_amount");
  const [buildP, setBuildP] = useState(10);
  const [filterIdx, setFilterIdx] = useState("");

  const loadSketchesList = () => {
    getSketches().then((res) => {
      setSketches(res);
      if (res?.length && !selectedSketchId) {
        setSelectedSketchId(res[0].sketch_id);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadSketchesList();
    getDataInfo().then((res) => {
      if (res?.columns) setColumns(res.columns);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSketchId) {
      setLoading(true);
      getSketchRegisters(selectedSketchId, 1024, 0)
        .then((res) => setRegisterData(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedSketchId]);

  const handleBuildNew = async () => {
    setLoading(true);
    try {
      const res = await buildSketch({ dataset_id: 1, column_name: buildCol, precision_p: buildP });
      loadSketchesList();
      setSelectedSketchId(res.sketch_id);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentSketch = sketches.find((s) => s.sketch_id === selectedSketchId);
  const activeRegs = registerData?.registers || [];
  const filteredRegs = filterIdx
    ? activeRegs.filter((r) => r.index.toString().includes(filterIdx))
    : activeRegs.slice(0, 256);

  // Frequency distribution for chart
  const distribution = registerData?.distribution || {};
  const maxFreq = Math.max(...Object.values(distribution), 1);

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Database size={20} color="#a855f7" />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              HLL Registers &amp; Relational Dense State
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Direct inspection of PostgreSQL table <code>hll_registers</code> with composite primary key <code>(sketch_id, register_index)</code>.
          </p>
        </div>

        {/* Build New Sketch Mini-Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 8,
          padding: "0.4rem 0.6rem"
        }}>
          <select
            value={buildCol}
            onChange={(e) => setBuildCol(e.target.value)}
            style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "0.35rem 0.5rem", color: "#f1f5f9", fontSize: "0.75rem" }}
          >
            {columns.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select
            value={buildP}
            onChange={(e) => setBuildP(parseInt(e.target.value))}
            style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "0.35rem 0.5rem", color: "#f1f5f9", fontSize: "0.75rem" }}
          >
            {[6, 8, 10, 12, 14].map((p) => (<option key={p} value={p}>p={p} (m={1 << p})</option>))}
          </select>
          <button
            onClick={handleBuildNew}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none",
              borderRadius: 6,
              padding: "0.35rem 0.75rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            BUILD SKETCH
          </button>
        </div>
      </div>

      {/* Sketch Selector Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
        {sketches.map((s) => {
          const isSelected = s.sketch_id === selectedSketchId;
          return (
            <div
              key={s.sketch_id}
              onClick={() => setSelectedSketchId(s.sketch_id)}
              style={{
                background: isSelected ? "rgba(124, 58, 237, 0.15)" : "var(--bg-card)",
                border: isSelected ? "1px solid #a855f7" : "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "1rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: isSelected ? "#c084fc" : "var(--text-muted)", fontWeight: 700 }}>
                  Sketch #{s.sketch_id}
                </span>
                {s.is_current && (
                  <span style={{ background: "#10b98122", border: "1px solid #10b98155", color: "#10b981", fontSize: "0.58rem", fontFamily: "var(--font-mono)", padding: "0.1rem 0.35rem", borderRadius: 4 }}>
                    CURRENT
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc" }}>
                {s.column_name || `Column ${s.column_id}`}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)" }}>
                <span>p = {s.precision_p} (m={s.register_count})</span>
                <span>{s.representation}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Register Exploration Panel */}
      {currentSketch && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1.25rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          padding: "1.5rem"
        }}>
          {/* Left: Leading Zero Distribution Histogram */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <BarChart2 size={16} color="#c084fc" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "#f1f5f9" }}>
                  STATISTIC DISTRIBUTION: ρ(w) MAX LEADING ZEROS
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
                m = {currentSketch.register_count} Buckets
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-end",
              height: 180,
              gap: 4,
              padding: "0.5rem 0",
              borderBottom: "1px solid var(--border-subtle)"
            }}>
              {Array.from({ length: 24 }).map((_, lzVal) => {
                const count = distribution[lzVal] || 0;
                const heightPct = (count / maxFreq) * 100;
                return (
                  <div
                    key={lzVal}
                    title={`Leading Zeros: ${lzVal}\nRegisters: ${count}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "flex-end"
                    }}
                  >
                    <div style={{
                      width: "100%",
                      height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%`,
                      background: count > 0 ? "linear-gradient(to top, #7c3aed, #a855f7)" : "transparent",
                      borderRadius: "2px 2px 0 0",
                      transition: "height 0.3s ease"
                    }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-dim)", marginTop: 4 }}>
                      {lzVal}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)", textAlign: "center", marginTop: "0.4rem" }}>
              ← Maximum Leading Zeros Statistic (ρ(w) ∈ [0, 64]) →
            </div>

            {/* Sketch Metadata Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "1.25rem" }}>
              <div style={{ background: "#161726", padding: "0.75rem", borderRadius: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", display: "block" }}>ALGORITHM</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#e2e8f0", fontWeight: 700 }}>{currentSketch.algorithm_version}</span>
              </div>
              <div style={{ background: "#161726", padding: "0.75rem", borderRadius: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", display: "block" }}>HASH ENGINE</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#06b6d4", fontWeight: 700 }}>{currentSketch.hash_version}</span>
              </div>
              <div style={{ background: "#161726", padding: "0.75rem", borderRadius: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", display: "block" }}>REPRESENTATION</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>{currentSketch.representation}</span>
              </div>
            </div>
          </div>

          {/* Right: Relational Dense Register Rows Table */}
          <div style={{ display: "flex", flexDirection: "column", height: 340 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9" }}>
                <code>hll_registers</code> ROWS (2NF)
              </span>
              <div style={{ display: "flex", alignItems: "center", background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "0.2rem 0.5rem" }}>
                <Search size={12} color="var(--text-dim)" />
                <input
                  placeholder="Index..."
                  value={filterIdx}
                  onChange={(e) => setFilterIdx(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.65rem", width: 70, marginLeft: 4 }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                <thead style={{ position: "sticky", top: 0, background: "#161726", borderBottom: "1px solid var(--border-subtle)" }}>
                  <tr>
                    <th style={{ padding: "0.5rem", textAlign: "left", color: "var(--text-muted)" }}>sketch_id</th>
                    <th style={{ padding: "0.5rem", textAlign: "left", color: "var(--text-muted)" }}>register_index</th>
                    <th style={{ padding: "0.5rem", textAlign: "right", color: "#c084fc" }}>register_value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map((r) => (
                    <tr key={r.index} style={{ borderBottom: "1px solid #1c1e30" }}>
                      <td style={{ padding: "0.4rem 0.5rem", color: "var(--text-dim)" }}>{currentSketch.sketch_id}</td>
                      <td style={{ padding: "0.4rem 0.5rem", color: "#e2e8f0" }}>{r.index}</td>
                      <td style={{ padding: "0.4rem 0.5rem", textAlign: "right", color: r.value > 0 ? "#a855f7" : "var(--text-dim)", fontWeight: r.value > 0 ? 700 : 400 }}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>
              Showing {filteredRegs.length} register entries.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
