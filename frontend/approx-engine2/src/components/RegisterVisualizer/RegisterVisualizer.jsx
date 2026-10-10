import { useEffect, useState } from "react";
import { getSketches, getSketchRegisters, buildSketch, getDataInfo } from "../../api";
import { Search, Plus } from "lucide-react";

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

  const distribution = registerData?.distribution || {};
  const maxFreq = Math.max(...Object.values(distribution), 1);

  return (
    <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Window Title Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--bg-panel)",
        border: "var(--border)",
        borderBottom: "2px solid var(--accent-orange)",
        padding: "8px 10px",
        flexWrap: "wrap",
        gap: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pixel-tag">
            HLL_REGISTERS // RELATIONAL_INSPECTOR
          </span>
          <span style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
            [POSTGRES: hll_registers (2NF COMPOSITE KEY)]
          </span>
        </div>

        {/* Build Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <select
            value={buildCol}
            onChange={(e) => setBuildCol(e.target.value)}
            style={{ padding: "4px 6px", fontSize: "10px" }}
          >
            {columns.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select
            value={buildP}
            onChange={(e) => setBuildP(parseInt(e.target.value))}
            style={{ padding: "4px 6px", fontSize: "10px" }}
          >
            {[6, 8, 10, 12, 14].map((p) => (<option key={p} value={p}>p={p} (m={1 << p})</option>))}
          </select>
          <button
            onClick={handleBuildNew}
            disabled={loading}
            className="btn-orange"
            style={{ padding: "4px 10px", fontSize: "10px" }}
          >
            <Plus size={10} /> BUILD_SKETCH
          </button>
        </div>
      </div>

      {/* Sketch Tabs Strip */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {sketches.map((s) => {
          const isSelected = s.sketch_id === selectedSketchId;
          return (
            <button
              key={s.sketch_id}
              onClick={() => setSelectedSketchId(s.sketch_id)}
              style={{
                background: isSelected ? "var(--bg-panel-alt)" : "var(--bg-panel)",
                border: isSelected ? "2px solid var(--accent-orange)" : "var(--border)",
                padding: "6px 10px",
                textAlign: "left",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: "9px",
                  color: isSelected ? "var(--accent-orange)" : "var(--text-primary)"
                }}>
                  #{s.sketch_id} - {s.column_name}
                </span>
                {s.is_current && (
                  <span style={{
                    background: "var(--up)",
                    color: "var(--text-on-orange)",
                    fontFamily: "var(--font-pixel)",
                    fontSize: "8px",
                    padding: "1px 4px",
                    fontWeight: 700
                  }}>
                    CURRENT
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                p={s.precision_p} | m={s.register_count} | {s.representation}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Exploration Grid */}
      {currentSketch && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "10px",
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "12px"
        }}>
          {/* Histogram */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="pixel-tag">
                STATISTIC_DISTRIBUTION // ρ(w) LEADING_ZEROS
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--star)" }}>
                m = {currentSketch.register_count} BUCKETS
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-end",
              height: "150px",
              gap: "3px",
              background: "var(--bg-page)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "8px 6px"
            }}>
              {Array.from({ length: 24 }).map((_, lzVal) => {
                const count = distribution[lzVal] || 0;
                const heightPct = (count / maxFreq) * 100;
                return (
                  <div
                    key={lzVal}
                    title={`Leading zeros: ${lzVal} | Registers: ${count}`}
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
                      height: `${Math.max(heightPct, count > 0 ? 3 : 0)}%`,
                      background: count > 0 ? "var(--accent-orange)" : "transparent"
                    }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {lzVal}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)", textAlign: "center", marginTop: "4px" }}>
              LEADING_ZERO_STATISTIC_SPECTRUM: &rho;(w) &isin; [0, 64]
            </div>

            {/* Inset Specs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "10px" }}>
              <div style={{ background: "var(--bg-panel-alt)", border: "var(--border)", padding: "6px 8px" }}>
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: "8px", color: "var(--text-muted)" }}>ALGORITHM</div>
                <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-primary)", fontWeight: 700 }}>{currentSketch.algorithm_version}</div>
              </div>
              <div style={{ background: "var(--bg-panel-alt)", border: "var(--border)", padding: "6px 8px" }}>
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: "8px", color: "var(--text-muted)" }}>HASH_ENGINE</div>
                <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--star)", fontWeight: 700 }}>{currentSketch.hash_version}</div>
              </div>
              <div style={{ background: "var(--bg-panel-alt)", border: "var(--border)", padding: "6px 8px" }}>
                <div style={{ fontFamily: "var(--font-pixel)", fontSize: "8px", color: "var(--text-muted)" }}>STATE_LAYOUT</div>
                <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--up)", fontWeight: 700 }}>{currentSketch.representation}</div>
              </div>
            </div>
          </div>

          {/* Relational Table */}
          <div style={{ display: "flex", flexDirection: "column", height: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span className="pixel-tag" style={{ background: "var(--bg-panel-alt)", color: "var(--accent-orange)", border: "1px solid var(--accent-orange)" }}>
                TABLE: hll_registers
              </span>
              <div style={{ display: "flex", alignItems: "center", background: "var(--bg-page)", border: "1px solid rgba(255,255,255,0.2)", padding: "2px 6px" }}>
                <Search size={10} color="var(--text-muted)" />
                <input
                  placeholder="INDEX..."
                  value={filterIdx}
                  onChange={(e) => setFilterIdx(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "10px", width: "55px", marginLeft: "4px", padding: 0 }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", border: "var(--border)", background: "var(--bg-page)" }}>
              <table>
                <thead style={{ position: "sticky", top: 0 }}>
                  <tr>
                    <th>sketch_id</th>
                    <th>register_index</th>
                    <th style={{ textAlign: "right" }}>register_value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map((r) => (
                    <tr key={r.index}>
                      <td style={{ color: "var(--text-muted)" }}>{currentSketch.sketch_id}</td>
                      <td>{r.index}</td>
                      <td style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        color: r.value > 0 ? "var(--accent-orange)" : "var(--text-muted)",
                        fontWeight: r.value > 0 ? 700 : 400
                      }}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
              SHOWING {filteredRegs.length} REGISTERS (COMPOSITE PK: sketch_id, register_index)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
