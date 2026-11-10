import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, RefreshCw, Search } from "lucide-react";
import { getGradingTracker, getAcademicMeta } from "../services/api";
import CustomDropdown from "./CustomDropdown";
import UserAvatar from "./UserAvatar";

export default function GradingTrackerView() {
  const [data, setData] = useState({ summary: { total: 0, completed: 0, in_progress: 0, pending: 0 }, records: [] });
  const [meta, setMeta] = useState({ classes: [], terms: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTerm, setSelectedTerm] = useState("Term1");
  const [selectedYear, setSelectedYear] = useState("2026-27");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [trackerRes, metaRes] = await Promise.all([
        getGradingTracker({ term: selectedTerm, academic_year: selectedYear }),
        getAcademicMeta(),
      ]);
      setData(trackerRes || { summary: {}, records: [] });
      setMeta(metaRes || { classes: [], terms: [] });
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTerm, selectedYear]);

  const records = data.records || [];
  const filteredRecords = records.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSub = r.subject?.toLowerCase().includes(q);
      const matchCls = `class ${r.class_name} ${r.section}`.toLowerCase().includes(q);
      const matchTeacher = r.teacher?.name?.toLowerCase().includes(q);
      if (!matchSub && !matchCls && !matchTeacher) return false;
    }
    return true;
  });

  return (
    <div>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            background: toast.type === "error" ? "var(--danger)" : "var(--primary)",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "0.85rem",
            zIndex: 1000,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`kpi-card ${statusFilter === "ALL" ? "active" : ""}`}
        >
          <div className="kpi-val" style={{ color: "var(--text-primary)" }}>
            {data.summary?.total || 0}
          </div>
          <div className="kpi-lbl">Total Scheduled Exams</div>
        </div>

        <div
          onClick={() => setStatusFilter("COMPLETED")}
          className={`kpi-card ${statusFilter === "COMPLETED" ? "active" : ""}`}
        >
          <div className="kpi-val" style={{ color: "var(--primary)" }}>
            {data.summary?.completed || 0}
          </div>
          <div className="kpi-lbl">Grading Complete (100%)</div>
        </div>

        <div
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`kpi-card ${statusFilter === "IN_PROGRESS" ? "active" : ""}`}
        >
          <div className="kpi-val" style={{ color: "var(--warning)" }}>
            {data.summary?.in_progress || 0}
          </div>
          <div className="kpi-lbl">In Progress (Partially Graded)</div>
        </div>

        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`kpi-card ${statusFilter === "PENDING" ? "active" : ""}`}
        >
          <div className="kpi-val" style={{ color: "var(--danger)" }}>
            {data.summary?.pending || 0}
          </div>
          <div className="kpi-lbl">Pending Submissions</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-panel">
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "240px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search subject, class, or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "0.82rem",
              }}
            />
          </div>

          <CustomDropdown
            value={selectedTerm}
            onChange={(val) => setSelectedTerm(val)}
            placeholder="Select Term"
            minWidth="120px"
            options={[
              { value: "Term1", label: "Term1" },
              { value: "Term2", label: "Term2" },
            ]}
          />

          <CustomDropdown
            value={selectedYear}
            onChange={(val) => setSelectedYear(val)}
            placeholder="Select Academic Year"
            minWidth="200px"
            options={[
              { value: "2026-27", label: "Academic Year 2026-27" },
              { value: "2025-26", label: "Academic Year 2025-26" },
            ]}
          />

          <button onClick={loadData} className="btn btn-outline" style={{ marginLeft: "auto" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="card-panel" style={{ padding: 0 }}>
        <div className="ckr-table-container">
          <table className="ckr-table">
            <thead>
              <tr>
                <th>Class & Division</th>
                <th>Subject</th>
                <th>Assigned Teacher</th>
                <th>Date & Time</th>
                <th>Grading Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                    Loading submission progress...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No exam records matching filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const pct = r.progress_percentage || 0;
                  const isDone = r.status === "COMPLETED";
                  const isPartial = r.status === "IN_PROGRESS";

                  return (
                    <tr key={r.exam_id}>
                      <td style={{ fontWeight: "700" }}>
                        Class {r.class_name} {r.section}
                      </td>
                      <td style={{ fontWeight: "600" }}>{r.subject}</td>
                      <td>
                        {r.teacher?.name ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                            <UserAvatar src={r.teacher.avatar_url} name={r.teacher.name} size={26} />
                            <span style={{ fontWeight: "600" }}>{r.teacher.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.78rem" }}>
                          {r.date} • {r.time || "09:00"}
                        </span>
                      </td>
                      <td style={{ minWidth: "160px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              flex: 1,
                              height: "6px",
                              borderRadius: "3px",
                              background: "#e2e8f0",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: isDone ? "var(--primary)" : isPartial ? "var(--warning)" : "var(--danger)",
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: "700", width: "42px", textAlign: "right" }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {r.graded_students} of {r.total_students} students evaluated
                        </div>
                      </td>
                      <td>
                        {isDone ? (
                          <span style={{ color: "var(--primary)", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <CheckCircle size={13} /> Completed
                          </span>
                        ) : isPartial ? (
                          <span style={{ color: "var(--warning)", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Clock size={13} /> In Progress
                          </span>
                        ) : (
                          <span style={{ color: "var(--danger)", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <AlertCircle size={13} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

