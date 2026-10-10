import { useEffect, useState } from "react";
import { getDataInfo } from "../../api";
import { Sliders, Plus, Trash2, Database, Cpu, CheckCircle } from "lucide-react";

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
  const memoryBytes = mRegisters; // 1 byte per register for HLL

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
      width: 340,
      minWidth: 320,
      background: "var(--bg-panel)",
      borderRight: "1px solid var(--border-subtle)",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      height: "calc(100vh - 64px)",
      overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sliders size={16} color="#c084fc" />
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.08em" }}>
            QUERY PARAMETERS
          </h2>
        </div>
        <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-dim)", background: "#1c1e30", padding: "0.15rem 0.45rem", borderRadius: 4 }}>
          3NF CONTROL
        </span>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

      {/* Dataset Info Box */}
      <div style={{
        background: "rgba(22, 23, 38, 0.6)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        padding: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)", fontWeight: 700 }}>ACTIVE DATASET</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <CheckCircle size={10} /> {dataInfo?.rows?.toLocaleString() || "100,000"} Rows
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", fontWeight: 600, color: "#e2e8f0" }}>
          {dataInfo?.name || "NYC Taxi Yellow Cab Trips"}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {/* Operation / Query Type */}
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.4rem" }}>
            OPERATION (APPROXIMATE)
          </label>
          <select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
            style={{
              width: "100%",
              background: "#161726",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              padding: "0.55rem 0.75rem",
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
            }}
          >
            {QUERY_TYPES.map((t) => (
              <option key={t} value={t}>{t} {t === "COUNT_DISTINCT" ? "(HyperLogLog)" : ""}</option>
            ))}
          </select>
        </div>

        {/* Target Column */}
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.4rem" }}>
            TARGET COLUMN
          </label>
          <select
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            style={{
              width: "100%",
              background: "#161726",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              padding: "0.55rem 0.75rem",
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
            }}
          >
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* HLL Precision Section (if COUNT_DISTINCT) */}
        {queryType === "COUNT_DISTINCT" && (
          <div style={{
            background: "rgba(124, 58, 237, 0.06)",
            border: "1px solid rgba(168, 85, 247, 0.25)",
            borderRadius: 8,
            padding: "0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#c084fc", fontWeight: 700 }}>
                HLL PRECISION (p = {precisionP})
              </span>
              <span style={{
                background: "#7c3aed33",
                border: "1px solid #7c3aed66",
                color: "#e9d5ff",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                padding: "0.1rem 0.45rem",
                borderRadius: 4
              }}>
                m = {mRegisters.toLocaleString()} Regs
              </span>
            </div>

            <input
              type="range"
              min="4"
              max="16"
              step="1"
              value={precisionP}
              onChange={(e) => setPrecisionP(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "#a855f7" }}
            />

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              background: "#12111f",
              padding: "0.5rem",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem"
            }}>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block" }}>Theoretical Error:</span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>±{theoreticalErr}%</span>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block" }}>Memory Footprint:</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>
                  {memoryBytes < 1024 ? `${memoryBytes} B` : `${(memoryBytes / 1024).toFixed(1)} KB`}
                </span>
              </div>
            </div>

            {/* Representation Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.2rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-muted)" }}>Representation:</span>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {["DENSE", "SPARSE"].map((rep) => (
                  <button
                    type="button"
                    key={rep}
                    onClick={() => setRepresentation(rep)}
                    style={{
                      background: representation === rep ? "#7c3aed" : "#1a1b2e",
                      border: "none",
                      borderRadius: 4,
                      padding: "0.2rem 0.5rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      color: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    {rep}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sampling Rate (if not COUNT_DISTINCT) */}
        {queryType !== "COUNT_DISTINCT" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>
                SAMPLE RATE: {Math.round(sampleRate * 100)}%
              </label>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={sampleRate}
              onChange={(e) => setSampleRate(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#06b6d4" }}
            />
          </div>
        )}

        {/* Group By (Optional) */}
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.4rem" }}>
            GROUP BY (OPTIONAL)
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
              width: "100%",
              background: "#161726",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
              padding: "0.55rem 0.75rem",
              color: "#f1f5f9",
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
            }}
          >
            <option value="">(None - Overall Aggregate)</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Filter Predicates (Normalized 1NF query_filters) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>
              WHERE PREDICATES ({filters.length})
            </label>
            <button
              type="button"
              onClick={addFilter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 4,
                padding: "0.2rem 0.45rem",
                color: "#c084fc",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                cursor: "pointer"
              }}
            >
              <Plus size={10} /> Add
            </button>
          </div>

          {filters.map((flt, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr 1fr auto",
              gap: "0.3rem",
              alignItems: "center",
              marginBottom: "0.4rem"
            }}>
              <select
                value={flt.column}
                onChange={(e) => updateFilter(idx, "column", e.target.value)}
                style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "0.35rem", color: "#e2e8f0", fontSize: "0.68rem" }}
              >
                {columns.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select
                value={flt.operator}
                onChange={(e) => updateFilter(idx, "operator", e.target.value)}
                style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "0.35rem", color: "#e2e8f0", fontSize: "0.68rem" }}
              >
                {["=", "!=", ">", "<", ">=", "<="].map((op) => (<option key={op} value={op}>{op}</option>))}
              </select>
              <input
                value={flt.value}
                onChange={(e) => updateFilter(idx, "value", e.target.value)}
                placeholder="val"
                style={{ background: "#161726", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "0.35rem", color: "#e2e8f0", fontSize: "0.68rem" }}
              />
              <button
                type="button"
                onClick={() => removeFilter(idx)}
                style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", padding: "0.2rem" }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Benchmark Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#161726",
          border: "1px solid var(--border-subtle)",
          borderRadius: 6,
          padding: "0.6rem 0.75rem"
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#e2e8f0", fontWeight: 600 }}>
              Exact Comparison Run
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)" }}>
              Computes 100% exact scan for error analysis
            </div>
          </div>
          <input
            type="checkbox"
            checked={runBenchmark}
            onChange={(e) => setRunBenchmark(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#a855f7", cursor: "pointer" }}
          />
        </div>

        {/* Execute Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "0.5rem",
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            border: "none",
            borderRadius: 8,
            padding: "0.85rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
            opacity: loading ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease"
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              EXECUTING IN ENGINE...
            </>
          ) : (
            <>
              <Cpu size={15} />
              RUN APPROXIMATE QUERY
            </>
          )}
        </button>
      </form>
    </aside>
  );
}