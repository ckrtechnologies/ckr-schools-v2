import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Clock, BookOpen, User, MapPin, Trash2, Check, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { savePeriod, modifyPeriod, removePeriod } from "../features/timetableSlice";
import { DEFAULT_PERIOD_SLOTS } from "../config/constants";
import SearchSelectDropdown from "./SearchSelectDropdown";

import {
  validatePeriodAssignment,
  getWeekBounds,
  getSubjectQuotaForClass,
  countClassSubjectPeriodsInWeek,
  getTeacherQuota,
  countTeacherPeriodsInWeek,
} from "../services/timetableValidationEngine";

const PeriodModal = ({ isOpen, onClose, initialData = null, classId, date }) => {
  const dispatch = useDispatch();
  const { teachers, subjects, rooms, saving, timeTables, classes, classSubjectQuotas, teacherQuotas } = useSelector(
    (state) => state.timetable
  );

  const [time, setTime] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [isBreak, setIsBreak] = useState(false);
  const [isAssembly, setIsAssembly] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTime(initialData.time || "");

      // Match subject to name or ID
      const matchedSub = (subjects || []).find(
        (s) => s.id === initialData.subject || s.name === initialData.subject
      );
      setSubject(matchedSub ? matchedSub.name : initialData.subject || "");

      // Match teacher to id or name
      const matchedTeacher = (teachers || []).find(
        (t) => t.id === initialData.teacher || t.name === initialData.teacher
      );
      setTeacher(matchedTeacher ? matchedTeacher.id : initialData.teacher || "");

      // Match roomNumber
      const matchedRoom = (rooms || []).find(
        (r) => (r.name || r.room_number || r.number) === initialData.roomNumber
      );
      setRoomNumber(
        matchedRoom
          ? matchedRoom.name || matchedRoom.room_number || matchedRoom.number
          : initialData.roomNumber || ""
      );

      const isAss = initialData.subject === "Assembly" || (initialData.subject && initialData.subject.toLowerCase() === "assembly");
      setIsAssembly(isAss);
      setIsBreak(!!initialData.isBreak && !isAss);
    } else {
      setTime(DEFAULT_PERIOD_SLOTS[0]?.time || "08:00 AM - 08:45 AM");
      setSubject("");
      setTeacher("");
      setRoomNumber("");
      setIsBreak(false);
      setIsAssembly(false);
    }
    setApiError(null);
    setHasAttemptedSubmit(false);
  }, [initialData, isOpen, subjects, teachers, rooms]);

  const { start: weekStart, end: weekEnd } = useMemo(() => {
    return getWeekBounds(date);
  }, [date]);

  // Real-time strict validation check
  const validation = useMemo(() => {
    if (!isOpen) return { isValid: true, blockers: [], warnings: [] };
    return validatePeriodAssignment({
      classId,
      date,
      timeSlot: time,
      subject,
      teacherId: teacher,
      roomNumber,
      isBreak,
      excludePeriodId: initialData?.id,
      timeTables,
      classSubjectQuotas,
      teacherQuotas,
      classes,
      teachers,
      subjects,
    });
  }, [
    isOpen,
    classId,
    date,
    time,
    subject,
    teacher,
    roomNumber,
    isBreak,
    initialData,
    timeTables,
    classSubjectQuotas,
    teacherQuotas,
    classes,
    teachers,
    subjects,
  ]);

  // Separate active clashes and quota blockers from un-entered form fields
  const conflictBlockers = useMemo(() => {
    return (validation.blockers || []).filter(
      (b) => b.code !== "MISSING_TIME" && b.code !== "MISSING_SUBJECT"
    );
  }, [validation.blockers]);

  const hasActiveConflict = conflictBlockers.length > 0;

  // Real-time weekly quota enriched subject options
  const subjectOptions = useMemo(() => {
    return (subjects || []).map((sub) => {
      const quota =
        getSubjectQuotaForClass(classId, sub.name, classSubjectQuotas, subjects) ??
        getSubjectQuotaForClass(classId, sub.id, classSubjectQuotas, subjects) ??
        (sub.weeklyQuota !== undefined && sub.weeklyQuota !== null ? Number(sub.weeklyQuota) : null);
      const isConfigured = quota !== null && quota !== undefined && Number(quota) > 0;
      const count = isConfigured
        ? countClassSubjectPeriodsInWeek(
            classId,
            sub.name,
            weekStart,
            weekEnd,
            timeTables,
            initialData?.id
          )
        : 0;

      let badge = "No Quota";
      let subtext = "Quota not configured in Quota matrix";
      if (isConfigured) {
        const remaining = Number(quota) - count;
        badge = `${count}/${quota} wk`;
        subtext =
          remaining > 0
            ? `${remaining} period${remaining > 1 ? "s" : ""} left this week`
            : "Weekly quota reached";
      }

      return {
        value: sub.name,
        label: sub.name,
        badge,
        subtext,
        initials: sub.name.slice(0, 3).toUpperCase(),
      };
    });
  }, [subjects, classId, classSubjectQuotas, weekStart, weekEnd, timeTables, initialData]);

  // Real-time weekly quota enriched teacher options
  const teacherOptions = useMemo(() => {
    return [
      { value: "", label: "Unassigned / Optional", badge: "None", initials: "--" },
      ...(teachers || []).map((t) => {
        const quota = getTeacherQuota(t.id, teacherQuotas, teachers);
        const isConfigured = quota !== null && quota !== undefined && Number(quota) > 0;
        const weekCount = isConfigured
          ? countTeacherPeriodsInWeek(
              t.id,
              weekStart,
              weekEnd,
              timeTables,
              initialData?.id
            )
          : 0;

        // Count today's periods for teacher
        let todayCount = 0;
        (timeTables || []).forEach((tt) => {
          const periodsToday = tt.dates?.[date];
          if (Array.isArray(periodsToday)) {
            periodsToday.forEach((p) => {
              if (initialData?.id && String(p.id) === String(initialData.id)) return;
              if (!p.isBreak && String(p.teacher) === String(t.id)) {
                todayCount++;
              }
            });
          }
        });

        let badge = "No Quota";
        let subtext = t.email || t.phone || "Quota not set";
        if (isConfigured) {
          const remaining = Number(quota) - weekCount;
          badge = `${weekCount}/${quota} wk`;
          subtext =
            remaining > 0
              ? `${todayCount} today • ${remaining} left this week`
              : `${todayCount} today • Weekly quota reached`;
        } else {
          badge = "No Quota ⚠️";
          subtext = `${todayCount} today • Quota not configured in Teacher Quotas`;
        }

        return {
          value: t.id,
          label: t.name,
          badge,
          subtext,
          initials: t.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(),
        };
      }),
    ];
  }, [teachers, teacherQuotas, weekStart, weekEnd, timeTables, date, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!time.trim()) {
      toast.error("Please specify a time slot");
      return;
    }

    if (!isBreak && !isAssembly && !subject) {
      toast.error("Please select a subject or mark as break/assembly");
      return;
    }

    if (!validation.isValid) {
      toast.error(validation.blockers[0]?.message || "Validation failed due to clashes");
      return;
    }

    const payload = {
      time: time.trim(),
      subject: isAssembly ? "Assembly" : (isBreak ? "Break/Lunch" : subject),
      teacher: (isBreak || isAssembly) ? null : teacher || null,
      roomNumber: roomNumber.trim() || null,
      isBreak: isBreak || isAssembly,
    };

    try {
      if (initialData?.id) {
        await dispatch(modifyPeriod({ id: initialData.id, data: payload })).unwrap();
        toast.success("Period updated successfully");
      } else {
        await dispatch(
          savePeriod({
            classId,
            date,
            timeTable: payload,
          })
        ).unwrap();
        toast.success("Period added to schedule");
      }
      setApiError(null);
      onClose();
    } catch (err) {
      const errMsg = typeof err === "object" ? err.message || err.error || JSON.stringify(err) : String(err);
      setApiError(errMsg);
      toast.error(errMsg || "Failed to save period");
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm("Are you sure you want to delete this period?")) return;

    try {
      await dispatch(removePeriod(initialData.id)).unwrap();
      toast.success("Period deleted");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to delete period");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "520px",
          width: "95%",
          overflow: "visible",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--glass-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>
              {initialData ? "Edit Period" : "Add Period to Schedule"}
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Date: {date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: "4px", borderRadius: "50%" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Is Break Toggle */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div
              style={{
                flex: 1,
                minWidth: "150px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: isBreak ? "#fffbeb" : "#f8fafc",
                padding: "0.65rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: isBreak ? "1px solid #fde68a" : "1px solid var(--glass-border)",
              }}
            >
              <input
                type="checkbox"
                id="isBreak"
                checked={isBreak}
                onChange={(e) => {
                  setIsBreak(e.target.checked);
                  if (e.target.checked) setIsAssembly(false);
                }}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#f59e0b" }}
              />
              <label htmlFor="isBreak" style={{ fontSize: "12px", fontWeight: "600", cursor: "pointer", color: isBreak ? "#b45309" : "var(--text-primary)" }}>
                ☕ Mark as Break / Lunch
              </label>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "150px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: isAssembly ? "#f5f3ff" : "#f8fafc",
                padding: "0.65rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: isAssembly ? "1px solid #c4b5fd" : "1px solid var(--glass-border)",
              }}
            >
              <input
                type="checkbox"
                id="isAssembly"
                checked={isAssembly}
                onChange={(e) => {
                  setIsAssembly(e.target.checked);
                  if (e.target.checked) setIsBreak(false);
                }}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#8b5cf6" }}
              />
              <label htmlFor="isAssembly" style={{ fontSize: "12px", fontWeight: "600", cursor: "pointer", color: isAssembly ? "#7c3aed" : "var(--text-primary)" }}>
                🔔 Mark as Assembly
              </label>
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "12px", fontWeight: "600" }}>
              <Clock size={13} style={{ display: "inline", marginRight: "4px" }} />
              Time Slot (e.g. 09:00 AM - 09:45 AM)
            </label>
            <input
              type="text"
              className="input-glass"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="09:00 AM - 09:45 AM"
              required
            />
            {/* Quick preset chips */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "0.4rem" }}>
              {DEFAULT_PERIOD_SLOTS.map((slot) => (
                <button
                  type="button"
                  key={slot.time}
                  onClick={() => {
                    setTime(slot.time);
                    setIsBreak(!!slot.isBreak);
                  }}
                  style={{
                    background: time === slot.time ? "var(--accent-light)" : "#f1f5f9",
                    color: time === slot.time ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    fontSize: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {slot.name}
                </button>
              ))}
            </div>
          </div>

          {!isBreak && !isAssembly && (
            <>
              {/* Subject */}
              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "12px", fontWeight: "600" }}>
                  <BookOpen size={13} style={{ display: "inline", marginRight: "4px" }} />
                  Subject
                </label>
                <SearchSelectDropdown
                  value={subject}
                  onChange={(val) => {
                    setSubject(val);
                    setApiError(null);
                  }}
                  options={subjectOptions}
                  placeholder="Select Subject..."
                  searchPlaceholder="Search subject..."
                  minWidth="100%"
                  dropdownWidth="100%"
                  itemLabelSingular="subject"
                  itemLabelPlural="subjects"
                />
              </div>

              {/* Teacher */}
              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "12px", fontWeight: "600" }}>
                  <User size={13} style={{ display: "inline", marginRight: "4px" }} />
                  Assigned Teacher
                </label>
                <SearchSelectDropdown
                  value={teacher}
                  onChange={(val) => {
                    setTeacher(val);
                    setApiError(null);
                  }}
                  options={teacherOptions}
                  placeholder="Select Teacher (Optional)..."
                  searchPlaceholder="Search teacher..."
                  minWidth="100%"
                  dropdownWidth="100%"
                  itemLabelSingular="teacher"
                  itemLabelPlural="teachers"
                />
              </div>

              {/* Room Number */}
              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "12px", fontWeight: "600" }}>
                  <MapPin size={13} style={{ display: "inline", marginRight: "4px" }} />
                  Room Number
                </label>
                {(rooms || []).length > 0 ? (
                  <SearchSelectDropdown
                    value={roomNumber}
                    onChange={(val) => {
                      setRoomNumber(val);
                      setApiError(null);
                    }}
                    options={[
                      { value: "", label: "Unassigned / Default Room", badge: "None", initials: "--" },
                      ...(rooms || []).map((r) => {
                        const val = r.name || r.room_number || r.number || "";
                        const lbl = r.name
                          ? r.room_number
                            ? `${r.name} (${r.room_number})`
                            : r.name
                          : `Room ${r.room_number || r.number}`;
                        return {
                          value: val,
                          label: lbl,
                          badge: "Room",
                          initials: (r.name || `${r.room_number || r.number || "RM"}`).slice(0, 3).toUpperCase(),
                        };
                      }),
                    ]}
                    placeholder="Select Room (Optional)..."
                    searchPlaceholder="Search room..."
                    minWidth="100%"
                    dropdownWidth="100%"
                    itemLabelSingular="room"
                    itemLabelPlural="rooms"
                  />
                ) : (
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="e.g. Room 101, Science Lab"
                    value={roomNumber}
                    onChange={(e) => {
                      setRoomNumber(e.target.value);
                      setApiError(null);
                    }}
                  />
                )}
              </div>
            </>
          )}

          {/* Validation Conflict Feedback Banner (Active Clashes & Quota Policy Blocks) */}
          {hasActiveConflict && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b91c1c", fontWeight: "700", fontSize: "12px" }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, color: "#dc2626" }} />
                <span>Strict Validation Conflict</span>
              </div>
              {conflictBlockers.map((b, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#991b1b", paddingLeft: "21px", lineHeight: "1.4" }}>
                  • {b.message}
                </div>
              ))}
            </div>
          )}

          {/* Incomplete Form Helper (Only shown when user clicks Save with missing subject/time) */}
          {!hasActiveConflict && hasAttemptedSubmit && !validation.isValid && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: "700", fontSize: "12px" }}>
                <AlertCircle size={15} style={{ flexShrink: 0, color: "#d97706" }} />
                <span>Please complete required fields</span>
              </div>
              {validation.blockers.map((b, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#92400e", paddingLeft: "21px" }}>
                  • {b.message}
                </div>
              ))}
            </div>
          )}

          {/* Validation Warnings */}
          {validation.isValid && validation.warnings.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 0.75rem",
                fontSize: "11px",
                color: "#92400e",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, color: "#d97706" }} />
              <div>{validation.warnings[0].message}</div>
            </div>
          )}

          {/* API Error Box */}
          {apiError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                padding: "0.6rem 0.85rem",
                fontSize: "12px",
                color: "#991b1b",
                fontWeight: "600",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, color: "#dc2626" }} />
              <div>{apiError}</div>
            </div>
          )}

          {/* Modal Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: initialData ? "space-between" : "flex-end",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            {initialData && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || hasActiveConflict || (hasAttemptedSubmit && !validation.isValid)}
                style={{
                  opacity: hasActiveConflict ? 0.6 : 1,
                  cursor: hasActiveConflict ? "not-allowed" : "pointer",
                  background: hasActiveConflict ? "#94a3b8" : undefined,
                }}
              >
                <Check size={14} />{" "}
                {saving
                  ? "Saving..."
                  : hasActiveConflict
                  ? "Blocked by Conflict"
                  : initialData
                  ? "Update Period"
                  : "Save Period"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PeriodModal;
