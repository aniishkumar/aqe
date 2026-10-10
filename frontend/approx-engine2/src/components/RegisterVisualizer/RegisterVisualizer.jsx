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
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Title & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#f8fafc", margin: 0 }}>
            HLL Registers Inspector
          </h2>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
            Direct inspection of PostgreSQL table <code>hll_registers</code> with composite key <code>(sketch_id, register_index)</code>.
          </p>
        </div>

        {/* Build new sketch toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <select
            value={buildCol}
            onChange={(e) => setBuildCol(e.target.value)}
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            {columns.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select
            value={buildP}
            onChange={(e) => setBuildP(parseInt(e.target.value))}
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            {[6, 8, 10, 12, 14].map((p) => (<option key={p} value={p}>p={p} (m={1 << p})</option>))}
          </select>
          <button
            onClick={handleBuildNew}
            disabled={loading}
            style={{
              background: "#2563eb",
              border: "1px solid #1d4ed8",
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <Plus size={11} /> Build Sketch
          </button>
        </div>
      </div>

      {/* Sketch List Bar */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {sketches.map((s) => {
          const isSelected = s.sketch_id === selectedSketchId;
          return (
            <button
              key={s.sketch_id}
              onClick={() => setSelectedSketchId(s.sketch_id)}
              style={{
                background: isSelected ? "#1e293b" : "#0f172a",
                border: "1px solid " + (isSelected ? "#3b82f6" : "#1e293b"),
                borderRadius: "4px",
                padding: "6px 10px",
                textAlign: "left",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: isSelected ? "#ffffff" : "#94a3b8" }}>
                  #{s.sketch_id} - {s.column_name}
                </span>
                {s.is_current && (
                  <span style={{ background: "#16a34a22", border: "1px solid #16a34a44", color: "#16a34a", fontSize: "9px", padding: "1px 4px", borderRadius: "2px" }}>
                    CURRENT
                  </span>
                )}
              </div>
              <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#64748b", marginTop: "2px" }}>
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
          gap: "12px",
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "4px",
          padding: "14px"
        }}>
          {/* Histogram */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
                Statistic Distribution: &rho;(w) Max Leading Zeros
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#64748b" }}>
                m = {currentSketch.register_count} Buckets
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "flex-end",
              height: "150px",
              gap: "3px",
              padding: "8px 0",
              borderBottom: "1px solid #1e293b"
            }}>
              {Array.from({ length: 24 }).map((_, lzVal) => {
                const count = distribution[lzVal] || 0;
                const heightPct = (count / maxFreq) * 100;
                return (
                  <div
                    key={lzVal}
                    title={`Leading zeros: ${lzVal}\nRegisters: ${count}`}
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
                      background: count > 0 ? "#2563eb" : "transparent",
                      borderRadius: "1px 1px 0 0"
                    }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                      {lzVal}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "4px" }}>
              Leading zero count &rho;(w) &isin; [0, 64]
            </div>

            {/* Metadata specs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "12px" }}>
              <div style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Algorithm</div>
                <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#f8fafc", fontWeight: 500 }}>{currentSketch.algorithm_version}</div>
              </div>
              <div style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Hash Engine</div>
                <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 500 }}>{currentSketch.hash_version}</div>
              </div>
              <div style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "6px 8px", borderRadius: "3px" }}>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Representation</div>
                <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#16a34a", fontWeight: 500 }}>{currentSketch.representation}</div>
              </div>
            </div>
          </div>

          {/* Relational Table */}
          <div style={{ display: "flex", flexDirection: "column", height: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
                Table: <code>hll_registers</code>
              </span>
              <div style={{ display: "flex", alignItems: "center", background: "#0b0f19", border: "1px solid #334155", borderRadius: "3px", padding: "2px 6px" }}>
                <Search size={10} color="#64748b" />
                <input
                  placeholder="Index..."
                  value={filterIdx}
                  onChange={(e) => setFilterIdx(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "#fff", fontSize: "11px", width: "60px", marginLeft: "4px", padding: "0" }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #1e293b", borderRadius: "3px" }}>
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
                      <td className="mono" style={{ color: "#64748b" }}>{currentSketch.sketch_id}</td>
                      <td className="mono">{r.index}</td>
                      <td className="mono" style={{ textAlign: "right", color: r.value > 0 ? "#f8fafc" : "#64748b", fontWeight: r.value > 0 ? 600 : 400 }}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
              Showing {filteredRegs.length} register rows (composite PK: sketch_id, register_index).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
