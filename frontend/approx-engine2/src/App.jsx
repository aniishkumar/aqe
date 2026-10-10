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
import { AlertCircle, Terminal } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("query");
  const { result, loading, error, execute } = useQuery();
  const [lastParams, setLastParams] = useState(null);

  const handleSubmit = (params) => {
    setLastParams(params);
    execute(params);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", color: "var(--text-main)" }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "query" && (
        <div style={{ display: "flex", height: "calc(100vh - 48px)" }}>
          <QueryConfig onSubmit={handleSubmit} loading={loading} />
          <main style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
            {error && (
              <div style={{
                background: "var(--status-error-bg)",
                border: "1px solid var(--status-error-border)",
                borderRadius: "4px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#f87171",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "60%",
                gap: "8px",
                color: "#64748b",
                textAlign: "center"
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "4px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Terminal size={18} color="#94a3b8" />
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#f8fafc" }}>
                  Console Idle
                </div>
                <p style={{ fontSize: "12px", maxWidth: 360, color: "#64748b", margin: 0 }}>
                  Select aggregate parameters and click <strong>Execute Query</strong> to run HLL cardinality estimation and compare against exact table scans.
                </p>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: "8px" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                  Executing query &amp; updating registers...
                </div>
              </div>
            )}

            {result && !loading && (
              <div>
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
