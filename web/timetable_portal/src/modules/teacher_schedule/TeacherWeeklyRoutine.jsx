import React, { useMemo } from "react";
import { Clock, MapPin, BookOpen, Coffee, Award, Calendar, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { getSubjectColor } from "../../config/constants";
import { computeBellTimeSlots } from "../../services/timetableGeneratorEngine";

const DEFAULT_DAYS = [
  { key: "monday", dayKey: "monday", dayName: "Monday", displayDate: "Mon" },
  { key: "tuesday", dayKey: "tuesday", dayName: "Tuesday", displayDate: "Tue" },
  { key: "wednesday", dayKey: "wednesday", dayName: "Wednesday", displayDate: "Wed" },
  { key: "thursday", dayKey: "thursday", dayName: "Thursday", displayDate: "Thu" },
  { key: "friday", dayKey: "friday", dayName: "Friday", displayDate: "Fri" },
  { key: "saturday", dayKey: "saturday", dayName: "Saturday", displayDate: "Sat" },
];

const STANDARD_PERIODS = [
  { index: 1, label: "Period 1", time: "08:00 AM - 08:50 AM" },
  { index: 2, label: "Period 2", time: "08:50 AM - 09:40 AM" },
  { index: 3, label: "Period 3", time: "09:40 AM - 10:30 AM" },
  { index: 4, label: "Period 4", time: "10:30 AM - 11:20 AM" },
  { index: 5, label: "Period 5", time: "11:40 AM - 12:30 PM" },
  { index: 6, label: "Period 6", time: "12:30 PM - 01:20 PM" },
  { index: 7, label: "Period 7", time: "01:20 PM - 02:10 PM" },
  { index: 8, label: "Period 8", time: "02:10 PM - 03:00 PM" },
];

const parseClockMinutes = (tStr) => {
  if (!tStr) return 0;
  const match = String(tStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === "PM" && h < 12) h += 12;
  else if (ampm === "AM" && h === 12) h = 0;
  else if (!ampm && h >= 1 && h <= 6) h += 12;
  return h * 60 + m;
};

const findPeriodForSlot = (periods, slotObj, assignedIds = new Set()) => {
  if (!periods || periods.length === 0) return null;
  const availablePeriods = periods.filter((p) => !assignedIds.has(p.id));

  // 1. Exact Period Number / Index match
  const byIndex = availablePeriods.find(
    (item) => (item.periodNumber && item.periodNumber === slotObj.index) ||
              (item.period_index && Number(item.period_index) === slotObj.index)
  );
  if (byIndex) return byIndex;

  // 2. Clean string match
  const slotClean = (slotObj.time || "").replace(/\s+/g, "").toUpperCase();
  const byExactTime = availablePeriods.find((item) => {
    if (!item.timeSlot) return false;
    const itemClean = item.timeSlot.replace(/\s+/g, "").toUpperCase();
    return itemClean === slotClean || itemClean.includes(slotClean) || slotClean.includes(itemClean);
  });
  if (byExactTime) return byExactTime;

  // 3. Time overlap / clock minute match
  if (slotObj.time && slotObj.time.includes("-")) {
    const [slotStartStr, slotEndStr] = slotObj.time.split("-");
    const slotStartMins = parseClockMinutes(slotStartStr);
    const slotEndMins = parseClockMinutes(slotEndStr);

    // Primary: starts inside slot
    const startsInside = availablePeriods.find((item) => {
      if (!item.timeSlot || !item.timeSlot.includes("-")) return false;
      const [itemStartStr] = item.timeSlot.split("-");
      const itemStartMins = parseClockMinutes(itemStartStr);
      return itemStartMins >= slotStartMins && itemStartMins < slotEndMins;
    });
    if (startsInside) return startsInside;

    // Secondary: closest to slot start within 15 minutes
    const closeStart = availablePeriods.find((item) => {
      if (!item.timeSlot || !item.timeSlot.includes("-")) return false;
      const [itemStartStr] = item.timeSlot.split("-");
      const itemStartMins = parseClockMinutes(itemStartStr);
      return Math.abs(itemStartMins - slotStartMins) <= 15;
    });
    if (closeStart) return closeStart;
  }

  return null;
};

const getSlotDuration = (timeStr) => {
  if (!timeStr || !timeStr.includes("-")) return "50m";
  const [start, end] = timeStr.split("-");
  const diff = parseClockMinutes(end) - parseClockMinutes(start);
  return diff > 0 ? `${diff}m` : "50m";
};

// Rich, solid backgrounds with matching high-contrast typography per day
const DAY_THEMES = {
  monday: {
    bg: "#1e40af", // Solid Royal Blue
    text: "#ffffff",
    subtext: "#dbeafe",
    border: "#93c5fd",
    softBg: "#ffffff",
  },
  tuesday: {
    bg: "#0f766e", // Solid Deep Teal
    text: "#ffffff",
    subtext: "#ccfbf1",
    border: "#5eead4",
    softBg: "#ffffff",
  },
  wednesday: {
    bg: "#4338ca", // Solid Indigo
    text: "#ffffff",
    subtext: "#e0e7ff",
    border: "#a5b4fc",
    softBg: "#ffffff",
  },
  thursday: {
    bg: "#15803d", // Solid Forest / School Emerald Green
    text: "#ffffff",
    subtext: "#dcfce7",
    border: "#86efac",
    softBg: "#ffffff",
  },
  friday: {
    bg: "#c2410c", // Solid Warm Terracotta / Amber
    text: "#ffffff",
    subtext: "#ffedd5",
    border: "#fdba74",
    softBg: "#ffffff",
  },
  saturday: {
    bg: "#7e22ce", // Solid Royal Purple
    text: "#ffffff",
    subtext: "#f3e8ff",
    border: "#d8b4fe",
    softBg: "#ffffff",
  },
};

const TeacherWeeklyRoutine = ({
  routineByDay = {},
  teacher,
  timeSlots = [],
  bellSettings = null,
  weekDays = [],
  weekRange,
}) => {
  const activeDays = weekDays && weekDays.length > 0 ? weekDays : DEFAULT_DAYS;

  // Use official configured school bell slots if available, otherwise fallback to standard slots
  const computedSlots = useMemo(() => {
    if (bellSettings) {
      const allSlots = computeBellTimeSlots(bellSettings);
      const weekdayCount = Number(bellSettings.periods_per_day) || 7;
      return allSlots.slice(0, weekdayCount).map((s) => ({
        index: s.periodIndex,
        label: `Period ${s.periodIndex}`,
        time: s.timeRange,
      }));
    }
    return null;
  }, [bellSettings]);

  const slotsToDisplay = computedSlots || (timeSlots && timeSlots.length > 0
    ? timeSlots.map((ts, idx) => ({ index: idx + 1, label: `Period ${idx + 1}`, time: ts }))
    : STANDARD_PERIODS);

  // Compute weekly totals
  let totalTeaching = 0;
  let totalFree = 0;

  activeDays.forEach((d) => {
    const dayKey = d.dayKey || d.key;
    const periods = routineByDay[dayKey] || [];
    const teachingInDay = periods.filter((p) => !p.isBreak).length;
    totalTeaching += teachingInDay;
  });

  const totalPossibleSlots = activeDays.length * slotsToDisplay.length;
  totalFree = Math.max(0, totalPossibleSlots - totalTeaching);

  const weeklyQuota = teacher?.weeklyQuota || 28;
  const quotaPercent = Math.min(100, Math.round((totalTeaching / weeklyQuota) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, overflow: "hidden" }}>
      {/* 1. Workload Governance & Quota Compliance Banner (US-12) */}
      <div
        className="glass-panel"
        style={{
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          borderRadius: "10px",
          border: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          {/* Teaching count */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--accent-primary)" }}></span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Teaching Periods:</span>
            <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{totalTeaching} Periods</strong>
          </div>

          {/* Free count */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#64748b" }}></span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Free / Preparation:</span>
            <strong style={{ fontSize: "0.95rem", color: "#475569" }}>{totalFree} Sessions</strong>
          </div>

          {/* Quota Progress Meter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Quota Compliance:</span>
            <div style={{ width: "110px", height: "7px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${quotaPercent}%`,
                  height: "100%",
                  background: quotaPercent > 100 ? "#ef4444" : quotaPercent >= 80 ? "var(--accent-primary)" : "#f59e0b",
                  borderRadius: "4px",
                }}
              ></div>
            </div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
              {totalTeaching} / {weeklyQuota} ({quotaPercent}%)
            </strong>
          </div>
        </div>

        {/* Status Tag */}
        <div>
          {totalTeaching >= weeklyQuota ? (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                padding: "2px 8px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <CheckCircle2 size={12} />
              <span>Full Workload ({totalTeaching} Periods)</span>
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                padding: "2px 8px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Clock size={12} />
              <span>{weeklyQuota - totalTeaching} Periods Below Quota</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. 6-Day Grid with Explicit Free / Preparation Sessions (US-11 & US-12) */}
      <div
        className="custom-scrollbar"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(200px, 1fr))",
          gap: "0.75rem",
          flex: 1,
          height: "100%",
          minHeight: 0,
          overflowX: "auto",
          overflowY: "auto",
          paddingBottom: "0.25rem",
        }}
      >
        {activeDays.map((d) => {
          const dayKey = d.dayKey || d.key;
          const periods = routineByDay[dayKey] || [];
          const isToday = !!d.isToday;
          const teachingPeriodsCount = periods.filter((p) => !p.isBreak).length;
          const dayTheme = DAY_THEMES[(dayKey || "").toLowerCase()] || {
            bg: "#1e293b",
            text: "#ffffff",
            subtext: "#cbd5e1",
            border: "#cbd5e1",
            softBg: "#ffffff",
          };

          return (
            <div
              key={d.date || dayKey}
              className="glass-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "10px",
                overflow: "hidden",
                border: isToday ? `2.5px solid ${dayTheme.bg}` : `1px solid ${dayTheme.border || "var(--glass-border)"}`,
                background: isToday ? "#f0fdf4" : "rgba(255, 255, 255, 0.98)",
                boxShadow: isToday
                  ? "0 6px 16px -2px rgba(21, 128, 61, 0.25)"
                  : "0 2px 6px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              {/* Day Header with Solid Background and Matching Font Color */}
              <div
                style={{
                  padding: "0.65rem 0.85rem",
                  background: dayTheme.bg,
                  color: dayTheme.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: dayTheme.text,
                      letterSpacing: "0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {d.dayName}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: dayTheme.subtext,
                      fontWeight: "600",
                      marginTop: "2px",
                    }}
                  >
                    {d.displayDate} • {teachingPeriodsCount} Teaching
                  </div>
                </div>

                {isToday ? (
                  <span
                    style={{
                      fontSize: "9.5px",
                      fontWeight: "800",
                      background: "#ffffff",
                      color: dayTheme.bg,
                      padding: "2px 6px",
                      borderRadius: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    Today
                  </span>
                ) : teachingPeriodsCount > 0 ? (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      background: "rgba(255, 255, 255, 0.22)",
                      color: "#ffffff",
                      padding: "2px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {teachingPeriodsCount} {teachingPeriodsCount === 1 ? "Class" : "Classes"}
                  </span>
                ) : null}
              </div>

              {/* Day Periods Slot-by-Slot List (All slots accounted for with explicit Free cards) */}
              <div
                className="custom-scrollbar"
                style={{
                  padding: "0.6rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                {(() => {
                  const assignedIds = new Set();
                  const targetSlots = dayKey === "saturday"
                    ? slotsToDisplay.slice(0, Number(bellSettings?.saturday_periods) || 5)
                    : slotsToDisplay;

                  const slotCards = targetSlots.map((slotObj, idx) => {
                    // Find period for this slot
                    const p = findPeriodForSlot(periods, slotObj, assignedIds);
                    if (p && p.id) {
                      assignedIds.add(p.id);
                    }

                    // CASE 1: Occupied by Class Lecture
                    if (p && !p.isBreak) {
                      const colorToken = getSubjectColor(p.subject);
                      return (
                        <div
                          key={p.id || idx}
                          style={{
                            padding: "0.55rem 0.65rem",
                            borderRadius: "8px",
                            border: `1px solid ${colorToken.border || "#e2e8f0"}`,
                            borderLeft: `4px solid ${colorToken.text || "var(--accent-primary)"}`,
                            background: colorToken.bg || "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            flex: "1 1 auto",
                            minHeight: "72px",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Time Slot, Period & Duration Badge */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "10px",
                              fontWeight: "700",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: "3px", color: "var(--text-primary)", fontWeight: "800" }}>
                                {slotObj.label}
                              </span>
                              <span style={{ color: "#475569" }}>{p.timeSlot || slotObj.time}</span>
                              <span style={{ background: "#e2e8f0", color: "#0f172a", padding: "1px 4px", borderRadius: "3px", fontSize: "8.5px", fontWeight: "800" }}>
                                {getSlotDuration(p.timeSlot || slotObj.time)}
                              </span>
                            </span>
                            {p.roomNumber && p.roomNumber !== "-" && (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "2px",
                                  background: "#f1f5f9",
                                  padding: "1px 4px",
                                  borderRadius: "4px",
                                  fontSize: "9px",
                                  color: "#475569",
                                }}
                              >
                                <MapPin size={8} /> {p.roomNumber}
                              </span>
                            )}
                          </div>

                          {/* Subject */}
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "800",
                              color: colorToken.text || "#1e293b",
                              lineHeight: 1.2,
                            }}
                          >
                            {p.subject}
                          </div>

                          {/* Class Tag */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "2px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "700",
                                color: "var(--accent-primary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <BookOpen size={10} />
                              Class: {p.className}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // CASE 2: Break / Recess / Lunch
                    if (p && p.isBreak) {
                      return (
                        <div
                          key={`break-${idx}`}
                          style={{
                            padding: "0.4rem 0.6rem",
                            borderRadius: "6px",
                            background: "#fef3c7",
                            border: "1px dashed #f59e0b",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            color: "#b45309",
                          }}
                        >
                          <Coffee size={12} />
                          <span>{p.subject || "Break / Recess"}</span>
                          <span style={{ marginLeft: "auto", fontSize: "9.5px", fontWeight: "600" }}>
                            {slotObj.label}
                          </span>
                        </div>
                      );
                    }

                    // CASE 3: Explicit Free / Preparation Session (US-12)
                    return (
                      <div
                        key={`free-${idx}`}
                        style={{
                          padding: "0.45rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px dashed #cbd5e1",
                          background: "rgba(248, 250, 252, 0.75)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease",
                          flex: "1 1 auto",
                          minHeight: "44px",
                        }}
                      >
                        <Coffee size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", lineHeight: 1.2 }}>
                            Free / Preparation
                          </div>
                          <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontWeight: "700" }}>{slotObj.label}</span>
                            <span>•</span>
                            <span>{slotObj.time}</span>
                            <span style={{ background: "#e2e8f0", color: "#334155", padding: "0 3px", borderRadius: "2px", fontSize: "8px", fontWeight: "700" }}>
                              {getSlotDuration(slotObj.time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });

                  // Extra periods that did not fit standard slots
                  const extraPeriods = periods.filter((p) => !p.isBreak && (!p.id || !assignedIds.has(p.id)));
                  const extraCards = extraPeriods.map((p, eIdx) => {
                    const colorToken = getSubjectColor(p.subject);
                    return (
                      <div
                        key={p.id || `extra-${eIdx}`}
                        style={{
                          padding: "0.55rem 0.65rem",
                          borderRadius: "8px",
                          border: `1px solid ${colorToken.border || "#e2e8f0"}`,
                          borderLeft: `4px solid ${colorToken.text || "var(--accent-primary)"}`,
                          background: colorToken.bg || "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          flex: "1 1 auto",
                          minHeight: "72px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ background: "#fef3c7", color: "#92400e", padding: "1px 4px", borderRadius: "3px", fontWeight: "800" }}>
                              Extra Slot
                            </span>
                            <span style={{ color: "#475569" }}>{p.timeSlot || "Scheduled"}</span>
                          </span>
                          {p.roomNumber && p.roomNumber !== "-" && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                background: "#f1f5f9",
                                padding: "1px 4px",
                                borderRadius: "4px",
                                fontSize: "9px",
                                color: "#475569",
                              }}
                            >
                              <MapPin size={8} /> {p.roomNumber}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "800",
                            color: colorToken.text || "#1e293b",
                            lineHeight: 1.2,
                          }}
                        >
                          {p.subject}
                        </div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            fontWeight: "700",
                            color: "var(--accent-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <BookOpen size={10} />
                          Class: {p.className}
                        </div>
                      </div>
                    );
                  });

                  return [...slotCards, ...extraCards];
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherWeeklyRoutine;
