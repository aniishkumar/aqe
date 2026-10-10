import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import QueryConfig from "./components/QueryConfig/QueryConfig";
import BenchmarkResults from "./components/BenchmarkResults/BenchmarkResults";
import QueryOutput from "./components/QueryOutput/QueryOutput";
import RegisterVisualizer from "./components/RegisterVisualizer/RegisterVisualizer";
import MergeStudio from "./components/MergeStudio/MergeStudio";
import AnalyticsDashboard from "./components/AnalyticsDashboard/AnalyticsDashboard";
import ProposalDocs from "./components/ProposalDocs/ProposalDocs";
import { useQuery } from "./hooks/useQuery";
import { AlertTriangle, Zap } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("query");
  const { result, loading, error, execute } = useQuery();
  const [lastParams, setLastParams] = useState(null);

  const handleSubmit = (params) => {
    setLastParams(params);
    execute(params);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-main)" }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "query" && (
        <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
          <QueryConfig onSubmit={handleSubmit} loading={loading} />
          <main style={{ flex: 1, padding: "2rem 2.5rem", overflowY: "auto" }}>
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 8,
                padding: "0.85rem 1.25rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
                color: "#f87171",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "65%",
                gap: "1.25rem",
                color: "var(--text-dim)",
                textAlign: "center"
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Zap size={30} color="#a855f7" />
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.4rem" }}>
                    Ready for Analytical Execution
                  </h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", maxWidth: 440, lineHeight: 1.6, color: "var(--text-muted)" }}>
                    Configure target column, HLL precision <code style={{ color: "#c084fc" }}>p</code>, and optional filters on the left panel, then run the query to observe sub-millisecond execution and error bounds.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65%", gap: "1rem" }}>
                <div style={{
                  width: 48,
                  height: 48,
                  border: "3px solid #222538",
                  borderTopColor: "#a855f7",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#c084fc" }}>
                  Hashing &amp; Updating HLL Registers…
                </p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-fade-in">
                <BenchmarkResults result={result} />
                <QueryOutput result={result} queryParams={lastParams} />
              </div>
            )}
          </main>
        </div>
      )}

      {activeTab === "registers" && <RegisterVisualizer />}
      {activeTab === "merge" && <MergeStudio />}
      {activeTab === "analytics" && <AnalyticsDashboard />}
      {activeTab === "docs" && <ProposalDocs />}
    </div>
  );
}
