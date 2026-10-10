import { useState, useEffect } from "react";
import { getHome } from "../../api";
import { Database, Terminal, Layers, GitMerge, BarChart2, BookOpen } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    getHome()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
    const interval = setInterval(() => {
      getHome()
        .then(() => setOnline(true))
        .catch(() => setOnline(false));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "query", label: "Query Console", icon: Terminal },
    { id: "registers", label: "HLL Registers", icon: Layers },
    { id: "merge", label: "Merge Lineage", icon: GitMerge },
    { id: "analytics", label: "Workload Analytics", icon: BarChart2 },
    { id: "docs", label: "Schema & Docs", icon: BookOpen },
  ];

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      height: "48px",
      background: "#0f172a",
      borderBottom: "1px solid #1e293b",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Project Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#f8fafc",
          fontWeight: 600,
          fontSize: "13px"
        }}>
          <Database size={16} color="#3b82f6" />
          <span>AQE Console</span>
        </div>
        <span style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "3px",
          padding: "2px 6px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#94a3b8"
        }}>
          PostgreSQL / HLL++
        </span>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", alignItems: "center", height: "100%", gap: "4px" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 12px",
                height: "100%",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                color: isActive ? "#ffffff" : "#94a3b8",
                fontSize: "12px",
                fontWeight: isActive ? 500 : 400,
                cursor: "pointer",
                transition: "color 0.15s ease",
              }}
            >
              <Icon size={14} color={isActive ? "#3b82f6" : "#64748b"} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Status Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          color: "#94a3b8"
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: online === true ? "#16a34a" : online === false ? "#dc2626" : "#64748b",
            display: "inline-block",
          }} />
          <span>Catalog:</span>
          <span style={{ color: online ? "#f8fafc" : "#dc2626", fontWeight: 500 }}>
            {online === null ? "Connecting..." : online ? "Connected" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
