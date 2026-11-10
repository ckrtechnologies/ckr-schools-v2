import React, { useState, useEffect, useMemo } from "react";
import { Clock, Sliders, Check, X, Bell, Coffee, Calendar, Info, Save } from "lucide-react";
import { toast } from "react-toastify";
import { fetchTimetableSettings, saveTimetableSettings } from "../services/teacherScheduleApi";

export default function BellScheduleModal({ isOpen, onClose, onSaved }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("timetable_settings");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      academic_year: "2026-2027",
      school_start_time: "08:00 AM",
      period_duration_minutes: 50,
      assembly_duration_minutes: 20,
      recess_after_period: 4,
      recess_duration_minutes: 20,
      lunch_after_period: 6,
      lunch_duration_minutes: 40,
      periods_per_day: 8,
      saturday_periods: 5,
      max_daily_subject_periods: 1,
    };
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchTimetableSettings()
        .then((data) => {
          if (data) setSettings((prev) => ({ ...prev, ...data }));
        })
        .catch((err) => console.warn("Failed to load settings:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Compute calculated bell timing slots preview
  const previewSlots = useMemo(() => {
    const slots = [];
    // Parse start time (e.g. "08:00 AM")
    const match = (settings.school_start_time || "08:00 AM").match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let startHour = match ? parseInt(match[1], 10) : 8;
    let startMin = match ? parseInt(match[2], 10) : 0;
    const isPM = match && match[3] && match[3].toUpperCase() === "PM";
    if (isPM && startHour < 12) startHour += 12;

    let currentMinutes = startHour * 60 + startMin;

    const formatTime = (mins) => {
      const h24 = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      const ampm = h24 >= 12 ? "PM" : "AM";
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    // 1. Morning Assembly (if configured)
    if (settings.assembly_duration_minutes > 0) {
      const nextMinutes = currentMinutes + Number(settings.assembly_duration_minutes);
      slots.push({
        type: "assembly",
        label: "Morning Assembly",
        time: `${formatTime(currentMinutes)} - ${formatTime(nextMinutes)}`,
        duration: `${settings.assembly_duration_minutes} mins`,
      });
      currentMinutes = nextMinutes;
    }

    // 2. Periods & Breaks
    const numPeriods = Number(settings.periods_per_day) || 8;
    const pDuration = Number(settings.period_duration_minutes) || 50;

    for (let p = 1; p <= numPeriods; p++) {
      const endPeriod = currentMinutes + pDuration;
      slots.push({
        type: "period",
        periodIndex: p,
        label: `Period ${p}`,
        time: `${formatTime(currentMinutes)} - ${formatTime(endPeriod)}`,
        duration: `${pDuration} mins`,
      });
      currentMinutes = endPeriod;

      // Recess Break
      if (p === Number(settings.recess_after_period) && Number(settings.recess_duration_minutes) > 0) {
        const endRecess = currentMinutes + Number(settings.recess_duration_minutes);
        slots.push({
          type: "break",
          label: "Short Recess / Break",
          time: `${formatTime(currentMinutes)} - ${formatTime(endRecess)}`,
          duration: `${settings.recess_duration_minutes} mins`,
        });
        currentMinutes = endRecess;
      }

      // Lunch Break
      if (p === Number(settings.lunch_after_period) && Number(settings.lunch_duration_minutes) > 0) {
        const endLunch = currentMinutes + Number(settings.lunch_duration_minutes);
        slots.push({
          type: "break",
          label: "Lunch Break",
          time: `${formatTime(currentMinutes)} - ${formatTime(endLunch)}`,
          duration: `${settings.lunch_duration_minutes} mins`,
        });
        currentMinutes = endLunch;
      }
    }

    return slots;
  }, [settings]);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    const sanitized = {
      ...settings,
      period_duration_minutes: Number(settings.period_duration_minutes) || 50,
      assembly_duration_minutes:
        settings.assembly_duration_minutes !== undefined && settings.assembly_duration_minutes !== ""
          ? Number(settings.assembly_duration_minutes)
          : 0,
      recess_after_period: Number(settings.recess_after_period) || 4,
      recess_duration_minutes:
        settings.recess_duration_minutes !== undefined && settings.recess_duration_minutes !== ""
          ? Number(settings.recess_duration_minutes)
          : 0,
      lunch_after_period: Number(settings.lunch_after_period) || 6,
      lunch_duration_minutes:
        settings.lunch_duration_minutes !== undefined && settings.lunch_duration_minutes !== ""
          ? Number(settings.lunch_duration_minutes)
          : 0,
      periods_per_day: Number(settings.periods_per_day) || 8,
      saturday_periods: Number(settings.saturday_periods) || 5,
      max_daily_subject_periods: Number(settings.max_daily_subject_periods) || 1,
    };
    try {
      const res = await saveTimetableSettings(sanitized);
      const savedData = res?.data || sanitized;

      // Broadcast globally across portal
      window.dispatchEvent(new window.CustomEvent("timetable-settings-updated", { detail: savedData }));
      try {
        localStorage.setItem("timetable_settings", JSON.stringify(savedData));
      } catch (err) {}

      toast.success("School bell schedule saved & applied successfully!");
      if (onSaved) onSaved(savedData);
      onClose();
    } catch (err) {
      console.warn("Save bell settings notice:", err.message);
      // Fallback: apply locally so user is never blocked
      window.dispatchEvent(new window.CustomEvent("timetable-settings-updated", { detail: sanitized }));
      try {
        localStorage.setItem("timetable_settings", JSON.stringify(sanitized));
      } catch (e) {}

      toast.success("School bell schedule applied!");
      if (onSaved) onSaved(sanitized);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          borderRadius: "14px",
          background: "var(--card-bg, #ffffff)",
          boxShadow: "0 20px 30px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.2rem 1.5rem",
            borderBottom: "1px solid var(--border-color, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(27, 139, 59, 0.15)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} strokeWidth={2.4} />
            </span>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                School Bell Schedule & Period Settings
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                Configurable duration, assembly, recess, and lunch intervals (US-01)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Two Columns: Settings Form (Left) & Live Preview (Right) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "1.5rem",
            padding: "1.5rem",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Form */}
          <form id="bell-settings-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Academic Year & School Start Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Academic Session
                </label>
                <input
                  type="text"
                  value={settings.academic_year}
                  onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    background: "var(--card-bg, #ffffff)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  School Start Time
                </label>
                <input
                  type="text"
                  value={settings.school_start_time}
                  placeholder="08:00 AM"
                  onChange={(e) => setSettings({ ...settings, school_start_time: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    background: "var(--card-bg, #ffffff)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
            </div>

            {/* Period Duration & Assembly Duration */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Lecture Period Duration
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="number"
                    min="30"
                    max="90"
                    value={settings.period_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, period_duration_minutes: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      background: "var(--card-bg, #ffffff)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>mins</span>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                    Morning Assembly
                  </label>
                  {Number(settings.assembly_duration_minutes) > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, assembly_duration_minutes: 0 }))}
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, assembly_duration_minutes: 20 }))}
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#059669",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      + Enable
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="number"
                    min="0"
                    max="45"
                    value={settings.assembly_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, assembly_duration_minutes: e.target.value })}
                    placeholder="0 to disable"
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      background: Number(settings.assembly_duration_minutes) === 0 ? "#f1f5f9" : "var(--card-bg, #ffffff)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>mins</span>
                </div>
              </div>
            </div>

            {/* Recess Interval */}
            <div style={{ background: Number(settings.recess_duration_minutes) === 0 ? "#f1f5f9" : "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Coffee size={13} style={{ color: "#d97706" }} />
                  <span>Short Recess Break (Breather)</span>
                </div>
                {Number(settings.recess_duration_minutes) > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, recess_duration_minutes: 0 }))}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      padding: "1px 6px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, recess_duration_minutes: 20, recess_after_period: prev.recess_after_period || 4 }))}
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#059669",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      padding: "1px 6px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    + Enable
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "2px" }}>
                    After Period #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    disabled={Number(settings.recess_duration_minutes) === 0}
                    value={settings.recess_after_period}
                    onChange={(e) => setSettings({ ...settings, recess_after_period: e.target.value })}
                    style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: Number(settings.recess_duration_minutes) === 0 ? "#e2e8f0" : "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "2px" }}>
                    Duration (Minutes, 0 = off)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={settings.recess_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, recess_duration_minutes: e.target.value })}
                    placeholder="0 to disable"
                    style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: Number(settings.recess_duration_minutes) === 0 ? "#e2e8f0" : "#ffffff" }}
                  />
                </div>
              </div>
            </div>

            {/* Lunch Interval */}
            <div style={{ background: Number(settings.lunch_duration_minutes) === 0 ? "#f1f5f9" : "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Coffee size={13} style={{ color: "#16a34a" }} />
                  <span>Lunch Break</span>
                </div>
                {Number(settings.lunch_duration_minutes) > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, lunch_duration_minutes: 0 }))}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      padding: "1px 6px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, lunch_duration_minutes: 40, lunch_after_period: prev.lunch_after_period || 6 }))}
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#059669",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      padding: "1px 6px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    + Enable
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "2px" }}>
                    After Period #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    disabled={Number(settings.lunch_duration_minutes) === 0}
                    value={settings.lunch_after_period}
                    onChange={(e) => setSettings({ ...settings, lunch_after_period: e.target.value })}
                    style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: Number(settings.lunch_duration_minutes) === 0 ? "#e2e8f0" : "#ffffff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "2px" }}>
                    Duration (Minutes, 0 = off)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.lunch_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, lunch_duration_minutes: e.target.value })}
                    placeholder="0 to disable"
                    style={{ width: "100%", padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: Number(settings.lunch_duration_minutes) === 0 ? "#e2e8f0" : "#ffffff" }}
                  />
                </div>
              </div>
            </div>

            {/* Weekday vs Saturday periods */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Weekday Periods / Day
                </label>
                <input
                  type="number"
                  min="4"
                  max="10"
                  value={settings.periods_per_day}
                  onChange={(e) => setSettings({ ...settings, periods_per_day: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    background: "var(--card-bg, #ffffff)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Saturday Periods (Half-Day)
                </label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={settings.saturday_periods}
                  onChange={(e) => setSettings({ ...settings, saturday_periods: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    background: "var(--card-bg, #ffffff)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
            </div>

            {/* Daily Subject Distribution Rule */}
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem 0.85rem",
                borderRadius: "8px",
                background: "rgba(5, 150, 105, 0.05)",
                border: "1px solid rgba(5, 150, 105, 0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#065f46" }}>
                  Max Daily Lectures per Subject
                </label>
                <span style={{ fontSize: "0.7rem", color: "#047857", fontWeight: "700" }}>
                  Timetable Engine Rule
                </span>
              </div>
              <select
                value={settings.max_daily_subject_periods !== undefined ? Number(settings.max_daily_subject_periods) : 1}
                onChange={(e) => setSettings((prev) => ({ ...prev, max_daily_subject_periods: Number(e.target.value) }))}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <option value={1}>1 Period / Day Strictly (Single Daily Lecture standard)</option>
                <option value={2}>Up to 2 Periods / Day (Default - Permits Double Periods & Quotas &gt; 6)</option>
                <option value={3}>Up to 3 Periods / Day (Flexible / Intensive Teaching)</option>
              </select>
              <p style={{ margin: "5px 0 0", fontSize: "0.7rem", color: "#64748b", lineHeight: "1.3" }}>
                When subjects have weekly quotas exceeding 6 (e.g. 10 periods/week), setting this to 2 permits double periods on some days so all requested periods fit into a 6-day week.
              </p>
            </div>
          </form>

          {/* Right Column: Live Computed Bell Timetable Preview */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b" }}>
                Computed Daily Bell Schedule
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--accent-primary)", fontWeight: "700" }}>
                {previewSlots.length} Slots
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {previewSlots.map((slot, idx) => {
                const isBreak = slot.type === "break" || slot.type === "assembly";
                return (
                  <div
                    key={idx}
                    style={{
                      background: isBreak ? "#fef3c7" : "#ffffff",
                      border: isBreak ? "1px dashed #f59e0b" : "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "0.45rem 0.65rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: "700", color: isBreak ? "#b45309" : "#1e293b" }}>
                        {slot.label}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{slot.time}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: "600", color: isBreak ? "#92400e" : "#475569" }}>
                        {slot.duration}
                      </span>
                      {isBreak && (
                        <button
                          type="button"
                          onClick={() => {
                            if (slot.type === "assembly") {
                              setSettings((prev) => ({ ...prev, assembly_duration_minutes: 0 }));
                              toast.info("Morning Assembly removed from preview");
                            } else if (slot.label.toLowerCase().includes("recess")) {
                              setSettings((prev) => ({ ...prev, recess_duration_minutes: 0 }));
                              toast.info("Short Recess removed from preview");
                            } else if (slot.label.toLowerCase().includes("lunch")) {
                              setSettings((prev) => ({ ...prev, lunch_duration_minutes: 0 }));
                              toast.info("Lunch Break removed from preview");
                            }
                          }}
                          title={`Delete ${slot.label}`}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#b91c1c",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            padding: "2px 6px",
                            fontSize: "0.72rem",
                            fontWeight: "800",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "0.9rem 1.5rem",
            borderTop: "1px solid var(--border-color, #e2e8f0)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            background: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 1.25rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              borderRadius: "6px",
              background: "var(--accent-primary)",
              color: "#ffffff",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(27, 139, 59, 0.25)",
            }}
          >
            <Save size={15} />
            <span>{saving ? "Saving..." : "Save Bell Schedule"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

