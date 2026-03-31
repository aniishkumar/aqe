import { useEffect, useState } from "react";
import { useDataInfo } from "../../hooks/useQuery";

const QUERY_TYPES = ["AVG", "SUM", "COUNT", "COUNT_DISTINCT"];

// COUNT doesn't need a column
const NEEDS_COLUMN = (qt) => qt !== "COUNT";

const s = {
  panel: {
    width: 300,
    minWidth: 280,
    background: "#111",
    borderRight: "1px solid #1e1e1e",
    padding: "2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    height: "calc(100vh - 64px)",
    overflowY: "auto",
    position: "sticky",
    top: 64,
  },
  label: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.12em",
    color: "#666",
    fontWeight: 700,
  },
  input: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "0.6rem 0.8rem",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.8rem",
    color: "#e0e0e0",
    width: "100%",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
};

export default function QueryConfig({ onSubmit, loading }) {
  const { dataInfo, fetchInfo } = useDataInfo();
  const [queryType, setQueryType] = useState("AVG");
  const [column, setColumn] = useState("");
  const [sampleRate, setSampleRate] = useState(0.1);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  useEffect(() => {
    if (dataInfo?.columns?.length) setColumn(dataInfo.columns[0]);
  }, [dataInfo]);

  const columns = dataInfo?.columns || [];
  const needsColumn = NEEDS_COLUMN(queryType);
  const canSubmit = !loading && (!needsColumn || column);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      query_type: queryType,
      column: needsColumn ? column : "*",
      sample_rate: sampleRate,
    });
  };

  return (
    <aside style={s.panel}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>⚡</span>
        <h2
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#c084fc",
            margin: 0,
          }}
        >
          QUERY CONFIG
        </h2>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #1e1e1e" }} />

      {/* DATASET */}
      <div style={s.field}>
        <label style={s.label}>DATASET</label>
        <div style={s.input}>
          {dataInfo?.name || "NYC Taxi Data"}
        </div>
      </div>

      {/* QUERY TYPE */}
      <div style={s.field}>
        <label style={s.label}>QUERY TYPE</label>
        <select
          style={s.input}
          value={queryType}
          onChange={(e) => setQueryType(e.target.value)}
        >
          {QUERY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* COLUMN */}
      {needsColumn && (
        <div style={s.field}>
          <label style={s.label}>TARGET COLUMN</label>
          {columns.length > 0 ? (
            <select
              style={s.input}
              value={column}
              onChange={(e) => setColumn(e.target.value)}
            >
              {columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              style={s.input}
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              placeholder="e.g. fare_amount"
            />
          )}
        </div>
      )}

      {/* SAMPLE RATE */}
      <div style={s.field}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label style={s.label}>SAMPLE RATE</label>
          <span
            style={{
              background: "#7c3aed22",
              border: "1px solid #7c3aed55",
              color: "#c084fc",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.7rem",
              padding: "0.1rem 0.5rem",
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            {Math.round(sampleRate * 100)}%
          </span>
        </div>

        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={sampleRate}
          onChange={(e) => setSampleRate(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#7c3aed" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.6rem",
            color: "#555",
          }}
        >
          <span>FAST &amp; APPROX</span>
          <span>SLOW &amp; EXACT</span>
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          marginTop: "auto",
          background: "linear-gradient(135deg, #a855f7)",
          border: "none",
          borderRadius: 8,
          padding: "0.85rem",
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#fff",
          cursor: canSubmit ? "pointer" : "not-allowed",
          opacity: canSubmit ? 1 : 0.5,
        }}
      >
        {loading ? "RUNNING..." : "RUN QUERY"}
      </button>
    </aside>
  );
}