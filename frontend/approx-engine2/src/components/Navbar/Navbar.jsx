import { useState, useEffect } from "react";
import { getHome } from "../../api";
import { Zap, Database, GitMerge, BarChart3, FileText, Activity } from "lucide-react";

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
    { id: "query", label: "Query Console", icon: Zap },
    { id: "registers", label: "HLL Registers", icon: Database },
    { id: "merge", label: "Merge Studio", icon: GitMerge },
    { id: "analytics", label: "SQL Analytics", icon: BarChart3 },
    { id: "docs", label: "Lab Proposal & ERD", icon: FileText },
  ];

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      height: "64px",
      background: "rgba(13, 14, 23, 0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          boxShadow: "0 0 16px rgba(168, 85, 247, 0.4)"
        }}>
          <Zap size={20} color="#fff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
              AQE Engine
            </span>
            <span style={{
              background: "#7c3aed22",
              border: "1px solid #7c3aed66",
              borderRadius: 6,
              padding: "0.1rem 0.45rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              color: "#c084fc",
              fontWeight: 700
            }}>
              BCSE302P
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            Approximate Relational Query Platform (HLL++)
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
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
                gap: "0.45rem",
                padding: "0.45rem 0.85rem",
                borderRadius: 8,
                background: isActive ? "rgba(124, 58, 237, 0.2)" : "transparent",
                border: isActive ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
                color: isActive ? "#f3e8ff" : "var(--text-muted)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.78rem",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} color={isActive ? "#c084fc" : "#94a3b8"} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Status Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "#161726",
          border: "1px solid var(--border-subtle)",
          borderRadius: 20,
          padding: "0.25rem 0.75rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--text-muted)"
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: online === true ? "#10b981" : online === false ? "#ef4444" : "#94a3b8",
            boxShadow: online === true ? "0 0 8px #10b981" : "none",
            display: "inline-block",
          }} />
          <span>PostgreSQL/SQLite: </span>
          <strong style={{ color: online ? "#10b981" : "#ef4444" }}>
            {online === null ? "Connecting..." : online ? "Connected" : "Offline"}
          </strong>
        </div>
      </div>
    </header>
  );
}
