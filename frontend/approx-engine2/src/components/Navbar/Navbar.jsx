import { useState, useEffect } from "react";
import { getHome } from "../../api";
import { Terminal, Layers, GitMerge, BarChart2, BookOpen, Activity } from "lucide-react";

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
    { id: "query", label: "QUERY CONSOLE", icon: Terminal },
    { id: "registers", label: "HLL REGISTERS", icon: Layers },
    { id: "merge", label: "MERGE LINEAGE", icon: GitMerge },
    { id: "analytics", label: "WORKLOAD ANALYTICS", icon: BarChart2 },
    { id: "docs", label: "SCHEMA & DOCS", icon: BookOpen },
  ];

  return (
    <header style={{
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-between",
      padding: "0 12px",
      height: "44px",
      background: "var(--nav-red)",
      borderBottom: "2px solid var(--bg-page)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Terminal Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          background: "var(--accent-orange)",
          color: "var(--text-on-orange)",
          fontFamily: "var(--font-pixel)",
          fontSize: "11px",
          fontWeight: 700,
          padding: "4px 8px",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <Activity size={12} strokeWidth={3} />
          <span>AQE_TERM v1.0</span>
        </div>
        <span style={{
          fontFamily: "var(--font-code)",
          fontSize: "10px",
          color: "rgba(255, 255, 255, 0.85)",
          letterSpacing: "0.04em"
        }}>
          [POSTGRES/HLL++]
        </span>
      </div>

      {/* Nav Items */}
      <nav style={{ display: "flex", alignItems: "stretch", height: "100%", gap: "2px" }}>
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
                padding: "0 14px",
                height: "100%",
                background: isActive ? "var(--nav-red-hover)" : "transparent",
                border: "none",
                borderBottom: isActive ? "3px solid var(--text-primary)" : "3px solid transparent",
                color: isActive ? "var(--text-primary)" : "rgba(255, 255, 255, 0.75)",
                fontFamily: "var(--font-pixel)",
                fontSize: "10px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.1s ease, color 0.1s ease",
              }}
            >
              <Icon size={12} strokeWidth={2.5} color={isActive ? "var(--accent-orange)" : "currentColor"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--bg-page)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "3px 8px",
          fontFamily: "var(--font-pixel)",
          fontSize: "9px",
        }}>
          <span style={{
            width: "6px",
            height: "6px",
            background: online === true ? "var(--up)" : online === false ? "var(--down)" : "var(--text-muted)",
            display: "inline-block",
          }} />
          <span style={{ color: online ? "var(--up)" : "var(--down)" }}>
            {online === null ? "CONNECTING" : online ? "CATALOG:ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </header>
  );
}
