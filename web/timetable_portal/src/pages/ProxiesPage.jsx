import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Users,
  Search,
  Plus,
  FileText,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  MapPin,
  X,
  Filter,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  fetchFreeTeachers,
  assignProxySubstitution,
  fetchDailyProxies,
  cancelProxyAssignment,
} from "../services/teacherScheduleApi";
import { fetchClasses, fetchUsers } from "../features/dataSlice";
import { exportDailyProxyPDF } from "../utils/exportUtils";

export default function ProxiesPage() {
  const dispatch = useDispatch();

  // Redux data
  const { classes = [], users = [] } = useSelector((state) => state.data || {});

  // Local state
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [allSlots, setAllSlots] = useState([]);
  const [freeTeachers, setFreeTeachers] = useState([]);
  const [engagedTeachers, setEngagedTeachers] = useState([]);
  const [dailyProxies, setDailyProxies] = useState([]);
  const [summary, setSummary] = useState({
    totalTeachers: 0,
    engagedCount: 0,
    freeCount: 0,
    proxyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Assign Proxy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [proxyForm, setProxyForm] = useState({
    substituteTeacherId: "",
    substituteTeacherName: "",
    substitutePeriodsToday: 0,
    originalTeacherId: "",
    classId: "",
    subject: "",
    roomNumber: "",
    reason: "Staff Leave / Absenteeism",
    periodIndex: 1,
    timeSlot: "",
  });

  // Ensure classes & users are loaded
  useEffect(() => {
    if (!classes || classes.length === 0) dispatch(fetchClasses());
    if (!users || users.length === 0) dispatch(fetchUsers());
  }, [dispatch, classes.length, users.length]);

  // Load session-wise free teachers and daily proxies
  const loadData = async (dateToQuery = selectedDate, slotToQuery = selectedSlot, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchFreeTeachers({
        date: dateToQuery,
        timeSlot: slotToQuery || undefined,
      });

      if (data) {
        setAllSlots(data.allSlots || []);
        if (!selectedSlot || !data.allSlots.includes(selectedSlot)) {
          setSelectedSlot(data.selectedSlot || data.allSlots[0] || "Period 1 (08:00 AM - 08:50 AM)");
        }
        setFreeTeachers(data.freeTeachers || []);
        setEngagedTeachers(data.engagedTeachers || []);
        setSummary(data.summary || {
          totalTeachers: (data.engagedTeachers?.length || 0) + (data.freeTeachers?.length || 0),
          engagedCount: data.engagedTeachers?.length || 0,
          freeCount: data.freeTeachers?.length || 0,
          proxyCount: data.dailyProxies?.length || 0,
        });
      }

      // Load all daily proxies for the selected date
      const proxies = await fetchDailyProxies(dateToQuery);
      setDailyProxies(proxies || []);
    } catch (err) {
      console.error("Failed to load free teacher report:", err);
      toast.error("Failed to load session-wise teacher roster.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate, selectedSlot);
  }, [selectedDate, selectedSlot]);

  // Filtered free teachers by search
  const filteredFreeTeachers = useMemo(() => {
    if (!searchQuery.trim()) return freeTeachers;
    const q = searchQuery.toLowerCase();
    return freeTeachers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        (t.primarySubjects && t.primarySubjects.some((s) => s.toLowerCase().includes(q)))
    );
  }, [freeTeachers, searchQuery]);

  // Filtered engaged teachers by search
  const filteredEngagedTeachers = useMemo(() => {
    if (!searchQuery.trim()) return engagedTeachers;
    const q = searchQuery.toLowerCase();
    return engagedTeachers.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.currentDuty?.className?.toLowerCase().includes(q) ||
        t.currentDuty?.subject?.toLowerCase().includes(q)
    );
  }, [engagedTeachers, searchQuery]);

  // Open modal with prefilled substitute teacher
  const handleOpenAssignModal = (teacher) => {
    // Derive period index from slot string if possible
    let pIdx = 1;
    const match = selectedSlot.match(/Period\s*(\d+)/i);
    if (match) pIdx = Number(match[1]);

    setProxyForm({
      substituteTeacherId: teacher?.id || "",
      substituteTeacherName: teacher?.name || "",
      substitutePeriodsToday: teacher?.periodsToday || 0,
      originalTeacherId: "",
      classId: classes[0]?.id || "",
      subject: teacher?.primarySubjects?.[0] || "",
      roomNumber: "",
      reason: "Staff Absenteeism",
      periodIndex: pIdx,
      timeSlot: selectedSlot,
    });
    setIsModalOpen(true);
  };

  // Submit proxy assignment (US-08)
  const handleAssignProxySubmit = async (e) => {
    e.preventDefault();
    if (!proxyForm.substituteTeacherId) {
      toast.warn("Please select a substitute teacher.");
      return;
    }
    if (!proxyForm.classId) {
      toast.warn("Please select a target classroom.");
      return;
    }

    setModalSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        period_index: proxyForm.periodIndex,
        time_slot: proxyForm.timeSlot || selectedSlot,
        class_id: proxyForm.classId,
        original_teacher_id: proxyForm.originalTeacherId || null,
        substitute_teacher_id: proxyForm.substituteTeacherId,
        subject: proxyForm.subject || "Substitution",
        room_number: proxyForm.roomNumber || null,
        reason: proxyForm.reason,
      };

      const result = await assignProxySubstitution(payload);
      if (result.success) {
        toast.success(`Proxy assigned to ${proxyForm.substituteTeacherName} successfully!`);
        setIsModalOpen(false);
        // Refresh roster
        await loadData(selectedDate, selectedSlot);
      } else {
        toast.error(result.message || "Failed to assign proxy.");
      }
    } catch (err) {
      toast.error(err.message || "Error assigning proxy.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Cancel proxy assignment
  const handleCancelProxy = async (proxyId) => {
    if (!window.confirm("Are you sure you want to cancel this proxy substitution duty?")) return;
    try {
      const res = await cancelProxyAssignment(proxyId);
      if (res.success) {
        toast.info("Proxy duty cancelled.");
        await loadData(selectedDate, selectedSlot);
      }
    } catch (err) {
      toast.error("Failed to cancel proxy.");
    }
  };

  // Export official PDF notice (US-09)
  const handleExportPDF = () => {
    exportDailyProxyPDF(selectedDate, dailyProxies);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "3rem" }}>
      {/* 1. Header Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(27, 139, 59, 0.15)",
                color: "var(--accent-primary)",
              }}
            >
              <UserCheck size={18} strokeWidth={2.4} />
            </span>
            <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              Session-Wise Free Teachers & Proxy Board
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "4px 0 0 34px" }}>
            Real-time morning assembly roster · 1-click substitution · Official printable A4 notice
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Date Picker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "8px",
              padding: "0.4rem 0.75rem",
            }}
          >
            <Calendar size={15} style={{ color: "var(--accent-primary)" }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(selectedDate, selectedSlot, true)}
            disabled={refreshing}
            className="btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.85rem",
              fontSize: "0.82rem",
              borderRadius: "8px",
              cursor: "pointer",
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              color: "var(--text-primary)",
            }}
            title="Reload live schedule data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {/* Print / Export Daily Proxy Notice (US-09) */}
          <button
            onClick={handleExportPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.45rem 1rem",
              fontSize: "0.82rem",
              fontWeight: "600",
              borderRadius: "8px",
              background: "var(--accent-primary)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(27, 139, 59, 0.25)",
            }}
          >
            <Printer size={15} />
            <span>Print Proxy Sheet (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Tiles (4 Capped Tiles) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Tile 1: Total Faculty */}
        <div
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Teaching Staff
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "2px" }}>
              {summary.totalTeachers || (freeTeachers.length + engagedTeachers.length)}
            </div>
          </div>
        </div>

        {/* Tile 2: Engaged in Current Period */}
        <div
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Engaged in Period
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "700", color: "#ef4444", marginTop: "2px" }}>
              {engagedTeachers.length}
            </div>
          </div>
        </div>

        {/* Tile 3: Available Free Faculty (Highlighted) */}
        <div
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            borderRadius: "10px",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--glass-bg))",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Available Free Faculty
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "#10b981", marginTop: "2px" }}>
              {freeTeachers.length} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)" }}>staff ready</span>
            </div>
          </div>
        </div>

        {/* Tile 4: Daily Substitutions Assigned */}
        <div
          className="glass-panel"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Substitutions Today
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: "700", color: "#f59e0b", marginTop: "2px" }}>
              {dailyProxies.length}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Period / Time Slot Navigation Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          overflowX: "auto",
          borderRadius: "10px",
        }}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", marginRight: "0.5rem", flexShrink: 0 }}>
          Select Period:
        </span>
        {allSlots.length > 0 ? (
          allSlots.map((slot, idx) => {
            const isSelected = slot === selectedSlot;
            return (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: isSelected ? "700" : "500",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  border: isSelected ? "1px solid var(--accent-primary)" : "1px solid var(--border-color, #e2e8f0)",
                  background: isSelected ? "var(--accent-primary)" : "var(--card-bg, #ffffff)",
                  color: isSelected ? "#ffffff" : "var(--text-primary)",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <span>{slot.includes("Period") ? slot.split("(")[0].trim() : `Period ${idx + 1}`}</span>
                {isSelected && (
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.25)",
                      color: "#ffffff",
                      fontSize: "0.72rem",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontWeight: "700",
                    }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
            Loading school schedule periods...
          </div>
        )}
      </div>

      {/* 4. Search Filter & View Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ position: "relative", minWidth: "280px", maxWidth: "400px", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder="Search teacher by name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.45rem 0.75rem 0.45rem 2rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              color: "var(--text-primary)",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          Showing period: <strong style={{ color: "var(--accent-primary)" }}>{selectedSlot}</strong>
        </div>
      </div>

      {/* 5. Main Split Grid: Free Teachers Pool (Left) vs. Engaged Routine (Right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Left Card: Available Free Faculty Pool */}
        <div
          className="glass-panel"
          style={{
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
              <h2 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Available Free Faculty Pool ({filteredFreeTeachers.length})
              </h2>
            </div>
            <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>
              Least-loaded first
            </span>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}>
            Teachers with no scheduled lecture in this slot. Sorted automatically by least periods taught today for fair proxy distribution.
          </p>

          {/* List of Free Teachers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredFreeTeachers.length > 0 ? (
              filteredFreeTeachers.map((teacher, idx) => {
                const taughtToday = teacher.periodsToday || 0;
                const maxDaily = 5;
                const dailyPercent = Math.min(100, Math.round((taughtToday / maxDaily) * 100));

                return (
                  <div
                    key={teacher.id}
                    style={{
                      background: "var(--card-bg, #ffffff)",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "transform 0.1s ease, box-shadow 0.1s ease",
                    }}
                    className="table-row-hover"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: "rgba(27, 139, 59, 0.12)",
                          color: "var(--accent-primary)",
                          fontWeight: "700",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : "T"}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                            {teacher.name}
                          </span>
                          {idx === 0 && (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                background: "#ecfdf5",
                                color: "#059669",
                                border: "1px solid #a7f3d0",
                                padding: "1px 5px",
                                borderRadius: "4px",
                                fontWeight: "700",
                              }}
                            >
                              Recommended
                            </span>
                          )}
                        </div>

                        {/* Primary Subjects */}
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.76rem", marginTop: "2px" }}>
                          {teacher.primarySubjects && teacher.primarySubjects.length > 0
                            ? teacher.primarySubjects.join(", ")
                            : "General Staff"}
                        </div>

                        {/* Workload Progress Bar */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "4px" }}>
                          <div style={{ width: "90px", height: "5px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${dailyPercent}%`,
                                height: "100%",
                                background: dailyPercent > 80 ? "#ef4444" : dailyPercent > 50 ? "#f59e0b" : "#10b981",
                                borderRadius: "4px",
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                            {taughtToday} of 5 taught today
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 1-Click Assign Button */}
                    <button
                      onClick={() => handleOpenAssignModal(teacher)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        borderRadius: "6px",
                        background: "rgba(27, 139, 59, 0.12)",
                        color: "var(--accent-primary)",
                        border: "1px solid rgba(27, 139, 59, 0.3)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={14} />
                      <span>Assign Proxy</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {loading ? "Checking teacher schedules..." : "No free faculty available in this period."}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Engaged Faculty & Classroom Routine */}
        <div
          className="glass-panel"
          style={{
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
              <h2 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Engaged In-Class Routine ({filteredEngagedTeachers.length})
              </h2>
            </div>
            <span style={{ fontSize: "0.72rem", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>
              Occupied
            </span>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}>
            Faculty members currently conducting classes or engaged in assigned proxy substitutions.
          </p>

          {/* List of Engaged Teachers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredEngagedTeachers.length > 0 ? (
              filteredEngagedTeachers.map((teacher) => {
                const duty = teacher.currentDuty || {};
                const isProxy = duty.isProxy;

                return (
                  <div
                    key={teacher.id}
                    style={{
                      background: isProxy ? "rgba(245, 158, 11, 0.05)" : "var(--card-bg, #ffffff)",
                      border: isProxy ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid var(--border-color, #e2e8f0)",
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: isProxy ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.12)",
                          color: isProxy ? "#f59e0b" : "#ef4444",
                          fontWeight: "700",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {teacher.name ? teacher.name.charAt(0).toUpperCase() : "T"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                            {teacher.name}
                          </span>
                          {isProxy && (
                            <span
                              style={{
                                fontSize: "0.68rem",
                                background: "#fef3c7",
                                color: "#b45309",
                                border: "1px solid #fde68a",
                                padding: "1px 5px",
                                borderRadius: "4px",
                                fontWeight: "700",
                              }}
                            >
                              On Proxy
                            </span>
                          )}
                        </div>

                        <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: "2px" }}>
                          Class: <strong style={{ color: "var(--text-primary)" }}>{duty.className || "Class"}</strong> · Subject: <strong>{duty.subject || "Class"}</strong>
                        </div>

                        {isProxy && (
                          <div style={{ fontSize: "0.72rem", color: "#b45309", marginTop: "2px" }}>
                            Substituting for: {duty.originalTeacherName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--text-secondary)", fontSize: "0.74rem" }}>
                        <MapPin size={12} />
                        <span>Room {duty.roomNumber || "-"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {loading ? "Checking schedule..." : "No engaged teachers recorded for this period."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Today's Full Substitution Arrangement Sheet Matrix (Bottom Section) */}
      <div
        className="glass-panel"
        style={{
          borderRadius: "12px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              Today's Daily Proxy Duties Log ({dailyProxies.length})
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "2px 0 0" }}>
              Full summary of substitutions assigned for {selectedDate}. Recorded for assembly notice and staff room register.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={dailyProxies.length === 0}
            className="btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.75rem",
              fontSize: "0.78rem",
              borderRadius: "6px",
              cursor: dailyProxies.length === 0 ? "not-allowed" : "pointer",
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              color: "var(--text-primary)",
            }}
          >
            <FileText size={14} />
            <span>Export Table PDF</span>
          </button>
        </div>

        {/* Tabular Roster */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.82rem",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--accent-light, #f0fdf4)",
                  color: "var(--accent-primary, #1b8b3b)",
                  borderBottom: "2px solid rgba(27, 139, 59, 0.2)",
                  height: "38px",
                }}
              >
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700", width: "40px" }}>#</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Period / Slot</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Class & Sec</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Absent Faculty</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Assigned Substitute</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Subject</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Room</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700" }}>Reason / Notes</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: "700", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dailyProxies.length > 0 ? (
                dailyProxies.map((p, idx) => {
                  const className = p.class?.name
                    ? `${p.class.name}${p.class.section ? ` - ${p.class.section}` : ""}`
                    : (p.className || "-");
                  const regularName = p.original?.name || p.originalTeacherName || "Staff Leave";
                  const subName = p.substitute?.name || p.substituteTeacherName || "Staff";

                  return (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: "1px solid var(--border-color, #e2e8f0)",
                        height: "38px",
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)" }}>{idx + 1}</td>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: "600" }}>{p.time_slot || `Period ${p.period_index}`}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <span style={{ fontWeight: "700", color: "var(--accent-primary)" }}>{className}</span>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#ef4444" }}>{regularName}</td>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: "700", color: "#10b981" }}>{subName}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{p.subject || "Substitution"}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{p.room_number || "-"}</td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontSize: "0.78rem" }}>{p.reason || "-"}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        <button
                          onClick={() => handleCancelProxy(p.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                          }}
                          title="Cancel this proxy substitution"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No proxy substitutions assigned yet for this date. Click "+ Assign Proxy" next to any free teacher above to log an arrangement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. 1-Click Assign Proxy Modal (US-08) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "520px",
              borderRadius: "14px",
              padding: "1.5rem",
              background: "var(--card-bg, #ffffff)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: "rgba(27, 139, 59, 0.15)",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserCheck size={16} />
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                  Assign Proxy Substitution
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignProxySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Selected Substitute Faculty Banner */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>
                    Selected Substitute Faculty
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#15803d", marginTop: "1px" }}>
                    {proxyForm.substituteTeacherName}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#166534" }}>
                    Slot: {proxyForm.timeSlot || selectedSlot}
                  </span>
                </div>
              </div>

              {/* Absent Faculty (Original Teacher) */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Absent / Regular Faculty (Optional)
                </label>
                <select
                  value={proxyForm.originalTeacherId}
                  onChange={(e) => setProxyForm({ ...proxyForm, originalTeacherId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    background: "var(--card-bg, #ffffff)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                >
                  <option value="">-- Select Absent Teacher (if known) --</option>
                  {(users || [])
                    .filter((u) => u.type === "teacher" || u.role === "teacher")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Classroom & Division */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Target Class & Sec *
                  </label>
                  <select
                    required
                    value={proxyForm.classId}
                    onChange={(e) => setProxyForm({ ...proxyForm, classId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      background: "var(--card-bg, #ffffff)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="">-- Select Class --</option>
                    {(classes || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(${c.section})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maths, Science..."
                    value={proxyForm.subject}
                    onChange={(e) => setProxyForm({ ...proxyForm, subject: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      background: "var(--card-bg, #ffffff)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>

              {/* Room & Reason */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 102"
                    value={proxyForm.roomNumber}
                    onChange={(e) => setProxyForm({ ...proxyForm, roomNumber: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      background: "var(--card-bg, #ffffff)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Reason for Substitution
                  </label>
                  <select
                    value={proxyForm.reason}
                    onChange={(e) => setProxyForm({ ...proxyForm, reason: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      background: "var(--card-bg, #ffffff)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="Staff Absenteeism">Staff Absenteeism</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="OD / Official Workshop">OD / Official Workshop</option>
                    <option value="Emergency Duty">Emergency Duty</option>
                    <option value="Late Arrival">Late Arrival</option>
                    <option value="Parent Meeting">Parent Meeting</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    background: "var(--card-bg, #ffffff)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    borderRadius: "6px",
                    background: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    cursor: modalSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(27, 139, 59, 0.25)",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{modalSubmitting ? "Dispatching..." : "Confirm & Assign Proxy"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
