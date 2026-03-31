import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import QueryConfig from "./components/QueryConfig/QueryConfig";
import BenchmarkResults from "./components/BenchmarkResults/BenchmarkResults";
import QueryOutput from "./components/QueryOutput/QueryOutput";
import { useQuery } from "./hooks/useQuery";

export default function App() {
  const { result, loading, error, execute } = useQuery();
  const [lastParams, setLastParams] = useState(null);

  const handleSubmit = (params) => {
    setLastParams(params);
    execute(params);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e0e0e0" }}>
      <Navbar />
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
        <QueryConfig onSubmit={handleSubmit} loading={loading} />
        <main style={{ flex: 1, padding: "2rem 2.5rem", overflowY: "auto" }}>

          {error && (
            <div style={{ background: "#2a1515", border: "1px solid #7f1d1d", borderRadius: 8, padding: "0.75rem 1rem", fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "#f87171", marginBottom: "1.5rem" }}>
              ⚠ {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: "1rem", color: "#444", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", opacity: 0.2 }}>⚡</div>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", maxWidth: 300, lineHeight: 1.7 }}>
                Configure a query and hit <strong style={{ color: "#666" }}>RUN QUERY</strong> to see benchmark results.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: "1rem" }}>
              <div style={{ width: 40, height: 40, border: "3px solid #222", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "#555" }}>Running query…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {result && !loading && (
            <>
              <BenchmarkResults result={result} />
              <QueryOutput result={result} queryParams={lastParams} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
