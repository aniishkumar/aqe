import { useEffect, useState } from "react";
import { getHome } from "../../api";

export default function Navbar() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    getHome().then(() => setOnline(true)).catch(() => setOnline(false));
  }, []);

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 2rem", height: "64px", background: "#0d0d0d",
      borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#7C3AED" />
          <ellipse cx="14" cy="14" rx="7" ry="5" stroke="#E879F9" strokeWidth="2" />
          <ellipse cx="14" cy="14" rx="3" ry="3" fill="#E879F9" />
        </svg>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: "#f0f0f0" }}>
          ApproxEngine
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "'Space Mono', monospace", fontSize: "0.75rem", color: "#888" }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: online === true ? "#22c55e" : online === false ? "#ef4444" : "#888",
          boxShadow: online === true ? "0 0 8px #22c55e" : "none",
          display: "inline-block",
        }} />
        Engine Status: <strong style={{ color: "#f0f0f0" }}>
          {online === null ? "Checking..." : online ? "Online" : "Offline"}
        </strong>
      </div>
    </nav>
  );
}
