import React, { useMemo } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Sparkles,
} from "lucide-react";
import { getSubjectColor } from "../../config/constants";

const TeacherFullYearView = ({
  sessions = [],
  teacher,
  academicYear = "2026 - 2027",
  selectedMonth = "ALL",
  searchQuery = "",
}) => {
  // Parse academic year range e.g. "2025 - 2026" (April 1 to March 31)
  const academicRange = useMemo(() => {
    const match = (academicYear || "").match(/(\d{4})\s*[-/]\s*(\d{4})/);
    if (!match) return null;
    return {
      startYear: parseInt(match[1], 10),
      endYear: parseInt(match[2], 10),
      startDate: `${match[1]}-04-01`,
      endDate: `${match[2]}-03-31`,
    };
  }, [academicYear]);

  // Filter sessions by academic year, month, and search query
  const filteredSessions = useMemo(() => {
    return (sessions || []).filter((s) => {
      if (!s.date) return false;

      // 1. Strict Academic Year filter
      if (academicRange) {
        if (s.date < academicRange.startDate || s.date > academicRange.endDate) {
          return false;
        }
      }

      // 2. Month filter (e.g. "04", "10")
      if (selectedMonth !== "ALL") {
        const m = s.date.slice(5, 7);
        if (m !== selectedMonth) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesClass = (s.className || "").toLowerCase().includes(q);
        const matchesSubject = (s.subject || "").toLowerCase().includes(q);
        const matchesRoom = (s.roomNumber || "").toLowerCase().includes(q);
        const matchesDate = (s.date || "").includes(q);
        return matchesClass || matchesSubject || matchesRoom || matchesDate;
      }

      return true;
    });
  }, [sessions, academicRange, selectedMonth, searchQuery]);

  // Aggregate stats strictly for this academic year
  const stats = useMemo(() => {
    const classCount = new Set();
    const subjectCount = new Set();
    let teachingLectures = 0;

    (sessions || []).forEach((s) => {
      if (!s.date) return;
      if (academicRange && (s.date < academicRange.startDate || s.date > academicRange.endDate)) {
        return;
      }
      if (!s.isBreak) {
        teachingLectures += 1;
        if (s.className) classCount.add(s.className);
        if (s.subject) subjectCount.add(s.subject);
      }
    });

    return {
      totalTeachingLectures: teachingLectures,
      totalClasses: classCount.size,
      totalSubjects: subjectCount.size,
    };
  }, [sessions, academicRange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", flex: 1, overflow: "hidden" }}>
      {/* Summary Metrics Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "0.55rem 0.95rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.6rem",
          borderRadius: "8px",
          background: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b" }}>
            {academicYear} Academic Session Lectures
          </span>
          {selectedMonth !== "ALL" && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--accent-primary)",
                background: "var(--accent-light)",
                padding: "2px 7px",
                borderRadius: "4px",
              }}
            >
              Month Filter Active
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              background: "var(--accent-light)",
              padding: "0.22rem 0.6rem",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Sparkles size={11} />
            {stats.totalTeachingLectures} Annual Lectures
          </div>
          <div
            style={{
              background: "#f1f5f9",
              padding: "0.22rem 0.6rem",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#334155",
            }}
          >
            {stats.totalClasses} Classes Handled
          </div>
        </div>
      </div>

      {/* Sessions Chronological Table */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: "10px",
          background: "#ffffff",
          border: "1px solid var(--glass-border)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                color: "#475569",
                fontWeight: "700",
                textAlign: "left",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <th style={{ padding: "0.55rem 0.85rem" }}>Date</th>
              <th style={{ padding: "0.55rem 0.85rem" }}>Day</th>
              <th style={{ padding: "0.55rem 0.85rem" }}>Time Slot</th>
              <th style={{ padding: "0.55rem 0.85rem" }}>Class & Section</th>
              <th style={{ padding: "0.55rem 0.85rem" }}>Subject</th>
              <th style={{ padding: "0.55rem 0.85rem" }}>Room</th>
              <th style={{ padding: "0.55rem 0.85rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Calendar size={28} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                  <div style={{ fontWeight: "700" }}>No sessions found for {academicYear}</div>
                  <div style={{ fontSize: "11px" }}>Try selecting another academic session or clearing search/month filters.</div>
                </td>
              </tr>
            ) : (
              filteredSessions.map((s, idx) => {
                const colorToken = getSubjectColor(s.subject);
                return (
                  <tr
                    key={s.id || idx}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                    }}
                  >
                    <td style={{ padding: "0.5rem 0.85rem", fontWeight: "700", color: "#1e293b" }}>
                      {s.date || "-"}
                    </td>
                    <td style={{ padding: "0.5rem 0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      {s.dayOfWeek || "-"}
                    </td>
                    <td style={{ padding: "0.5rem 0.85rem", fontWeight: "600", color: "#334155" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={11} /> {s.timeSlot}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.85rem", fontWeight: "700", color: "var(--accent-primary)" }}>
                      <BookOpen size={12} style={{ display: "inline", marginRight: "4px" }} />
                      {s.className}
                    </td>
                    <td style={{ padding: "0.5rem 0.85rem" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: colorToken.bg,
                          color: colorToken.text,
                          border: `1px solid ${colorToken.border}`,
                        }}
                      >
                        {s.subject}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.85rem", color: "var(--text-secondary)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <MapPin size={11} /> {s.roomNumber || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.85rem" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "12px",
                          background: s.isBreak ? "#fef3c7" : "#dcfce7",
                          color: s.isBreak ? "#b45309" : "#15803d",
                        }}
                      >
                        {s.isBreak ? "Break" : "Scheduled"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherFullYearView;
