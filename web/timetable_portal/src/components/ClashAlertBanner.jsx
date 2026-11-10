import React from "react";
import { AlertTriangle } from "lucide-react";

const ClashAlertBanner = ({ conflicts = [] }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "var(--radius-md)",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        color: "#991b1b",
      }}
    >
      <AlertTriangle size={18} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
      <div style={{ flex: 1, fontSize: "12px" }}>
        <div style={{ fontWeight: "700", marginBottom: "0.2rem" }}>
          Scheduling Conflict Detected ({conflicts.length})
        </div>
        <ul style={{ paddingLeft: "1rem", margin: 0 }}>
          {conflicts.map((c, i) => (
            <li key={i}>
              <strong>{c.type === "teacher" ? "Teacher" : "Room"} Clash:</strong>{" "}
              {c.id || "Staff"} at <strong>{c.time}</strong> is scheduled in multiple classes (
              {c.classes.join(" & ")})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClashAlertBanner;
