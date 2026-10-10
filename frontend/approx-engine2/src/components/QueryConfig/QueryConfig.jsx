import { useEffect, useState } from "react";
import { getDataInfo } from "../../api";
import { Play, Plus, X } from "lucide-react";

const QUERY_TYPES = ["COUNT_DISTINCT", "AVG", "SUM", "COUNT"];

export default function QueryConfig({ onSubmit, loading }) {
  const [dataInfo, setDataInfo] = useState(null);
  const [queryType, setQueryType] = useState("COUNT_DISTINCT");
  const [column, setColumn] = useState("fare_amount");
  const [precisionP, setPrecisionP] = useState(10);
  const [sampleRate, setSampleRate] = useState(0.1);
  const [representation, setRepresentation] = useState("DENSE");
  const [groupBy, setGroupBy] = useState("");
  const [runBenchmark, setRunBenchmark] = useState(true);
  const [filters, setFilters] = useState([]);

  // Accordion state
  const [sections, setSections] = useState({
    op: true,
    col: true,
    prec: true,
    grp: false,
    where: true,
  });

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    getDataInfo().then((res) => {
      setDataInfo(res);
      if (res?.columns?.length && !column) {
        setColumn(res.columns[0]);
      }
    }).catch(console.error);
  }, []);

  const columns = dataInfo?.columns || [
    "vendor_id", "pickup_datetime", "passenger_count", "trip_distance",
    "payment_type", "fare_amount", "tip_amount", "total_amount"
  ];

  const mRegisters = 1 << precisionP;
  const theoreticalErr = (1.04 / Math.sqrt(mRegisters) * 100).toFixed(2);
  const memoryBytes = mRegisters;

  const addFilter = () => {
    setFilters([...filters, { column: columns[0] || "fare_amount", operator: ">", value: "10" }]);
  };

  const removeFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx, field, val) => {
    const updated = [...filters];
    updated[idx][field] = val;
    setFilters(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      dataset_id: 1,
      query_type: queryType,
      column: queryType === "COUNT" && !column ? columns[0] : column,
      precision_p: precisionP,
      sample_rate: sampleRate,
      representation,
      group_by: groupBy || null,
      filters: filters.length > 0 ? filters : null,
      run_benchmark: runBenchmark
    });
  };

  return (
    <aside style={{
      width: "310px",
      minWidth: "290px",
      background: "var(--bg-page)",
      borderRight: "var(--border)",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      height: "calc(100vh - 44px)",
      overflowY: "auto",
    }}>
      {/* Sidebar Terminal Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "var(--border)",
        paddingBottom: "8px"
      }}>
        <span className="pixel-tag">
          QUERY_CONFIG // TREE
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "var(--text-muted)"
        }}>
          DATASET: #1
        </span>
      </div>

      {/* Target Dataset Tree Inset */}
      <div style={{
        background: "var(--bg-panel)",
        border: "var(--border)",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
        <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
          ▸ TARGET TABLE:
        </div>
        <div style={{ fontFamily: "var(--font-code)", fontSize: "12px", fontWeight: 700, color: "var(--accent-orange)" }}>
          {dataInfo?.name || "NYC_TAXI_TRIPS"}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>
          ROWS: {dataInfo?.rows?.toLocaleString() || "100,000"} REGISTERED
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* SECTION 1: AGGREGATE FUNCTION */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("op")}
            style={{
              width: "100%",
              background: "var(--accent-orange)",
              color: "var(--text-on-orange)",
              border: "none",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-pixel)",
              fontSize: "10px",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>{sections.op ? "▾" : "▸"} AGGREGATE FUNCTION</span>
            <span style={{ fontSize: "9px" }}>[SELECT]</span>
          </button>
          {sections.op && (
            <div style={{
              background: "var(--bg-page)",
              border: "var(--border)",
              borderTop: "none",
              padding: "8px"
            }}>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
                style={{ width: "100%" }}
              >
                {QUERY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} {t === "COUNT_DISTINCT" ? "[HLL++ PROBABILISTIC]" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 2: TARGET COLUMN */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("col")}
            style={{
              width: "100%",
              background: "var(--accent-orange)",
              color: "var(--text-on-orange)",
              border: "none",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-pixel)",
              fontSize: "10px",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>{sections.col ? "▾" : "▸"} TARGET COLUMN</span>
            <span style={{ fontSize: "9px" }}>[FIELD]</span>
          </button>
          {sections.col && (
            <div style={{
              background: "var(--bg-page)",
              border: "var(--border)",
              borderTop: "none",
              padding: "8px"
            }}>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value)}
                style={{ width: "100%" }}
              >
                {columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 3: HLL PRECISION ACCORDION */}
        {queryType === "COUNT_DISTINCT" && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection("prec")}
              style={{
                width: "100%",
                background: "var(--accent-orange)",
                color: "var(--text-on-orange)",
                border: "none",
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "var(--font-pixel)",
                fontSize: "10px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span>{sections.prec ? "▾" : "▸"} PRECISION (p = {precisionP})</span>
              <span style={{ fontSize: "9px" }}>m={mRegisters}</span>
            </button>
            {sections.prec && (
              <div style={{
                background: "var(--bg-page)",
                border: "var(--border)",
                borderTop: "none",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="1"
                  value={precisionP}
                  onChange={(e) => setPrecisionP(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  background: "var(--bg-panel)",
                  border: "var(--border)",
                  padding: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px"
                }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "10px" }}>THEO_ERR:</span>
                    <span style={{ color: "var(--star)" }}>&plusmn;{theoreticalErr}%</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: "10px" }}>MEM_SIZE:</span>
                    <span style={{ color: "var(--accent-orange)" }}>
                      {memoryBytes < 1024 ? `${memoryBytes} B` : `${(memoryBytes / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                </div>

                {/* DENSE / SPARSE TOGGLE */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)" }}>
                    LAYOUT:
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {["DENSE", "SPARSE"].map((rep) => {
                      const isActive = representation === rep;
                      return (
                        <button
                          type="button"
                          key={rep}
                          onClick={() => setRepresentation(rep)}
                          style={{
                            background: isActive ? "var(--accent-orange)" : "transparent",
                            color: isActive ? "var(--text-on-orange)" : "var(--text-primary)",
                            border: isActive ? "1px solid var(--accent-orange)" : "var(--border)",
                            fontFamily: "var(--font-pixel)",
                            fontSize: "9px",
                            padding: "3px 8px",
                            cursor: "pointer"
                          }}
                        >
                          {rep}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SAMPLING FOR NON-HLL */}
        {queryType !== "COUNT_DISTINCT" && (
          <div style={{ background: "var(--bg-panel)", border: "var(--border)", padding: "8px" }}>
            <div style={{ fontFamily: "var(--font-code)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
              SAMPLE_RATE: {Math.round(sampleRate * 100)}%
            </div>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={sampleRate}
              onChange={(e) => setSampleRate(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        )}

        {/* SECTION 4: GROUP BY */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("grp")}
            style={{
              width: "100%",
              background: "var(--accent-orange)",
              color: "var(--text-on-orange)",
              border: "none",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-pixel)",
              fontSize: "10px",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>{sections.grp ? "▾" : "▸"} GROUP BY</span>
            <span style={{ fontSize: "9px" }}>[OPTIONAL]</span>
          </button>
          {sections.grp && (
            <div style={{
              background: "var(--bg-page)",
              border: "var(--border)",
              borderTop: "none",
              padding: "8px"
            }}>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">(NONE - FULL DATASET)</option>
                {columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 5: WHERE PREDICATES */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("where")}
            style={{
              width: "100%",
              background: "var(--accent-orange)",
              color: "var(--text-on-orange)",
              border: "none",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-pixel)",
              fontSize: "10px",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span>{sections.where ? "▾" : "▸"} WHERE PREDICATES ({filters.length})</span>
            <span style={{ fontSize: "9px" }}>[1NF ROWS]</span>
          </button>
          {sections.where && (
            <div style={{
              background: "var(--bg-page)",
              border: "var(--border)",
              borderTop: "none",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              <button
                type="button"
                onClick={addFilter}
                style={{
                  background: "transparent",
                  color: "var(--accent-orange)",
                  border: "1px dashed var(--accent-orange)",
                  padding: "4px",
                  fontFamily: "var(--font-pixel)",
                  fontSize: "9px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px"
                }}
              >
                <Plus size={10} /> + ADD PREDICATE ROW
              </button>

              {filters.map((flt, idx) => (
                <div key={idx} style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 0.7fr 1fr auto",
                  gap: "4px",
                  alignItems: "center"
                }}>
                  <select
                    value={flt.column}
                    onChange={(e) => updateFilter(idx, "column", e.target.value)}
                    style={{ padding: "4px", fontSize: "10px" }}
                  >
                    {columns.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  <select
                    value={flt.operator}
                    onChange={(e) => updateFilter(idx, "operator", e.target.value)}
                    style={{ padding: "4px", fontSize: "10px" }}
                  >
                    {["=", "!=", ">", "<", ">=", "<="].map((op) => (<option key={op} value={op}>{op}</option>))}
                  </select>
                  <input
                    value={flt.value}
                    onChange={(e) => updateFilter(idx, "value", e.target.value)}
                    placeholder="val"
                    style={{ padding: "4px", fontSize: "10px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFilter(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--down)",
                      cursor: "pointer",
                      padding: "2px"
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EXACT BENCHMARK TOGGLE */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-panel)",
          border: "var(--border)",
          padding: "6px 8px"
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: "9px", color: "var(--text-primary)" }}>
              EXACT_BENCHMARK
            </div>
            <div style={{ fontFamily: "var(--font-code)", fontSize: "9px", color: "var(--text-muted)" }}>
              SCAN FULL TABLE TO EVAL ERROR
            </div>
          </div>
          <input
            type="checkbox"
            checked={runBenchmark}
            onChange={(e) => setRunBenchmark(e.target.checked)}
            style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--accent-orange)" }}
          />
        </div>

        {/* EXECUTE QUERY BUTTON (Solid Orange, Black Pixel Font, Press offset border) */}
        <button
          type="submit"
          disabled={loading}
          className="btn-orange"
          style={{
            marginTop: "6px",
            width: "100%",
            padding: "10px",
            fontSize: "12px",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          <Play size={12} fill="var(--text-on-orange)" />
          <span>{loading ? "EXECUTING..." : "EXECUTE QUERY"}</span>
        </button>
      </form>
    </aside>
  );
}