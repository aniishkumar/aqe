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
      width: 290,
      minWidth: 280,
      background: "#0f172a",
      borderRight: "1px solid #1e293b",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      height: "calc(100vh - 48px)",
      overflowY: "auto",
    }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Query Configuration
        </span>
        <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
          dataset: #1
        </span>
      </div>

      {/* Dataset Info Box */}
      <div style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "4px",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
        <div style={{ fontSize: "11px", color: "#94a3b8" }}>Target Table</div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#f8fafc" }}>
          {dataInfo?.name || "NYC Taxi Trips"}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
          {dataInfo?.rows?.toLocaleString() || "100,000"} rows registered
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Operation */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: 500 }}>
            Aggregate Function
          </label>
          <select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
            style={{ width: "100%", background: "#0b0f19", border: "1px solid #334155", borderRadius: "4px", padding: "6px 8px", color: "#f8fafc" }}
          >
            {QUERY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} {t === "COUNT_DISTINCT" ? "(HyperLogLog)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Target Column */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: 500 }}>
            Target Column
          </label>
          <select
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            style={{ width: "100%", background: "#0b0f19", border: "1px solid #334155", borderRadius: "4px", padding: "6px 8px", color: "#f8fafc" }}
          >
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Precision Controls */}
        {queryType === "COUNT_DISTINCT" && (
          <div style={{
            background: "#131d2e",
            border: "1px solid #23354d",
            borderRadius: "4px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#f8fafc" }}>
                Precision parameter (p = {precisionP})
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#94a3b8" }}>
                m = {mRegisters}
              </span>
            </div>

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
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              paddingTop: "4px",
              borderTop: "1px solid #1e293b"
            }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Std Error (1.04/√m):</span>
                <span style={{ color: "#38bdf8" }}>±{theoreticalErr}%</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Memory Footprint:</span>
                <span style={{ color: "#94a3b8" }}>
                  {memoryBytes < 1024 ? `${memoryBytes} B` : `${(memoryBytes / 1024).toFixed(1)} KB`}
                </span>
              </div>
            </div>

            {/* Representation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>State Layout:</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {["DENSE", "SPARSE"].map((rep) => (
                  <button
                    type="button"
                    key={rep}
                    onClick={() => setRepresentation(rep)}
                    style={{
                      background: representation === rep ? "#2563eb" : "#0f172a",
                      border: "1px solid " + (representation === rep ? "#3b82f6" : "#334155"),
                      borderRadius: "3px",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: representation === rep ? "#ffffff" : "#94a3b8",
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

        {/* Sampling Rate */}
        {queryType !== "COUNT_DISTINCT" && (
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
              Sample Rate: {Math.round(sampleRate * 100)}%
            </label>
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

        {/* Group By */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: 500 }}>
            Group By (Optional)
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            style={{ width: "100%", background: "#0b0f19", border: "1px solid #334155", borderRadius: "4px", padding: "6px 8px", color: "#f8fafc" }}
          >
            <option value="">None (Total Dataset)</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Predicates */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
              WHERE Predicates ({filters.length})
            </label>
            <button
              type="button"
              onClick={addFilter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                background: "transparent",
                border: "1px solid #334155",
                borderRadius: "3px",
                padding: "2px 6px",
                color: "#38bdf8",
                fontSize: "10px",
                cursor: "pointer"
              }}
            >
              <Plus size={10} /> Add
            </button>
          </div>

          {filters.map((flt, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.7fr 1fr auto",
              gap: "4px",
              alignItems: "center",
              marginBottom: "4px"
            }}>
              <select
                value={flt.column}
                onChange={(e) => updateFilter(idx, "column", e.target.value)}
                style={{ padding: "4px", fontSize: "11px" }}
              >
                {columns.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select
                value={flt.operator}
                onChange={(e) => updateFilter(idx, "operator", e.target.value)}
                style={{ padding: "4px", fontSize: "11px" }}
              >
                {["=", "!=", ">", "<", ">=", "<="].map((op) => (<option key={op} value={op}>{op}</option>))}
              </select>
              <input
                value={flt.value}
                onChange={(e) => updateFilter(idx, "value", e.target.value)}
                placeholder="value"
                style={{ padding: "4px", fontSize: "11px" }}
              />
              <button
                type="button"
                onClick={() => removeFilter(idx)}
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Benchmark Checkbox */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 0",
          borderTop: "1px solid #1e293b",
          borderBottom: "1px solid #1e293b"
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#f8fafc", fontWeight: 500 }}>Exact Benchmark</div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Run full table scan to measure error</div>
          </div>
          <input
            type="checkbox"
            checked={runBenchmark}
            onChange={(e) => setRunBenchmark(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer" }}
          />
        </div>

        {/* Execute Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "4px",
            background: "#2563eb",
            border: "1px solid #1d4ed8",
            borderRadius: "4px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#ffffff",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <Play size={12} fill="#fff" />
          {loading ? "Executing Query..." : "Execute Query"}
        </button>
      </form>
    </aside>
  );
}