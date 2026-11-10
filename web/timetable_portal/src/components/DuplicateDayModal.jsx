import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Copy, Calendar, AlertCircle, AlertTriangle, CheckCircle, ShieldAlert, Layers } from "lucide-react";
import { toast } from "react-toastify";
import { duplicateSchedule } from "../features/timetableSlice";
import { WEEKDAYS } from "../config/constants";
import {
  getMaxDuplicationDate,
  isDateBeyond3Months,
  validateScheduleDuplication,
} from "../services/timetableValidationEngine";

const DuplicateDayModal = ({ isOpen, onClose, classId, sourceDate }) => {
  const dispatch = useDispatch();
  const { saving, timeTables, teachers, classes, subjects, classSubjectQuotas, teacherQuotas } = useSelector(
    (state) => state.timetable
  );

  const [targetStartDate, setTargetStartDate] = useState(sourceDate);
  const [targetEndDate, setTargetEndDate] = useState(sourceDate);
  const [copyMode, setCopyMode] = useState("full"); // 'full' or 'structure'
  const [selectedDays, setSelectedDays] = useState(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]);
  const [apiError, setApiError] = useState(null);

  // Max date allowed is strictly 3 months (90 days) from sourceDate
  const maxAllowedDate = useMemo(() => getMaxDuplicationDate(sourceDate), [sourceDate]);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Run strict validation engine simulation across future dates
  const validationResult = useMemo(() => {
    if (!isOpen || !classId || !sourceDate || !targetStartDate || !targetEndDate) {
      return { isValid: true, blockers: [], warnings: [], targetDates: [] };
    }
    return validateScheduleDuplication({
      classId,
      sourceDate,
      targetStartDate,
      targetEndDate,
      copyMode,
      selectedDays,
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
    sourceDate,
    targetStartDate,
    targetEndDate,
    copyMode,
    selectedDays,
    timeTables,
    classSubjectQuotas,
    teacherQuotas,
    classes,
    teachers,
    subjects,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId || !sourceDate || !targetStartDate || !targetEndDate) {
      toast.error("Please fill in all date fields");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one target weekday");
      return;
    }

    // Strict 3-Month check
    if (isDateBeyond3Months(sourceDate, targetEndDate)) {
      toast.error(`Strict Policy: Duplication cannot extend beyond 3 months (max: ${maxAllowedDate})`);
      return;
    }

    // Strict Validation Check
    if (!validationResult.isValid) {
      toast.error(`Strict validation blocked duplication: ${validationResult.blockers.length} conflict(s) found.`);
      return;
    }

    const payload = {
      classId,
      sourceDate,
      targetStartDate,
      targetEndDate,
      copyMode,
      selectedDays,
    };

    try {
      setApiError(null);
      await dispatch(duplicateSchedule(payload)).unwrap();
      toast.success(`Schedule duplicated across ${validationResult.targetDates?.length || 0} future dates!`);
      onClose();
    } catch (err) {
      const errMsg = typeof err === "object" ? err.message || JSON.stringify(err) : String(err);
      setApiError(errMsg);
      toast.error(errMsg || "Failed to duplicate schedule");
    }
  };

  const hasExceeded3Months = isDateBeyond3Months(sourceDate, targetEndDate);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                Duplicate Day Schedule
              </h3>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
              >
                Strict Validation
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Copy periods from <strong>{sourceDate}</strong> to future dates (Max 3 months)
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: "6px", borderRadius: "50%" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Copy Mode */}
          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "12px", fontWeight: "700" }}>
              Copy Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div
                onClick={() => setCopyMode("full")}
                style={{
                  border: copyMode === "full" ? "2px solid #3b82f6" : "1px solid var(--glass-border)",
                  background: copyMode === "full" ? "#eff6ff" : "white",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "13px", color: copyMode === "full" ? "#1d4ed8" : "var(--text-primary)" }}>
                  Full Duplicate
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Copies subjects, teachers, and rooms with strict conflict protection
                </div>
              </div>

              <div
                onClick={() => setCopyMode("structure")}
                style={{
                  border: copyMode === "structure" ? "2px solid #3b82f6" : "1px solid var(--glass-border)",
                  background: copyMode === "structure" ? "#eff6ff" : "white",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: "700", fontSize: "13px", color: copyMode === "structure" ? "#1d4ed8" : "var(--text-primary)" }}>
                  Structure Only
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Copies period timings only; teachers and subjects remain unassigned
                </div>
              </div>
            </div>
          </div>

          {/* Date Range with 3-Month Strict Limit */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label style={{ fontSize: "12px", fontWeight: "700" }}>
                Target Date Range
              </label>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: hasExceeded3Months ? "#b91c1c" : "#059669",
                  background: hasExceeded3Months ? "#fee2e2" : "#ecfdf5",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: hasExceeded3Months ? "1px solid #fca5a5" : "1px solid #a7f3d0",
                }}
              >
                Max Limit: {maxAllowedDate} (3 Mos)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  From:
                </span>
                <input
                  type="date"
                  className="input-glass"
                  value={targetStartDate}
                  onChange={(e) => setTargetStartDate(e.target.value)}
                  max={maxAllowedDate}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px" }}
                />
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  To (Strict Max 3 Months):
                </span>
                <input
                  type="date"
                  className="input-glass"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  max={maxAllowedDate}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    borderColor: hasExceeded3Months ? "#ef4444" : undefined,
                    background: hasExceeded3Months ? "#fef2f2" : undefined,
                  }}
                />
              </div>
            </div>

            {hasExceeded3Months && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "#fef2f2",
                  color: "#991b1b",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  marginTop: "0.5rem",
                  fontSize: "11px",
                  border: "1px solid #fecaca",
                }}
              >
                <ShieldAlert size={16} />
                <span>Duplication cannot extend beyond 3 months ({maxAllowedDate}). Please shorten the end date.</span>
              </div>
            )}
          </div>

          {/* Weekday Filter */}
          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "12px", fontWeight: "700" }}>
              Apply on Selected Weekdays ({validationResult.targetDates?.length || 0} target dates selected)
            </label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {WEEKDAYS.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      border: active ? "1px solid #2563eb" : "1px solid var(--glass-border)",
                      background: active ? "#2563eb" : "#f8fafc",
                      color: active ? "white" : "var(--text-secondary)",
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Engine Status & Conflict Inspector */}
          {validationResult.isValid ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                background: "#f0fdf4",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid #bbf7d0",
                fontSize: "12px",
                color: "#166534",
              }}
            >
              <CheckCircle size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
              <div>
                <strong>Validation Passed:</strong> No teacher double-booking, room clashes, or quota violations detected across{" "}
                <strong>{validationResult.targetDates?.length || 0} future dates</strong>.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#fef2f2",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid #fecaca",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#991b1b", fontWeight: "800", fontSize: "13px" }}>
                <ShieldAlert size={18} style={{ color: "#dc2626" }} />
                <span>Strict Validation Block: {validationResult.blockers.length} Conflict Issue(s) Detected</span>
              </div>
              <p style={{ fontSize: "11px", color: "#7f1d1d", margin: 0 }}>
                The timetable engine strictly prohibits saving allocations that contain teacher clashes or exceed weekly quotas on future dates:
              </p>

              <div
                style={{
                  maxHeight: "130px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  padding: "0.4rem",
                  background: "white",
                  borderRadius: "6px",
                  border: "1px solid #fee2e2",
                }}
              >
                {validationResult.blockers.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: "11px",
                      color: "#b91c1c",
                      padding: "4px 8px",
                      background: "#fff1f2",
                      borderRadius: "4px",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <strong>•</strong> {b.message}
                  </div>
                ))}
              </div>

              {copyMode !== "structure" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                  <span style={{ fontSize: "11px", color: "#7f1d1d" }}>
                    Tip: Need the period timings without assigning conflicting teachers?
                  </span>
                  <button
                    type="button"
                    onClick={() => setCopyMode("structure")}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Switch to Structure Only
                  </button>
                </div>
              )}
            </div>
          )}

          {apiError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
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
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "auto",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !validationResult.isValid || hasExceeded3Months}
              style={{
                opacity: !validationResult.isValid || hasExceeded3Months ? 0.6 : 1,
                cursor: !validationResult.isValid || hasExceeded3Months ? "not-allowed" : "pointer",
                background: !validationResult.isValid || hasExceeded3Months ? "#94a3b8" : undefined,
              }}
            >
              <Copy size={14} />{" "}
              {saving
                ? "Duplicating..."
                : !validationResult.isValid
                ? "Blocked by Conflicts"
                : hasExceeded3Months
                ? "Exceeds 3 Months"
                : `Duplicate (${validationResult.targetDates?.length || 0} Dates)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DuplicateDayModal;
