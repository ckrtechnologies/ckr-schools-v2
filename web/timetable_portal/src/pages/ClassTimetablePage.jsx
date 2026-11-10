import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  FileSpreadsheet,
  FileText,
  User,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  loadMasterData,
  loadTimeTables,
  removePeriod,
} from "../features/timetableSlice";
import PeriodModal from "../components/PeriodModal";
import DuplicateDayModal from "../components/DuplicateDayModal";
import SearchSelectDropdown from "../components/SearchSelectDropdown";
import ClashAlertBanner from "../components/ClashAlertBanner";
import { detectClashes } from "../services/clashDetector";
import { getSubjectColor } from "../config/constants";
import { exportTimetableToExcel, exportTimetableToPDF } from "../utils/timetableExport";

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ClassTimetablePage = () => {
  const dispatch = useDispatch();
  const { timeTables, classes, teachers, loadingTimeTables, loadingMasterData, saving } =
    useSelector((state) => state.timetable);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Modals state
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [activeDateForPeriod, setActiveDateForPeriod] = useState("");

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSourceDate, setDuplicateSourceDate] = useState("");

  // Load Initial Master Data & Timetables
  useEffect(() => {
    dispatch(loadMasterData());
    dispatch(loadTimeTables());
  }, [dispatch]);

  // Set default selected class
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Selected Class details
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Generate the 6 days of the week (Monday - Saturday)
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push({
        date: formatDate(d),
        dayName: dayNames[i],
        displayDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        isToday: formatDate(d) === formatDate(new Date()),
      });
    }
    return days;
  }, [currentWeekStart]);

  // Teacher lookup map for fast resolution
  const teacherMap = useMemo(() => {
    const map = new Map();
    teachers.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [teachers]);

  // Current class timetable data
  const classTimetable = useMemo(() => {
    if (!selectedClassId) return null;
    return timeTables.find((t) => t.classId === selectedClassId) || null;
  }, [timeTables, selectedClassId]);

  // Conflict Detection for this week
  const weekConflicts = useMemo(() => {
    const all = [];
    weekDays.forEach((wd) => {
      const clashes = detectClashes(timeTables, wd.date);
      all.push(...clashes);
    });
    return all;
  }, [timeTables, weekDays]);

  // Unique time slots occurring in this class across the week
  const allTimeSlots = useMemo(() => {
    const slots = new Set();
    weekDays.forEach((wd) => {
      const periods = classTimetable?.dates?.[wd.date] || [];
      periods.forEach((p) => {
        if (p.time) slots.add(p.time);
      });
    });

    return Array.from(slots).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [classTimetable, weekDays]);

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Open add modal
  const handleAddPeriod = (date) => {
    setActiveDateForPeriod(date);
    setEditingPeriod(null);
    setPeriodModalOpen(true);
  };

  // Open edit modal
  const handleEditPeriod = (period, date) => {
    setActiveDateForPeriod(date);
    setEditingPeriod(period);
    setPeriodModalOpen(true);
  };

  // Delete period
  const handleDeletePeriod = async (id) => {
    if (!window.confirm("Delete this period?")) return;
    try {
      await dispatch(removePeriod(id)).unwrap();
      toast.success("Period removed");
    } catch {
      toast.error("Failed to delete period");
    }
  };

  // Duplicate Day
  const handleOpenDuplicate = (date) => {
    setDuplicateSourceDate(date);
    setDuplicateModalOpen(true);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!currentClass) return;
    const periodRows = allTimeSlots.map((time) => {
      const dayPeriods = {};
      weekDays.forEach((wd) => {
        const p = classTimetable?.dates?.[wd.date]?.find((x) => x.time === time);
        if (p) {
          dayPeriods[wd.date] = {
            ...p,
            teacherName: teacherMap.get(p.teacher) || "",
          };
        }
      });
      return { time, dayPeriods };
    });

    const cName = `${currentClass.name || currentClass.className}-${currentClass.section}`;
    exportTimetableToExcel(cName, weekDays, periodRows, `Timetable_${cName}`);
    toast.success("Timetable exported to Excel");
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!currentClass) return;
    const periodRows = allTimeSlots.map((time) => {
      const dayPeriods = {};
      weekDays.forEach((wd) => {
        const p = classTimetable?.dates?.[wd.date]?.find((x) => x.time === time);
        if (p) {
          dayPeriods[wd.date] = {
            ...p,
            teacherName: teacherMap.get(p.teacher) || "",
          };
        }
      });
      return { time, dayPeriods };
    });

    const cName = `${currentClass.name || currentClass.className}-${currentClass.section}`;
    exportTimetableToPDF(cName, weekDays, periodRows, `Timetable_${cName}`);
    toast.success("Timetable exported to PDF");
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Header & Selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700" }}>Class Weekly Timetables</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
            Manage daily schedule, teacher allocations, and period structures
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} disabled={!selectedClassId}>
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF} disabled={!selectedClassId}>
            <FileText size={15} /> PDF Schedule
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Class Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
              Select Class:
            </span>
            <SearchSelectDropdown
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.name || c.className} - Section ${c.section}`,
                badge: "Class",
                initials: `${c.name || c.className}`.replace(/\s+/g, ""),
              }))}
              placeholder="Select Class..."
              searchPlaceholder="Search class by name or section..."
              minWidth="200px"
              dropdownWidth="280px"
              itemLabelSingular="class"
              itemLabelPlural="classes"
            />
          </div>
        </div>

        {/* Week Navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={handlePrevWeek} style={{ padding: "0.4rem 0.6rem" }}>
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleCurrentWeek}
            style={{ fontSize: "12px", padding: "0.4rem 0.8rem" }}
          >
            Today / This Week
          </button>
          <button className="btn btn-secondary" onClick={handleNextWeek} style={{ padding: "0.4rem 0.6rem" }}>
            <ChevronRight size={16} />
          </button>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginLeft: "0.5rem",
            }}
          >
            {weekDays[0]?.displayDate} – {weekDays[5]?.displayDate}
          </div>
        </div>
      </div>

      {/* Conflict Alert Banner */}
      <ClashAlertBanner conflicts={weekConflicts} />

      {/* Weekly Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0.75rem",
        }}
      >
        {weekDays.map((day) => {
          const periods = classTimetable?.dates?.[day.date] || [];
          const sortedPeriods = [...periods].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

          return (
            <div
              key={day.date}
              className="glass-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderTop: day.isToday ? "4px solid var(--accent-primary)" : "4px solid var(--glass-border)",
                background: day.isToday ? "#f0fdf4" : "white",
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--glass-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: day.isToday ? "var(--accent-light)" : "#f8fafc",
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px", color: day.isToday ? "var(--accent-primary)" : "var(--text-primary)" }}>
                    {day.dayName}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {day.displayDate}
                  </div>
                </div>

                {/* Day Actions */}
                <div style={{ display: "flex", gap: "2px" }}>
                  <button
                    onClick={() => handleOpenDuplicate(day.date)}
                    title="Duplicate this day's schedule"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleAddPeriod(day.date)}
                    title="Add Period"
                    style={{
                      border: "none",
                      background: "var(--accent-primary)",
                      color: "white",
                      cursor: "pointer",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Periods List */}
              <div style={{ padding: "0.6rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minHeight: "260px" }}>
                {sortedPeriods.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                      textAlign: "center",
                      padding: "1rem 0.5rem",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <span>No periods scheduled</span>
                    <button
                      onClick={() => handleAddPeriod(day.date)}
                      className="btn-ghost"
                      style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: "600", marginTop: "4px" }}
                    >
                      + Add Period
                    </button>
                  </div>
                ) : (
                  sortedPeriods.map((period) => {
                    const colorToken = getSubjectColor(period.subject);
                    const teacherName = teacherMap.get(period.teacher);

                    const isAssembly = period.subject === "Assembly" || (period.subject && period.subject.toLowerCase().includes("assembly"));

                    if (isAssembly) {
                      return (
                        <div
                          key={period.id}
                          style={{
                            background: "#f5f3ff",
                            border: "1px dashed #c4b5fd",
                            borderRadius: "var(--radius-md)",
                            padding: "0.5rem",
                            textAlign: "center",
                            position: "relative",
                          }}
                        >
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#6d28d9" }}>
                            🔔 Assembly
                          </div>
                          <div style={{ fontSize: "10px", color: "#7c3aed" }}>
                            {period.time}
                          </div>

                          <div style={{ position: "absolute", right: "6px", top: "6px", display: "flex", gap: "3px" }}>
                            <button
                              onClick={() => handleEditPeriod(period, day.date)}
                              style={{ border: "none", background: "none", cursor: "pointer", color: "#7c3aed", padding: "2px" }}
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (period.isBreak) {
                      return (
                        <div
                          key={period.id}
                          style={{
                            background: "#fffbeb",
                            border: "1px dashed #fde68a",
                            borderRadius: "var(--radius-md)",
                            padding: "0.5rem",
                            textAlign: "center",
                            position: "relative",
                          }}
                        >
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#b45309" }}>
                            ☕ {period.subject || "Break / Recess"}
                          </div>
                          <div style={{ fontSize: "10px", color: "#d97706" }}>
                            {period.time}
                          </div>

                          <div style={{ position: "absolute", right: "6px", top: "6px", display: "flex", gap: "3px" }}>
                            <button
                              onClick={() => handleEditPeriod(period, day.date)}
                              style={{ border: "none", background: "none", cursor: "pointer", color: "#b45309", padding: "2px" }}
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={period.id}
                        className="glass-card"
                        style={{
                          padding: "0.6rem",
                          borderLeft: `3px solid ${colorToken.text}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                          position: "relative",
                        }}
                      >
                        {/* Time Slot */}
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Clock size={10} />
                          {period.time}
                        </div>

                        {/* Subject Name */}
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>
                          {period.subject}
                        </div>

                        {/* Teacher & Room */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                          {teacherName && (
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                              <User size={10} />
                              {teacherName}
                            </div>
                          )}
                          {period.roomNumber && (
                            <div style={{ fontSize: "10px", color: "#059669", display: "flex", alignItems: "center", gap: "3px", fontWeight: "600" }}>
                              <MapPin size={10} />
                              {period.roomNumber}
                            </div>
                          )}
                        </div>

                        {/* Quick Edit/Delete Hover Actions */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "3px",
                            marginTop: "4px",
                            borderTop: "1px solid #f1f5f9",
                            paddingTop: "3px",
                          }}
                        >
                          <button
                            onClick={() => handleEditPeriod(period, day.date)}
                            title="Edit Period"
                            style={{
                              border: "none",
                              background: "none",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              padding: "2px",
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeletePeriod(period.id)}
                            title="Delete Period"
                            style={{
                              border: "none",
                              background: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                              padding: "2px",
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Period Modal */}
      <PeriodModal
        isOpen={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
        initialData={editingPeriod}
        classId={selectedClassId}
        date={activeDateForPeriod}
      />

      {/* Duplicate Day Modal */}
      <DuplicateDayModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        classId={selectedClassId}
        sourceDate={duplicateSourceDate}
      />
    </div>
  );
};

export default ClassTimetablePage;
