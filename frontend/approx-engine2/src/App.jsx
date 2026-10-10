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
import { AlertCircle, Terminal, Cpu } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("query");
  const { result, loading, error, execute } = useQuery();
  const [lastParams, setLastParams] = useState(null);

  const handleSubmit = (params) => {
    setLastParams(params);
    execute(params);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "query" && (
        <div style={{ display: "flex", height: "calc(100vh - 48px)" }}>
          <QueryConfig onSubmit={handleSubmit} loading={loading} />
          <main style={{ flex: 1, padding: "16px 20px", overflowY: "auto", background: "var(--bg-page)" }}>
            {error && (
              <div style={{
                background: "rgba(255, 59, 59, 0.12)",
                border: "1px solid var(--down)",
                padding: "8px 12px",
                fontSize: "12px",
                fontFamily: "var(--font-code)",
                color: "var(--down)",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <AlertCircle size={16} strokeWidth={2} />
                <span>ERROR: {error}</span>
              </div>
            )}

            {!result && !loading && !error && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "65%",
                gap: "12px",
                textAlign: "center"
              }}>
                <div style={{
                  padding: "10px",
                  border: "1px solid var(--accent-orange)",
                  background: "var(--bg-panel)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Terminal size={24} color="var(--accent-orange)" strokeWidth={2} />
                </div>
                <div>
                  <span className="pixel-tag" style={{ marginBottom: "6px" }}>AQE SYSTEM IDLE</span>
                  <div style={{ fontSize: "14px", fontFamily: "var(--font-pixel)", color: "var(--accent-orange)", letterSpacing: "0.05em", marginTop: "4px" }}>
                    AWAITING QUERY INGESTION
                  </div>
                </div>
                <p style={{ fontSize: "12px", maxWidth: 440, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Configure analytical aggregation parameters in the left query tree and dispatch <strong style={{ color: "var(--accent-orange)" }}>EXECUTE QUERY</strong> to run HyperLogLog estimation benchmarks against PostgreSQL tables.
                </p>
                <div style={{
                  border: "var(--border)",
                  background: "var(--bg-panel)",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontFamily: "var(--font-code)",
                  color: "var(--text-muted)"
                }}>
                  READY &bull; REGISTER PIPELINE INITIALIZED &bull; 100,000 TRIP ROWS
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65%", gap: "12px" }}>
                <div style={{
                  padding: "10px",
                  border: "1px solid var(--accent-orange)",
                  background: "var(--bg-panel)",
                  animation: "pulse 1s infinite alternate"
                }}>
                  <Cpu size={24} color="var(--accent-orange)" />
                </div>
                <div style={{ fontSize: "12px", color: "var(--accent-orange)", fontFamily: "var(--font-pixel)", letterSpacing: "0.05em" }}>
                  &gt; RUNNING APPROXIMATE ESTIMATION &bull; POPULATING REGISTERS...
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
