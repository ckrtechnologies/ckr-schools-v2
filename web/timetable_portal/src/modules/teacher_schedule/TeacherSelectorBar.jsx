import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  User,
  Calendar,
  Grid,
  FileSpreadsheet,
  FileText,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Users,
  Check,
  X,
  Sliders,
  Printer,
} from "lucide-react";
import UserAvatar from "../../components/UserAvatar";

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
];

const ACADEMIC_YEARS = ["2026 - 2027", "2025 - 2026", "2024 - 2025"];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "T";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Custom Searchable Teacher Dropdown with an explicit search box,
 * keyboard navigation, outside click handler, and live filtering.
 */
const TeacherSearchDropdown = ({
  teachers = [],
  selectedTeacherId,
  onSelectTeacher,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  // Filter teachers by name, subject, email, or phone
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase().trim();
    return teachers.filter((t) => {
      const nameMatch = (t.name || "").toLowerCase().includes(q);
      const emailMatch = (t.email || "").toLowerCase().includes(q);
      const phoneMatch = (t.phone || "").toLowerCase().includes(q);
      const subjectMatch = (t.subjectsTaught || []).some((s) =>
        s.toLowerCase().includes(q)
      );
      return nameMatch || emailMatch || phoneMatch || subjectMatch;
    });
  }, [teachers, searchQuery]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      // Auto-focus search box when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          height: "34px",
          backgroundColor: "#ffffff",
          border: isOpen ? "1.5px solid #1b8b3b" : "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "0 8px 0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 0 0 2px rgba(27, 139, 59, 0.2)"
            : "0 1px 2px rgba(0, 0, 0, 0.04)",
          transition: "all 0.15s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <Search size={13} color="#1b8b3b" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: selectedTeacher ? "#1e293b" : "#94a3b8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedTeacher ? selectedTeacher.name : "Search & Select Teacher..."}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {selectedTeacher?.weeklyRoutineLoad > 0 && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "#166534",
                backgroundColor: "#dcfce7",
                padding: "1px 5px",
                borderRadius: "4px",
              }}
            >
              {selectedTeacher.weeklyRoutineLoad} per
            </span>
          )}
          <ChevronDown
            size={14}
            color="#64748b"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </div>
      </button>

      {/* Floating Dropdown Panel with Dedicated Search Box */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            width: "360px",
            maxWidth: "90vw",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            boxShadow:
              "0 12px 28px -4px rgba(0, 0, 0, 0.18), 0 6px 12px -4px rgba(0, 0, 0, 0.08)",
            zIndex: 99999,
            overflow: "hidden",
            animation: "fadeIn 0.12s ease",
          }}
        >
          {/* SEARCH BOX HEADER */}
          <div
            style={{
              padding: "8px 10px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "9px",
                  color: "#1b8b3b",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teacher by name, subject, or email..."
                style={{
                  width: "100%",
                  height: "32px",
                  padding: "0 28px 0 28px",
                  fontSize: "12px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "1.5px solid #1b8b3b",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 0 0 2px rgba(27, 139, 59, 0.12)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    position: "absolute",
                    right: "7px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    padding: "2px",
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "5px",
                padding: "0 2px",
                fontSize: "10.5px",
              }}
            >
              <span style={{ fontWeight: "700", color: "#64748b" }}>
                {filteredTeachers.length} of {teachers.length} teachers
              </span>
              {searchQuery && (
                <span style={{ color: "#166534", fontWeight: "600" }}>
                  Filter: "{searchQuery}"
                </span>
              )}
            </div>
          </div>

          {/* TEACHERS LIST */}
          <div
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {filteredTeachers.length === 0 ? (
              <div
                style={{
                  padding: "1.5rem 1rem",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  No teacher matching "{searchQuery}"
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1b8b3b",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear search query
                </button>
              </div>
            ) : (
              filteredTeachers.map((t) => {
                const isSelected = t.id === selectedTeacherId;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTeacher(t.id);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#dcfce7" : "transparent",
                      borderLeft: isSelected ? "3px solid #16a34a" : "3px solid transparent",
                      transition: "background 0.12s ease",
                      marginBottom: "1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {/* Avatar */}
                      <UserAvatar src={t.avatar_url} name={t.name} size={26} />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: isSelected ? "800" : "600",
                            color: isSelected ? "#15803d" : "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.name}
                        </div>
                        {t.subjectsTaught?.length > 0 && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: isSelected ? "#166534" : "#64748b",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.subjectsTaught.slice(0, 3).join(", ")}
                            {t.subjectsTaught.length > 3
                              ? ` +${t.subjectsTaught.length - 3}`
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                        marginLeft: "6px",
                      }}
                    >
                      {t.weeklyRoutineLoad > 0 && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#64748b",
                            backgroundColor: isSelected
                              ? "rgba(22, 163, 74, 0.15)"
                              : "#f1f5f9",
                            padding: "1px 5px",
                            borderRadius: "4px",
                          }}
                        >
                          {t.weeklyRoutineLoad} per
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} color="#16a34a" strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TeacherSelectorBar = ({
  teachers = [],
  selectedTeacherId,
  onSelectTeacher,
  activeView,
  onChangeView,
  onExportPDF,
  onExportExcel,
  onExportDiarySlip,
  onBulkExportSlips,
  routineSummary,
  selectedTeacher,
  loading = false,
  weekRange,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  academicYear,
  onChangeAcademicYear,
  selectedMonth,
  onChangeMonth,
  yearlySearch,
  onChangeYearlySearch,
  matrixSearch,
  onChangeMatrixSearch,
  totalFacultyCount,
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: "0.75rem 1.15rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
        borderRadius: "12px",
        border: "1px solid var(--glass-border)",
        background: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* ========================================================================= */}
      {/* ROW 1: FIXED 3-COLUMN HEADER TOOLBAR (Tabs are strictly locked in center) */}
      {/* ========================================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "350px 1fr 310px",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Left Column (Fixed Width: 350px) - Search & Select Teacher Combobox */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(27, 139, 59, 0.12)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activeView === "matrix" ? (
              <Users size={18} strokeWidth={2.4} />
            ) : (
              <User size={18} strokeWidth={2.4} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label
              style={{
                display: "block",
                fontSize: "10.5px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-secondary)",
                marginBottom: "2px",
              }}
            >
              {activeView === "allotment"
                ? "School Allotment"
                : activeView === "matrix"
                ? "Faculty Matrix"
                : "Search & Select Teacher"}
            </label>
            {activeView === "matrix" || activeView === "allotment" ? (
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#1e293b",
                  padding: "0.25rem 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {activeView === "allotment"
                  ? "Master Class-Subject Matrix"
                  : `All Teaching Staff (${totalFacultyCount || teachers.length})`}
              </div>
            ) : (
              <TeacherSearchDropdown
                teachers={teachers}
                selectedTeacherId={selectedTeacherId}
                onSelectTeacher={onSelectTeacher}
              />
            )}
          </div>
        </div>

        {/* Center Column: STRICTLY FIXED POSITION VIEW TABS */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#e2e8f0",
              padding: "4px",
              borderRadius: "10px",
              gap: "5px",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {/* 1. Weekly Routine Tab - Solid Blue */}
            <button
              onClick={() => onChangeView("routine")}
              className="btn"
              style={{
                minWidth: "140px",
                height: "36px",
                padding: "0 0.85rem",
                fontSize: "12px",
                fontWeight: "800",
                borderRadius: "7px",
                background: activeView === "routine" ? "#1d4ed8" : "#ffffff",
                color: activeView === "routine" ? "#ffffff" : "#1e293b",
                border: activeView === "routine" ? "1.5px solid #1e40af" : "1px solid #cbd5e1",
                boxShadow:
                  activeView === "routine"
                    ? "0 3px 8px rgba(29, 78, 216, 0.35)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Clock
                size={14}
                strokeWidth={2.4}
                style={{ color: activeView === "routine" ? "#ffffff" : "#1d4ed8" }}
              />
              Weekly Routine
            </button>

            {/* 2. Full-Year Schedule Tab - Solid Amber Bronze */}
            <button
              onClick={() => onChangeView("yearly")}
              className="btn"
              style={{
                minWidth: "145px",
                height: "36px",
                padding: "0 0.85rem",
                fontSize: "12px",
                fontWeight: "800",
                borderRadius: "7px",
                background: activeView === "yearly" ? "#d97706" : "#ffffff",
                color: activeView === "yearly" ? "#ffffff" : "#1e293b",
                border: activeView === "yearly" ? "1.5px solid #b45309" : "1px solid #cbd5e1",
                boxShadow:
                  activeView === "yearly"
                    ? "0 3px 8px rgba(217, 119, 6, 0.35)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Calendar
                size={14}
                strokeWidth={2.4}
                style={{ color: activeView === "yearly" ? "#ffffff" : "#d97706" }}
              />
              Full-Year Schedule
            </button>

            {/* 3. Faculty Quotas Tab - Solid Royal Purple */}
            <button
              onClick={() => onChangeView("matrix")}
              className="btn"
              style={{
                minWidth: "135px",
                height: "36px",
                padding: "0 0.75rem",
                fontSize: "12px",
                fontWeight: "800",
                borderRadius: "7px",
                background: activeView === "matrix" ? "#7c3aed" : "#ffffff",
                color: activeView === "matrix" ? "#ffffff" : "#1e293b",
                border: activeView === "matrix" ? "1.5px solid #6d28d9" : "1px solid #cbd5e1",
                boxShadow:
                  activeView === "matrix"
                    ? "0 3px 8px rgba(124, 58, 237, 0.35)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              title="Configure Teacher Weekly Period Quotas & Ceilings"
            >
              <Sliders
                size={14}
                strokeWidth={2.4}
                style={{ color: activeView === "matrix" ? "#ffffff" : "#7c3aed" }}
              />
              Faculty Quotas
            </button>

            {/* 4. Master Allotment Matrix Tab - Solid Emerald Green */}
            <button
              onClick={() => onChangeView("allotment")}
              className="btn"
              style={{
                minWidth: "155px",
                height: "36px",
                padding: "0 0.75rem",
                fontSize: "12px",
                fontWeight: "800",
                borderRadius: "7px",
                background: activeView === "allotment" ? "var(--accent-primary)" : "#ffffff",
                color: activeView === "allotment" ? "#ffffff" : "#1e293b",
                border: activeView === "allotment" ? "1.5px solid #15803d" : "1px solid #cbd5e1",
                boxShadow:
                  activeView === "allotment"
                    ? "0 3px 8px rgba(27, 139, 59, 0.35)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              title="Pair Classes & Subjects with Teachers (Master Allotment Chart)"
            >
              <Grid
                size={14}
                strokeWidth={2.4}
                style={{ color: activeView === "allotment" ? "#ffffff" : "var(--accent-primary)" }}
              />
              Class Allotment
            </button>
          </div>
        </div>

        {/* Right Column: FIXED EXPORT BUTTONS & ACTIONS (Pinned to the right: 350px) */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
          {activeView !== "matrix" && (
            <button
              onClick={() => onChangeView("matrix")}
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "12px",
                fontWeight: "700",
                color: "#7c3aed",
                backgroundColor: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              title="View & Configure Weekly Faculty Quotas"
            >
              <Sliders size={13} />
              Faculty Quotas
            </button>
          )}

          {activeView === "routine" && onExportDiarySlip && (
            <button
              onClick={onExportDiarySlip}
              className="btn btn-secondary"
              disabled={loading}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--accent-primary)",
                backgroundColor: "rgba(27, 139, 59, 0.08)",
                border: "1px solid rgba(27, 139, 59, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              title="Print teacher diary schedule slip with letterhead and signatures (US-13)"
            >
              <Printer size={13} />
              Diary Slip (PDF)
            </button>
          )}

          {activeView === "routine" && onBulkExportSlips && (
            <button
              onClick={onBulkExportSlips}
              className="btn btn-secondary"
              disabled={loading}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "12px",
                fontWeight: "700",
                color: "#7c3aed",
                backgroundColor: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              title="1-Click bulk print all active teachers diary routine slips into a multi-page PDF (US-14)"
            >
              <Printer size={13} />
              Bulk Slips (All)
            </button>
          )}

          <button
            onClick={onExportPDF}
            className="btn btn-secondary"
            disabled={loading}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "12px",
              fontWeight: "700",
              color: "#dc2626",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              borderRadius: "8px",
            }}
            title="Download formatted A4 landscape PDF"
          >
            <FileText size={14} />
            Export PDF
          </button>

          <button
            onClick={onExportExcel}
            className="btn btn-secondary"
            disabled={loading}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "12px",
              fontWeight: "700",
              color: "#16a34a",
              backgroundColor: "rgba(22, 163, 74, 0.08)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              borderRadius: "8px",
            }}
            title="Download structured Excel (.xlsx) file"
          >
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: DEDICATED CONTEXTUAL FILTER BAR (Fixed position beneath Row 1)    */}
      {/* ========================================================================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          paddingTop: "0.55rem",
          borderTop: "1px solid #f1f5f9",
          gap: "0.75rem",
          minHeight: "36px",
        }}
      >
        {/* --- VIEW 1: WEEKLY ROUTINE CONTEXT BAR --- */}
        {activeView === "routine" && (
          <>
            {/* Left: Week Navigator */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <button
                onClick={onPrevWeek}
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.45rem", border: "1px solid #cbd5e1" }}
                title="Previous Week"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={onCurrentWeek}
                className="btn btn-secondary"
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "0.25rem 0.55rem",
                  border: "1px solid #cbd5e1",
                }}
              >
                This Week
              </button>
              <button
                onClick={onNextWeek}
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.45rem", border: "1px solid #cbd5e1" }}
                title="Next Week"
              >
                <ChevronRight size={14} />
              </button>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11.5px",
                  fontWeight: "800",
                  color: "var(--accent-primary)",
                  background: "var(--accent-light)",
                  padding: "0.22rem 0.6rem",
                  borderRadius: "6px",
                  marginLeft: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                <Calendar size={12} />
                {weekRange?.label || "Current Week"}
              </span>
            </div>

            {/* Right: Teacher Stats & Subjects */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: "700",
                  color: "var(--accent-primary)",
                  background: "var(--accent-light)",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Sparkles size={11} />
                {routineSummary?.totalWeeklyPeriods !== undefined
                  ? `${routineSummary.totalWeeklyPeriods} Scheduled this week`
                  : `${selectedTeacher?.weeklyRoutineLoad || 0} Periods / Week`}
              </span>

              {selectedTeacher?.email && (
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  ✉️ {selectedTeacher.email}
                </span>
              )}

              {selectedTeacher?.phone && (
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  📞 {selectedTeacher.phone}
                </span>
              )}

              {selectedTeacher?.subjectsTaught?.length > 0 && (
                <div style={{ display: "inline-flex", gap: "3px" }}>
                  {selectedTeacher.subjectsTaught.map((sub) => (
                    <span
                      key={sub}
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "600",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- VIEW 2: FULL-YEAR SCHEDULE CONTEXT BAR --- */}
        {activeView === "yearly" && (
          <>
            {/* Left: Academic Session Selector + Month Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Session:
                </span>
                <select
                  value={academicYear}
                  onChange={(e) => onChangeAcademicYear && onChangeAcademicYear(e.target.value)}
                  className="input-glass"
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "11.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Pills */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", overflowX: "auto" }}>
                {MONTHS.map((m) => {
                  const isActive = selectedMonth === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => onChangeMonth && onChangeMonth(m.value)}
                      className="btn"
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        borderRadius: "5px",
                        background: isActive ? "var(--accent-primary)" : "#ffffff",
                        color: isActive ? "#ffffff" : "var(--text-secondary)",
                        border: isActive ? "1px solid var(--accent-primary)" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Search Filter for sessions */}
            <div style={{ position: "relative", width: "230px" }}>
              <Search
                size={12}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                type="text"
                placeholder="Search class, subject, date..."
                value={yearlySearch || ""}
                onChange={(e) => onChangeYearlySearch && onChangeYearlySearch(e.target.value)}
                className="input-glass"
                style={{
                  width: "100%",
                  padding: "0.25rem 0.5rem 0.25rem 1.7rem",
                  fontSize: "11.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
          </>
        )}

        {/* --- VIEW 3: STAFF MATRIX CONTEXT BAR --- */}
        {activeView === "matrix" && (
          <>
            {/* Left: Week Navigator for Matrix */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <button
                onClick={onPrevWeek}
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.45rem", border: "1px solid #cbd5e1" }}
                title="Previous Week"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={onCurrentWeek}
                className="btn btn-secondary"
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "0.25rem 0.55rem",
                  border: "1px solid #cbd5e1",
                }}
              >
                This Week
              </button>
              <button
                onClick={onNextWeek}
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.45rem", border: "1px solid #cbd5e1" }}
                title="Next Week"
              >
                <ChevronRight size={14} />
              </button>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11.5px",
                  fontWeight: "800",
                  color: "var(--accent-primary)",
                  background: "var(--accent-light)",
                  padding: "0.22rem 0.6rem",
                  borderRadius: "6px",
                  marginLeft: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                <Calendar size={12} />
                Week of {weekRange?.label || "Current Week"}
              </span>
            </div>

            {/* Right: Faculty Search Input */}
            <div style={{ position: "relative", width: "230px" }}>
              <Search
                size={12}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                type="text"
                placeholder="Search faculty member..."
                value={matrixSearch || ""}
                onChange={(e) => onChangeMatrixSearch && onChangeMatrixSearch(e.target.value)}
                className="input-glass"
                style={{
                  width: "100%",
                  padding: "0.25rem 0.5rem 0.25rem 1.7rem",
                  fontSize: "11.5px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
          </>
        )}

        {/* --- VIEW 4: MASTER ALLOTMENT MATRIX CONTEXT BAR --- */}
        {activeView === "allotment" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: "800",
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "0.22rem 0.65rem",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <BookOpen size={12} />
                Master Class-Subject-Teacher Allotment Matrix
              </span>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                Top number: Weekly Periods · Bottom green tag: Assigned Teacher
              </span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-primary)" }}>
              Vision International School Allotment Chart
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSelectorBar;
