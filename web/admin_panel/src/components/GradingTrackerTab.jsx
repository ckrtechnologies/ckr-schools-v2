import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Bell, 
  Send, 
  RefreshCw, 
  User, 
  Search, 
  ChevronRight, 
  Calendar,
  BookOpen
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";
import UserAvatar from "./UserAvatar";

const GradingTrackerTab = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    summary: { total: 0, completed: 0, in_progress: 0, pending: 0 },
    records: []
  });

  const [selectedTerm, setSelectedTerm] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [reminderModal, setReminderModal] = useState({ open: false, record: null, message: "" });

  const fetchTrackerData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (selectedTerm !== "ALL") params.term = selectedTerm;
      if (selectedClass !== "ALL") params.class_id = selectedClass;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await api.get("/academic_manager/grading-tracker", { params });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load grading tracker");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [selectedTerm, selectedClass, statusFilter]);

  // Derive unique terms and classes for dropdown filters
  const uniqueTerms = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.term).filter(Boolean)));
  }, [data.records]);

  const uniqueClasses = useMemo(() => {
    const map = new Map();
    data.records.forEach(r => {
      if (r.class_id && !map.has(r.class_id)) {
        map.set(r.class_id, `${r.class_name} ${r.section ? `(${r.section})` : ""}`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [data.records]);

  // Client search filter
  const filteredRecords = useMemo(() => {
    return data.records.filter(r => {
      const matchSearch = searchQuery.trim() === "" ||
        r.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.term?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.class_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [data.records, searchQuery]);

  const handleOpenReminderModal = (record) => {
    setReminderModal({
      open: true,
      record,
      message: `Urgent: Please submit grades for ${record.subject} (Class ${record.class_name} ${record.section}) for ${record.term} before the deadline.`
    });
  };

  const handleSendReminder = async () => {
    const { record, message } = reminderModal;
    if (!record || !record.teacher?.id) {
      toast.warn("No assigned teacher found for this subject.");
      return;
    }

    setSendingReminderId(record.exam_id);
    try {
      const res = await api.post("/academic_manager/grading-tracker/remind", {
        exam_id: record.exam_id,
        teacher_id: record.teacher.id,
        custom_message: message
      });

      if (res.data.success) {
        toast.success(`Reminder sent to ${record.teacher.name}!`);
        setReminderModal({ open: false, record: null, message: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder");
    } finally {
      setSendingReminderId(null);
    }
  };

  const { summary } = data;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
      
      {/* 4 Clickable KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        
        {/* KPI 1: Total Exams */}
        <div 
          onClick={() => setStatusFilter("ALL")}
          style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "12px",
            border: statusFilter === "ALL" ? "2px solid #3b82f6" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Scheduled</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>{summary.total}</div>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Scheduled Exam Papers</span>
        </div>

        {/* KPI 2: Completed Submissions */}
        <div 
          onClick={() => setStatusFilter("COMPLETED")}
          style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "12px",
            border: statusFilter === "COMPLETED" ? "2px solid #16a34a" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>Completed</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#16a34a" }}>{summary.completed}</div>
          <span style={{ fontSize: "0.75rem", color: "#16a34a" }}>100% Students Graded</span>
        </div>

        {/* KPI 3: In Progress Submissions */}
        <div 
          onClick={() => setStatusFilter("IN_PROGRESS")}
          style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "12px",
            border: statusFilter === "IN_PROGRESS" ? "2px solid #ea580c" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#ea580c", textTransform: "uppercase" }}>In Progress</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ea580c" }}>{summary.in_progress}</div>
          <span style={{ fontSize: "0.75rem", color: "#ea580c" }}>Partially Graded</span>
        </div>

        {/* KPI 4: Pending Submissions */}
        <div 
          onClick={() => setStatusFilter("PENDING")}
          style={{
            background: "#ffffff",
            padding: "1.25rem",
            borderRadius: "12px",
            border: statusFilter === "PENDING" ? "2px solid #dc2626" : "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#dc2626", textTransform: "uppercase" }}>Pending</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#dc2626" }}>{summary.pending}</div>
          <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>0 Marks Submitted</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.4rem 0.75rem", minWidth: "260px" }}>
          <Search size={16} color="#64748b" style={{ marginRight: "8px" }} />
          <input
            type="text"
            placeholder="Search Subject, Class or Teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: "0.875rem", color: "#0f172a" }}
          />
        </div>

        {/* Dropdowns */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          
          {/* Term Filter */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="input-glass"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", minWidth: "140px" }}
          >
            <option value="ALL">All Terms</option>
            {uniqueTerms.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-glass"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", minWidth: "150px" }}
          >
            <option value="ALL">All Classes</option>
            {uniqueClasses.map((c) => (
              <option key={c.id} value={c.id}>Class {c.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-glass"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", minWidth: "130px" }}
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => fetchTrackerData(true)}
            className="btn btn-ghost"
            style={{ padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
            disabled={refreshing}
            title="Refresh tracking data"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            <span style={{ fontSize: "0.875rem" }}>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tracker Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0 }}>Loading submission tracker data...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <BookOpen size={36} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: "600", fontSize: "1rem", color: "#334155", margin: "0 0 4px" }}>No scheduled exams found</p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Adjust filters or publish date sheets to monitor teacher submissions.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#1b8b3b", color: "#ffffff", height: "38px" }}>
                  <th style={{ padding: "0 1rem", fontWeight: "700", width: "130px" }}>Class & Sec</th>
                  <th style={{ padding: "0 1rem", fontWeight: "700" }}>Subject</th>
                  <th style={{ padding: "0 1rem", fontWeight: "700" }}>Date Sheet</th>
                  <th style={{ padding: "0 1rem", fontWeight: "700" }}>Assigned Teacher</th>
                  <th style={{ padding: "0 1rem", fontWeight: "700", textAlign: "center", width: "110px" }}>Graded / Total</th>
                  <th style={{ padding: "0 1rem", fontWeight: "700", minWidth: "160px" }}>Completion %</th>
                  <th style={{ padding: "0 1rem", fontWeight: "700", textAlign: "center", width: "120px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => {
                  const isCompleted = r.status === "COMPLETED";
                  const isInProgress = r.status === "IN_PROGRESS";
                  const isPending = r.status === "PENDING";

                  const statusBg = isCompleted ? "#dcfce7" : (isInProgress ? "#ffedd5" : "#fee2e2");
                  const statusColor = isCompleted ? "#16a34a" : (isInProgress ? "#ea580c" : "#dc2626");

                  const barColor = isCompleted ? "#16a34a" : (isInProgress ? "#ea580c" : "#e2e8f0");

                  return (
                    <tr 
                      key={r.exam_id}
                      style={{ 
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        height: "48px"
                      }}
                    >
                      {/* Class */}
                      <td style={{ padding: "0.6rem 1rem", fontWeight: "700", color: "#0f172a" }}>
                        Class {r.class_name} <span style={{ color: "#64748b", fontWeight: "500" }}>({r.section})</span>
                      </td>

                      {/* Subject */}
                      <td style={{ padding: "0.6rem 1rem", fontWeight: "600", color: "#0f172a" }}>
                        {r.subject}
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "normal" }}>
                          Max: {r.max_marks}M
                        </span>
                      </td>

                      {/* Date Sheet Term */}
                      <td style={{ padding: "0.6rem 1rem", color: "#475569" }}>
                        {r.term}
                        {r.date && (
                          <span style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8" }}>
                            {r.date}
                          </span>
                        )}
                      </td>

                      {/* Assigned Teacher */}
                      <td style={{ padding: "0.6rem 1rem" }}>
                        {r.teacher ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <UserAvatar src={r.teacher.avatar_url} name={r.teacher.name} size={28} />
                            <div>
                              <div style={{ fontWeight: "600", color: "#0f172a" }}>
                                {r.teacher.name}
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {r.teacher.email || r.teacher.phone || "No contact info"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#dc2626", fontSize: "0.8rem", fontStyle: "italic", background: "#fef2f2", padding: "2px 6px", borderRadius: "4px" }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Graded / Total */}
                      <td style={{ padding: "0.6rem 1rem", textAlign: "center", fontWeight: "700", color: "#0f172a" }}>
                        {r.graded_students} <span style={{ color: "#94a3b8", fontWeight: "normal" }}>/ {r.total_students}</span>
                      </td>

                      {/* Completion Progress Bar */}
                      <td style={{ padding: "0.6rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                            <div 
                              style={{ 
                                width: `${r.progress_percentage}%`, 
                                height: "100%", 
                                background: barColor, 
                                borderRadius: "4px",
                                transition: "width 0.3s ease" 
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: statusColor, minWidth: "35px", textAlign: "right" }}>
                            {r.progress_percentage}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "0.6rem 1rem", textAlign: "center" }}>
                        <span style={{ 
                          padding: "3px 8px", 
                          borderRadius: "6px", 
                          fontSize: "0.75rem", 
                          fontWeight: "700",
                          background: statusBg,
                          color: statusColor,
                          display: "inline-block",
                          border: `1px solid ${statusColor}30`
                        }}>
                          {r.status === "COMPLETED" ? "Complete" : (r.status === "IN_PROGRESS" ? "In Progress" : "Pending")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradingTrackerTab;

