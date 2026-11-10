import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { loadMasterData, loadTimeTables } from "../features/timetableSlice";
import { getSubjectColor } from "../config/constants";
import SearchSelectDropdown from "../components/SearchSelectDropdown";

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const TeacherTimetablePage = () => {
  const dispatch = useDispatch();
  const { timeTables, teachers, classes, loadingMasterData, loadingTimeTables } =
    useSelector((state) => state.timetable);

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  useEffect(() => {
    dispatch(loadMasterData());
    dispatch(loadTimeTables());
  }, [dispatch]);

  // Set default teacher
  useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  // Selected Teacher details
  const currentTeacher = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

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

  // Map classId -> "Class - Section"
  const classMap = useMemo(() => {
    const map = new Map();
    classes.forEach((c) => map.set(c.id, `${c.name || c.className} - ${c.section}`));
    return map;
  }, [classes]);

  // Extract all periods assigned to this teacher for the active week
  const teacherScheduleByDate = useMemo(() => {
    if (!selectedTeacherId) return {};

    const schedule = {};
    weekDays.forEach((wd) => {
      schedule[wd.date] = [];
    });

    timeTables.forEach((classTT) => {
      const cName = `${classTT.className} - ${classTT.section}`;
      weekDays.forEach((wd) => {
        const periods = classTT.dates?.[wd.date] || [];
        periods.forEach((p) => {
          if (p.teacher === selectedTeacherId && !p.isBreak) {
            schedule[wd.date].push({
              ...p,
              className: cName,
              classId: classTT.classId,
            });
          }
        });
      });
    });

    // Sort periods chronologically
    Object.keys(schedule).forEach((dateKey) => {
      schedule[dateKey].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    });

    return schedule;
  }, [timeTables, selectedTeacherId, weekDays]);

  // Calculate workload stats
  const totalWeeklyPeriods = useMemo(() => {
    let count = 0;
    Object.values(teacherScheduleByDate).forEach((list) => {
      count += list.length;
    });
    return count;
  }, [teacherScheduleByDate]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "700" }}>Teacher Workload & Schedules</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          Inspect weekly period allocations, free periods, and teaching assignments per staff member
        </p>
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
            Select Teacher:
          </span>
          <SearchSelectDropdown
            value={selectedTeacherId}
            onChange={setSelectedTeacherId}
            options={teachers.map((t) => ({
              value: t.id,
              label: t.name,
              subtext: t.email || t.phone || t.subjectSpecialization,
              badge: "Staff",
              initials: t.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(),
            }))}
            placeholder="Select Teacher..."
            searchPlaceholder="Search teacher by name or email..."
            minWidth="240px"
            dropdownWidth="300px"
            itemLabelSingular="teacher"
            itemLabelPlural="teachers"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Workload Pill */}
          <div
            style={{
              background: "var(--accent-light)",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              fontWeight: "700",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <CheckCircle2 size={14} />
            {totalWeeklyPeriods} Total Periods this week
          </div>

          {/* Week Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const prev = new Date(currentWeekStart);
                prev.setDate(prev.getDate() - 7);
                setCurrentWeekStart(prev);
              }}
              style={{ padding: "0.4rem 0.6rem" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const next = new Date(currentWeekStart);
                next.setDate(next.getDate() + 7);
                setCurrentWeekStart(next);
              }}
              style={{ padding: "0.4rem 0.6rem" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0.75rem",
        }}
      >
        {weekDays.map((day) => {
          const periods = teacherScheduleByDate[day.date] || [];

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
                  background: day.isToday ? "var(--accent-light)" : "#f8fafc",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "13px", color: day.isToday ? "var(--accent-primary)" : "var(--text-primary)" }}>
                  {day.dayName}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {day.displayDate} • {periods.length} periods
                </div>
              </div>

              {/* Periods */}
              <div style={{ padding: "0.6rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minHeight: "240px" }}>
                {periods.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    No assigned classes
                  </div>
                ) : (
                  periods.map((p) => {
                    const colorToken = getSubjectColor(p.subject);
                    return (
                      <div
                        key={p.id}
                        className="glass-card"
                        style={{
                          padding: "0.6rem",
                          borderLeft: `3px solid ${colorToken.text}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
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
                          {p.time}
                        </div>

                        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>
                          {p.subject}
                        </div>

                        <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--accent-primary)" }}>
                          Class: {p.className}
                        </div>

                        {p.roomNumber && (
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                            <MapPin size={10} />
                            {p.roomNumber}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherTimetablePage;
