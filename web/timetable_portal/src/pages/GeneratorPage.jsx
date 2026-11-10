import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Sparkles,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  UploadCloud,
  Eye,
  Info,
  Edit3,
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { fetchClasses, fetchUsers, fetchSubjects, fetchTimeTables } from "../features/dataSlice";
import {
  fetchMasterAllotmentMatrix,
  fetchTeacherQuotas,
  fetchTimetableSettings,
  saveTimetableSettings,
} from "../services/teacherScheduleApi";
import { createDayTimeTable } from "../services/api";
import {
  runPreGenerationAudit,
  generateDraftTimetable,
  computeBellTimeSlots,
} from "../services/timetableGeneratorEngine";
import { detectClashes } from "../services/clashDetector";
import { getSubjectColor } from "../config/constants";
import BellScheduleModal from "../components/BellScheduleModal";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

export default function GeneratorPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux data
  const { classes = [], users = [], subjects = [], timeTables = [] } = useSelector((state) => state.data || {});

  // Local state
  const [allotmentData, setAllotmentData] = useState({ matrix: {}, totals: {} });
  const [teacherQuotas, setTeacherQuotas] = useState({});
  const [bellSettings, setBellSettings] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Engine state
  const [auditResult, setAuditResult] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [draftSchedule, setDraftSchedule] = useState({});
  const [selectedClassId, setSelectedClassId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [isBellModalOpen, setIsBellModalOpen] = useState(false);
  const [isAuditCollapsed, setIsAuditCollapsed] = useState(true);

  // Publish Dialog & Schedule Extension State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishOnlyCurrent, setPublishOnlyCurrent] = useState(false);
  const [publishStartMonday, setPublishStartMonday] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const dayNum = String(monday.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayNum}`;
  });
  const [publishWeeksCount, setPublishWeeksCount] = useState(4); // Default to 4 weeks (1 month)
  const [publishCompletedInfo, setPublishCompletedInfo] = useState(null);

  // Interactive Drag & Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Interactive Click-to-Edit modal state
  const [editingPeriodModal, setEditingPeriodModal] = useState(null);

  // Dynamic slot calculations for period duration display
  const dynamicSlots = useMemo(() => computeBellTimeSlots(bellSettings), [bellSettings]);

  // Load prerequisites
  useEffect(() => {
    if (!classes.length) dispatch(fetchClasses());
    if (!users.length) dispatch(fetchUsers());
    if (!subjects.length) dispatch(fetchSubjects());
    if (!timeTables.length) dispatch(fetchTimeTables());

    const loadMatrixAndQuotas = async () => {
      try {
        setLoadingInitial(true);
        const [matrixRes, quotasRes, settingsRes] = await Promise.all([
          fetchMasterAllotmentMatrix({ academicYear: "2026 - 2027" }),
          fetchTeacherQuotas(),
          fetchTimetableSettings(),
        ]);

        if (matrixRes) {
          setAllotmentData(matrixRes);
          try {
            const activeStaff = (users || []).filter((u) => u.type === "teacher" || u.role === "teacher");
            const audit = runPreGenerationAudit({
              classes: matrixRes.classes || classes,
              subjects: matrixRes.subjects || subjects,
              teachers: activeStaff,
              allotmentMatrix: matrixRes.matrix || {},
              teacherQuotas: quotasRes?.teacherQuotas || {},
              bellSettings: settingsRes || {},
              existingTimeTables: timeTables,
            });
            setAuditResult(audit);
          } catch (e) {
            console.warn("Auto-audit error:", e);
          }
        }
        if (quotasRes?.teacherQuotas) setTeacherQuotas(quotasRes.teacherQuotas);
        if (settingsRes) setBellSettings(settingsRes);
      } catch (err) {
        console.error("Failed to load generator inputs:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadMatrixAndQuotas();
  }, [dispatch]);

  // Set default selected class once loaded
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Listen for global bell settings updates
  useEffect(() => {
    const handleSettingsUpdated = (e) => {
      if (e.detail) {
        setBellSettings(e.detail);
        handleRunAudit(e.detail);
        handleGenerate(e.detail);
      }
    };
    window.addEventListener("timetable-settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("timetable-settings-updated", handleSettingsUpdated);
  }, []);

  // Filter teachers list
  const teachers = useMemo(() => {
    return (users || []).filter((u) => u.type === "teacher" || u.role === "teacher");
  }, [users]);

  const activeClasses = useMemo(() => {
    return (allotmentData.classes && allotmentData.classes.length > 0) ? allotmentData.classes : classes;
  }, [allotmentData.classes, classes]);

  const activeSubjects = useMemo(() => {
    return (allotmentData.subjects && allotmentData.subjects.length > 0) ? allotmentData.subjects : subjects;
  }, [allotmentData.subjects, subjects]);

  // 1. Run Pre-Generation Feasibility & Capacity Audit (US-15)
  const handleRunAudit = (overrideSettings = null) => {
    setIsAuditing(true);
    setIsAuditCollapsed(false);
    const activeBell = overrideSettings || bellSettings;
    setTimeout(() => {
      try {
        const result = runPreGenerationAudit({
          classes: activeClasses,
          subjects: activeSubjects,
          teachers,
          allotmentMatrix: allotmentData.matrix || {},
          teacherQuotas,
          bellSettings: activeBell,
          existingTimeTables: timeTables,
        });
        setAuditResult(result);
        if (result.isFeasible) {
          toast.success("Capacity Audit Passed! System has sufficient faculty hours to generate timetable.");
        } else {
          toast.warn(`Audit Warning: ${result.unassignedSubjects.length} subjects require teacher allotment.`);
        }
      } catch (err) {
        toast.error("Audit failed: " + err.message);
      } finally {
        setIsAuditing(false);
      }
    }, 400);
  };

  // 2. Run Automatic Timetable Generation (US-16)
  const handleGenerate = (overrideSettings = null) => {
    setIsGenerating(true);
    setPublishedSuccess(false);
    const activeBell = overrideSettings || bellSettings;

    setTimeout(() => {
      try {
        const result = generateDraftTimetable({
          classes: activeClasses,
          subjects: activeSubjects,
          teachers,
          allotmentMatrix: allotmentData.matrix || {},
          bellSettings: activeBell,
        });

        setGeneratedDraft(result);
        setDraftSchedule(result.schedule || {});
        setIsAuditCollapsed(true); // Auto-collapse audit to give maximum room to the generated schedule
        if (result.success) {
          toast.success(`Generated 0-Clash Timetable across ${activeClasses.length} classes (${result.totalScheduled} periods)!`);
        } else {
          toast.info(`Draft generated: ${result.totalScheduled} periods placed across ${activeClasses.length} classes!`);
        }
      } catch (err) {
        console.error("Generation error:", err);
        toast.error("Generation failed: " + err.message);
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  };

  // 3. Drag & Drop Reordering / Swapping Handlers
  const handleDragStart = (e, day, slotIdx, period) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem({ day, slotIdx, period });
  };

  const handleDragOver = (e, day, slotIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dropTarget || dropTarget.day !== day || dropTarget.slotIdx !== slotIdx) {
      setDropTarget({ day, slotIdx });
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e, targetDay, targetSlotIdx) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem || !selectedClassId) return;
    const { day: sourceDay, slotIdx: sourceSlotIdx, period: sourcePeriod } = draggedItem;

    if (sourceDay === targetDay && sourceSlotIdx === targetSlotIdx) {
      setDraggedItem(null);
      return;
    }

    setDraftSchedule((prev) => {
      const classSched = prev[selectedClassId] ? { ...prev[selectedClassId] } : {};
      const sourceDayArr = [...(classSched[sourceDay] || [])];
      const targetDayArr = sourceDay === targetDay ? sourceDayArr : [...(classSched[targetDay] || [])];

      const sourceItem = sourceDayArr[sourceSlotIdx];
      const targetItem = targetDayArr[targetSlotIdx];

      const sourceSlotMeta = dynamicSlots[sourceSlotIdx] || { fullLabel: `Period ${sourceSlotIdx + 1}`, timeRange: "" };
      const targetSlotMeta = dynamicSlots[targetSlotIdx] || { fullLabel: `Period ${targetSlotIdx + 1}`, timeRange: "" };

      // Update sourceItem for target slot
      const updatedSourceItem = sourceItem
        ? {
            ...sourceItem,
            dayOfWeek: targetDay,
            slotIndex: targetSlotIdx,
            periodNumber: targetSlotIdx + 1,
            timeSlot: targetSlotMeta.fullLabel,
            timeRange: targetSlotMeta.timeRange,
            durationMins: targetSlotMeta.durationMins || bellSettings.period_duration_minutes || 50,
          }
        : null;

      // Update targetItem for source slot
      const updatedTargetItem = targetItem
        ? {
            ...targetItem,
            dayOfWeek: sourceDay,
            slotIndex: sourceSlotIdx,
            periodNumber: sourceSlotIdx + 1,
            timeSlot: sourceSlotMeta.fullLabel,
            timeRange: sourceSlotMeta.timeRange,
            durationMins: sourceSlotMeta.durationMins || bellSettings.period_duration_minutes || 50,
          }
        : null;

      targetDayArr[targetSlotIdx] = updatedSourceItem;
      if (sourceDay === targetDay) {
        sourceDayArr[sourceSlotIdx] = updatedTargetItem;
        classSched[targetDay] = targetDayArr;
      } else {
        sourceDayArr[sourceSlotIdx] = updatedTargetItem;
        classSched[sourceDay] = sourceDayArr;
        classSched[targetDay] = targetDayArr;
      }

      toast.info(`Moved ${sourcePeriod?.subject || "period"} to ${targetDay.toUpperCase()} Period ${targetSlotIdx + 1}`);

      return {
        ...prev,
        [selectedClassId]: classSched,
      };
    });

    setDraggedItem(null);
  };

  // 4. Click-to-Edit Modal Handlers
  const handleOpenEditModal = (day, slotIdx, period) => {
    setEditingPeriodModal({
      day,
      slotIdx,
      period,
      subjectId: period?.subjectId || "",
      subjectName: period?.subject || "",
      teacherId: period?.teacherId || "",
      teacherName: period?.teacher || "",
      roomNumber: period?.roomNumber || "Classroom",
    });
  };

  const handleSavePeriodEdit = (e) => {
    e.preventDefault();
    if (!editingPeriodModal || !selectedClassId) return;

    const { day, slotIdx, subjectId, teacherId, roomNumber } = editingPeriodModal;
    const chosenSub = (subjects || []).find((s) => s.id === subjectId);
    const chosenTeacher = (users || []).find((u) => u.id === teacherId);

    const slotMeta = dynamicSlots[slotIdx] || {
      fullLabel: `Period ${slotIdx + 1}`,
      timeRange: "",
      durationMins: bellSettings.period_duration_minutes || 50,
    };

    setDraftSchedule((prev) => {
      const classSched = prev[selectedClassId] ? { ...prev[selectedClassId] } : {};
      const dayArr = [...(classSched[day] || [])];

      dayArr[slotIdx] = {
        id: `edit-${selectedClassId}-${day}-${slotIdx}-${Date.now()}`,
        classId: selectedClassId,
        subjectId: chosenSub?.id || subjectId,
        subject: chosenSub?.name || editingPeriodModal.subjectName || "Subject",
        teacherId: chosenTeacher?.id || teacherId,
        teacher: chosenTeacher?.name || editingPeriodModal.teacherName || "Teacher",
        roomNumber: roomNumber || "Classroom",
        periodNumber: slotIdx + 1,
        timeSlot: slotMeta.fullLabel,
        timeRange: slotMeta.timeRange,
        durationMins: slotMeta.durationMins,
        durationLabel: `${slotMeta.durationMins} mins`,
        slotIndex: slotIdx,
        dayOfWeek: day,
        isBreak: false,
      };

      classSched[day] = dayArr;
      return { ...prev, [selectedClassId]: classSched };
    });

    toast.success(`Period ${slotIdx + 1} updated successfully!`);
    setEditingPeriodModal(null);
  };

  const handleClearSlot = () => {
    if (!editingPeriodModal || !selectedClassId) return;
    const { day, slotIdx } = editingPeriodModal;

    setDraftSchedule((prev) => {
      const classSched = prev[selectedClassId] ? { ...prev[selectedClassId] } : {};
      const dayArr = [...(classSched[day] || [])];
      dayArr[slotIdx] = null;
      classSched[day] = dayArr;
      return { ...prev, [selectedClassId]: classSched };
    });

    toast.info(`Period ${slotIdx + 1} cleared (set to Free).`);
    setEditingPeriodModal(null);
  };

  const handleRemoveAssembly = async () => {
    if (!window.confirm("Do you want to delete Morning Assembly from the Bell Schedule?")) return;
    const updated = { ...bellSettings, assembly_duration_minutes: 0 };
    setBellSettings(updated);
    try {
      await saveTimetableSettings(updated);
      window.dispatchEvent(new window.CustomEvent("timetable-settings-updated", { detail: updated }));
      toast.success("Morning Assembly deleted");
    } catch (e) {
      toast.error("Failed to delete Morning Assembly");
    }
  };

  const handleRemoveRecess = async () => {
    if (!window.confirm("Do you want to delete Short Recess from the Bell Schedule?")) return;
    const updated = { ...bellSettings, recess_duration_minutes: 0 };
    setBellSettings(updated);
    try {
      await saveTimetableSettings(updated);
      window.dispatchEvent(new window.CustomEvent("timetable-settings-updated", { detail: updated }));
      toast.success("Short Recess deleted");
    } catch (e) {
      toast.error("Failed to delete Short Recess");
    }
  };

  const handleRemoveLunch = async () => {
    if (!window.confirm("Do you want to delete Lunch Break from the Bell Schedule?")) return;
    const updated = { ...bellSettings, lunch_duration_minutes: 0 };
    setBellSettings(updated);
    try {
      await saveTimetableSettings(updated);
      window.dispatchEvent(new window.CustomEvent("timetable-settings-updated", { detail: updated }));
      toast.success("Lunch Break deleted");
    } catch (e) {
      toast.error("Failed to delete Lunch Break");
    }
  };

  // 5. Publish Master Timetable to Database (US-17)
  const openPublishDialog = (onlyCurrentClass = false) => {
    const activeSched = Object.keys(draftSchedule).length > 0 ? draftSchedule : (generatedDraft?.schedule || {});
    if (!activeSched || Object.keys(activeSched).length === 0) {
      toast.warn("Please generate a draft routine first.");
      return;
    }
    setPublishOnlyCurrent(onlyCurrentClass);
    setPublishCompletedInfo(null);
    setPublishModalOpen(true);
  };

  const handlePublishMaster = (onlyCurrentClass = false) => {
    openPublishDialog(onlyCurrentClass);
  };

  const executePublish = async () => {
    const activeSched = Object.keys(draftSchedule).length > 0 ? draftSchedule : (generatedDraft?.schedule || {});
    if (!activeSched || Object.keys(activeSched).length === 0) {
      toast.warn("Please generate a draft routine first.");
      return;
    }

    const currentClassObj = (activeClasses || []).find((c) => c.id === selectedClassId);
    const currentClassName = currentClassObj?.label || (currentClassObj ? `${currentClassObj.name} ${currentClassObj.section || ""}`.trim() : "Current Class");

    const targetEntries = publishOnlyCurrent
      ? Object.entries(activeSched).filter(([classId]) => classId === selectedClassId)
      : Object.entries(activeSched);

    if (targetEntries.length === 0) {
      toast.warn("No class schedule available to publish.");
      return;
    }

    setPublishing(true);
    try {
      let savedCount = 0;
      const numWeeks = Math.max(1, Math.min(12, Number(publishWeeksCount) || 1));
      const baseMonday = new Date(publishStartMonday + "T00:00:00");

      const dayOffsets = {
        monday: 0,
        tuesday: 1,
        wednesday: 2,
        thursday: 3,
        friday: 4,
        saturday: 5,
      };

      for (let w = 0; w < numWeeks; w++) {
        const weekMonday = new Date(baseMonday);
        weekMonday.setDate(baseMonday.getDate() + w * 7);

        for (const [classId, classData] of targetEntries) {
          for (const [dayKey, offset] of Object.entries(dayOffsets)) {
            const periods = classData?.[dayKey] || [];
            const timeTables = periods.map((p, slotIdx) => {
              if (!p) return null;
              const targetSlot = p.slotIndex !== undefined ? p.slotIndex : slotIdx;
              const slotMeta = dynamicSlots[targetSlot] || { timeRange: "08:00 AM - 08:50 AM" };

              // Convert to standard 24-hr format "HH:mm - HH:mm" for BigCalendar and portal parity
              const timeRaw = slotMeta.timeRange || p.timeRange || (p.timeSlot?.includes("(") ? p.timeSlot.split("(")[1].replace(")", "").trim() : p.timeSlot);
              const matches = [...String(timeRaw || "").matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)?/gi)];
              let formattedTime = "08:00 - 08:50";
              if (matches.length >= 2) {
                const to24 = (hStr, mStr, ampm) => {
                  let h = parseInt(hStr, 10);
                  const m = parseInt(mStr, 10);
                  if (ampm) {
                    const isPM = ampm.toUpperCase() === "PM";
                    if (isPM && h < 12) h += 12;
                    if (!isPM && h === 12) h = 0;
                  }
                  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                };
                formattedTime = `${to24(matches[0][1], matches[0][2], matches[0][3])} - ${to24(matches[1][1], matches[1][2], matches[1][3])}`;
              }

              return {
                time: formattedTime,
                teacher: p.teacherId,
                subject: p.subject,
                roomNumber: p.roomNumber,
                isBreak: p.isBreak || false,
              };
            }).filter(Boolean);

            if (timeTables.length > 0 && classId) {
              const dayDate = new Date(weekMonday);
              dayDate.setDate(weekMonday.getDate() + offset);
              const y = dayDate.getFullYear();
              const m = String(dayDate.getMonth() + 1).padStart(2, "0");
              const d = String(dayDate.getDate()).padStart(2, "0");
              const dateStr = `${y}-${m}-${d}`;

              await createDayTimeTable({
                classId,
                date: dateStr,
                timeTables,
              });
              savedCount++;
            }
          }
        }
      }

      // Synchronize Redux store and notify listeners
      await dispatch(fetchTimeTables());
      window.dispatchEvent(new CustomEvent("timetable-updated"));

      setPublishedSuccess(true);
      const completionDetails = {
        classCount: targetEntries.length,
        weeksCount: numWeeks,
        savedCount,
        className: publishOnlyCurrent ? currentClassName : `All ${targetEntries.length} Classes`,
        startDate: publishStartMonday,
      };
      setPublishCompletedInfo(completionDetails);

      toast.success(
        publishOnlyCurrent
          ? `Timetable published for "${currentClassName}" across ${numWeeks} week(s)!`
          : `Master Timetable published across all ${targetEntries.length} classes for ${numWeeks} week(s) (${savedCount} class-days)!`
      );
    } catch (err) {
      console.error("Publish error:", err);
      toast.error("Failed to publish timetable: " + (err.message || "Unknown error"));
    } finally {
      setPublishing(false);
    }
  };

  // Selected Class's Generated Schedule
  const activeClassSchedule = useMemo(() => {
    if (!selectedClassId) return null;
    return draftSchedule[selectedClassId] || generatedDraft?.schedule?.[selectedClassId] || null;
  }, [draftSchedule, generatedDraft, selectedClassId]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "3rem" }}>
      {/* 1. Page Header Toolbar */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(5, 150, 105, 0.15)",
                color: "#059669",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} strokeWidth={2.4} />
            </span>
            <h1 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              Automatic Timetable Generation Engine
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "4px 0 0 34px" }}>
            Algorithmic constraint satisfaction engine · 0-clash mathematical guarantee · 1-click master publishing
          </p>
        </div>

        {/* Action CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Bell Schedule & Duration Settings CTA */}
          <button
            onClick={() => setIsBellModalOpen(true)}
            className="btn-outline"
            title="Configure Period Duration, Start Time, Assembly and Breaks"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              borderRadius: "8px",
              cursor: "pointer",
              border: "1px solid #10b981",
              background: "rgba(16, 185, 129, 0.08)",
              color: "#047857",
              fontWeight: "700",
            }}
          >
            <Clock size={15} style={{ color: "#059669" }} />
            <span>Bell Timings ({bellSettings.period_duration_minutes || 50}m / period)</span>
          </button>

          {/* Audit CTA (US-15) */}
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              borderRadius: "8px",
              cursor: "pointer",
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              color: "var(--text-primary)",
              fontWeight: "600",
            }}
          >
            <ShieldCheck size={15} style={{ color: "var(--accent-primary)" }} />
            <span>{isAuditing ? "Auditing..." : "1. Pre-Generation Audit"}</span>
          </button>

          {/* Generator CTA (US-16) */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 1.15rem",
              fontSize: "0.85rem",
              fontWeight: "700",
              borderRadius: "8px",
              background: "#059669",
              color: "#ffffff",
              border: "none",
              cursor: isGenerating ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
            }}
          >
            <Sparkles size={15} className={isGenerating ? "animate-spin" : ""} />
            <span>{isGenerating ? "Optimizing Slots..." : "2. Generate 0-Clash Routine"}</span>
          </button>

          {/* Publish CTAs (US-17) */}
          {generatedDraft && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Option A: Publish Currently Inspected Class Only */}
              <button
                onClick={() => handlePublishMaster(true)}
                disabled={publishing}
                title="Publish routine for the currently inspected class only"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "var(--accent-primary, #1b8b3b)",
                  border: "1.5px solid var(--accent-primary, #1b8b3b)",
                  cursor: publishing ? "not-allowed" : "pointer",
                }}
              >
                <CheckCircle2 size={14} />
                <span>Publish This Class</span>
              </button>

              {/* Option B: Publish All 25 Classes in 1 Shot */}
              <button
                onClick={() => handlePublishMaster(false)}
                disabled={publishing}
                title="Publish routine across all class divisions simultaneously"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.45rem 1.15rem",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  background: publishedSuccess ? "#16a34a" : "var(--accent-primary)",
                  color: "#ffffff",
                  border: "none",
                  cursor: publishing ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(27, 139, 59, 0.3)",
                }}
              >
                {publishedSuccess ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Published ({activeClasses.length} Classes)</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>{publishing ? "Publishing..." : `Publish All (${activeClasses.length} Classes)`}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Pre-Generation Capacity Audit Results Banner (US-15) - Collapsible */}
      {auditResult && (
        isAuditCollapsed ? (
          <div
            className="glass-panel animate-fade-in"
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: auditResult.isFeasible ? "1px solid #86efac" : "1px solid #fde047",
              background: auditResult.isFeasible ? "#f0fdf4" : "#fffbeb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              {auditResult.isFeasible ? (
                <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
              ) : (
                <AlertTriangle size={18} style={{ color: "#d97706" }} />
              )}
              <span style={{ fontSize: "0.86rem", fontWeight: "700", color: "#1e293b" }}>
                {auditResult.isFeasible
                  ? "Capacity Audit: Feasible"
                  : `Capacity Warning: ${auditResult.unassignedSubjects.length} Unassigned Subjects`}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  padding: "2px 7px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                }}
              >
                Headroom: +{auditResult.netBalance} Periods/Wk ({auditResult.totalRequiredPeriods} Req / {auditResult.totalFacultyCapacity} Cap)
              </span>
              {auditResult.alreadyAllocatedSlots?.length > 0 && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "#eff6ff",
                    color: "#1e40af",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {auditResult.alreadyAllocatedSlots.length} Existing Slots Scheduled
                </span>
              )}
            </div>

            <button
              onClick={() => setIsAuditCollapsed(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "4px 9px",
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "#1e293b",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <span>Show Audit Details</span>
              <ChevronDown size={14} />
            </button>
          </div>
        ) : (
          <div
            className="glass-panel animate-fade-in"
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              border: auditResult.isFeasible ? "1px solid #86efac" : "1px solid #fde047",
              background: auditResult.isFeasible ? "#f0fdf4" : "#fffbeb",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {auditResult.isFeasible ? (
                  <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: "#d97706" }} />
                )}
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  {auditResult.isFeasible
                    ? "Pre-Generation Capacity Audit Passed (Feasible)"
                    : "Pre-Generation Capacity Warning"}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "8px",
                    background: auditResult.isFeasible ? "#dcfce7" : "#fef3c7",
                    color: auditResult.isFeasible ? "#15803d" : "#b45309",
                  }}
                >
                  Net Faculty Headroom: +{auditResult.netBalance} Periods / Week
                </span>
                <button
                  onClick={() => setIsAuditCollapsed(true)}
                  title="Collapse audit to maximize schedule workspace"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "0.74rem",
                    fontWeight: "700",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  <span>Collapse</span>
                  <ChevronUp size={14} />
                </button>
              </div>
            </div>

          {/* Metric Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.82rem" }}>
            <div>
              <span style={{ color: "#64748b" }}>Total Required Lectures: </span>
              <strong style={{ color: "#0f172a" }}>{auditResult.totalRequiredPeriods} Periods/Wk</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Faculty Available Capacity: </span>
              <strong style={{ color: "#16a34a" }}>{auditResult.totalFacultyCapacity} Periods/Wk</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Classes: </span>
              <strong style={{ color: "#0f172a" }}>{auditResult.totalClasses} Divisions</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Active Faculty: </span>
              <strong style={{ color: "#0f172a" }}>{auditResult.totalTeachers} Staff</strong>
            </div>
          </div>

          {/* Unassigned Subjects Warnings */}
          {auditResult.unassignedSubjects.length > 0 && (
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#b45309", marginBottom: "4px" }}>
                Unassigned Subjects Requiring Teacher Pairing ({auditResult.unassignedSubjects.length}):
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {auditResult.unassignedSubjects.slice(0, 6).map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.72rem",
                      background: "#ffffff",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {item.className}: {item.subjectName} ({item.quota} periods)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* High Weekly Quotas Alert (>6 periods/wk requiring multiple daily lectures) */}
          {auditResult.highQuotaSubjects && auditResult.highQuotaSubjects.length > 0 && (
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#0369a1" }}>
                  ⚡ High Quotas Requiring Multiple Lectures/Day ({auditResult.highQuotaSubjects.length} subjects):
                </span>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  Configured rule: max {bellSettings.max_daily_subject_periods || 2} periods/day allowed
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {auditResult.highQuotaSubjects.slice(0, 10).map((item, idx) => (
                  <span
                    key={`hq_${idx}`}
                    style={{
                      fontSize: "0.72rem",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1e40af",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                    title={`${item.quota} periods across 6 days requires ${item.periodsPerDayNeeded} periods on some days. Faculty: ${item.teacherName}`}
                  >
                    <strong>{item.className}</strong>: {item.subjectName} ({item.quota}/wk → {item.periodsPerDayNeeded}/day)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Class Overcapacity Warning (Weekly Period Overflow) */}
          {auditResult.classOvercapacity && auditResult.classOvercapacity.length > 0 && (
            <div style={{ borderTop: "1px dashed #fca5a5", paddingTop: "0.5rem", background: "rgba(254, 242, 242, 0.6)", padding: "0.5rem", borderRadius: "6px" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#dc2626", marginBottom: "4px" }}>
                🚨 Class Weekly Capacity Overload ({auditResult.classOvercapacity.length} Classes exceed available weekly slots):
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {auditResult.classOvercapacity.map((item, idx) => (
                  <span
                    key={`co_${idx}`}
                    style={{
                      fontSize: "0.72rem",
                      background: "#ffffff",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>{item.className}</strong>: {item.totalRequested} periods requested vs {item.availableSlots} max slots (+{item.excess} excess)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Already Allocated Periods Alert */}
          {auditResult.alreadyAllocatedClasses && auditResult.alreadyAllocatedClasses.length > 0 && (
            <div style={{ borderTop: "1px dashed #93c5fd", paddingTop: "0.5rem", background: "rgba(239, 246, 255, 0.7)", padding: "0.5rem", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1d4ed8" }}>
                  ℹ️ Already Allocated Periods Detected ({auditResult.alreadyAllocatedSlots.length} periods across {auditResult.alreadyAllocatedClasses.length} classes):
                </span>
                <span style={{ fontSize: "0.68rem", color: "#166534", background: "#dcfce7", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                  Idempotent Overwrite Enabled
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {auditResult.alreadyAllocatedClasses.map((item, idx) => (
                  <span
                    key={`alloc_${idx}`}
                    style={{
                      fontSize: "0.72rem",
                      background: "#ffffff",
                      border: "1px solid #bfdbfe",
                      color: "#1e40af",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>{item.className}</strong>: {item.count} periods already allocated ({item.dates.size} days)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    )}

      {/* 3. Visual Interactive Draft Board (US-16 & US-17) */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              Master Schedule Visual Review Board
            </h2>
            {generatedDraft && (
              <span
                style={{
                  fontSize: "0.74rem",
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CheckCircle2 size={12} />
                0 Clashes Detected
              </span>
            )}
          </div>

          {/* Class Division Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)" }}>Inspect Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #e2e8f0)",
                background: "var(--card-bg, #ffffff)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {(activeClasses || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Class ${c.name} ${c.section ? `(${c.section})` : ""}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generated Schedule Grid */}
        {activeClassSchedule ? (
          <div>
            {/* Interactive Editing Instruction Tip */}
            <div
              style={{
                padding: "0.55rem 0.85rem",
                background: "#f0fdf4",
                border: "1px dashed #86efac",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GripVertical size={14} style={{ color: "#16a34a" }} />
                <span>
                  <strong>Interactive Schedule Editor:</strong> Drag any period card to swap or reorder across days and slots. Click any card or Free slot to edit subject, teacher, or room before publishing.
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: "700" }}>
                Live Draft Ready
              </span>
            </div>

            <div
              className="custom-scrollbar"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(200px, 1fr))",
                gap: "0.75rem",
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: isAuditCollapsed ? "calc(100vh - 220px)" : "calc(100vh - 420px)",
                paddingBottom: "0.75rem",
                paddingRight: "0.25rem",
              }}
            >
              {DAYS.map((d) => {
                const periods = activeClassSchedule[d.key] || [];
                const maxSlots = d.key === "saturday"
                  ? (Number(bellSettings.saturday_periods) || 5)
                  : (Number(bellSettings.periods_per_day) || 7);

                return (
                  <div
                    key={d.key}
                    style={{
                      background: "var(--card-bg, #ffffff)",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Day Header */}
                    <div
                      style={{
                        padding: "0.6rem 0.75rem",
                        background: "var(--accent-light, #f0fdf4)",
                        borderBottom: "1px solid rgba(27, 139, 59, 0.2)",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        color: "var(--accent-primary, #1b8b3b)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      <span>{d.label}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                        {periods.filter(Boolean).length} Periods
                      </span>
                    </div>

                    {/* Period Cards */}
                    <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                      {/* Morning Assembly Banner */}
                      {Number(bellSettings.assembly_duration_minutes) > 0 && (
                        <div
                          style={{
                            padding: "0.4rem 0.6rem",
                            borderRadius: "6px",
                            background: "#f3e8ff",
                            border: "1px solid #d8b4fe",
                            color: "#6b21a8",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>🔔</span> Morning Assembly
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.66rem", opacity: 0.9, background: "rgba(255,255,255,0.7)", padding: "1px 5px", borderRadius: "3px" }}>
                              {bellSettings.school_start_time || "08:00 AM"} ({bellSettings.assembly_duration_minutes}m)
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAssembly();
                              }}
                              title="Delete Morning Assembly"
                              style={{
                                border: "none",
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#b91c1c",
                                borderRadius: "3px",
                                cursor: "pointer",
                                padding: "1px 4px",
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                      {Array.from({ length: maxSlots }).map((_, slotIdx) => {
                        const p = periods[slotIdx];
                        const slotMeta = dynamicSlots[slotIdx] || {
                          timeRange: "08:00 AM - 08:50 AM",
                          durationMins: Number(bellSettings.period_duration_minutes) || 50,
                        };

                        const isDropTarget = dropTarget?.day === d.key && dropTarget?.slotIdx === slotIdx;
                        const isDragging = draggedItem?.day === d.key && draggedItem?.slotIdx === slotIdx;

                        const isAfterRecess = (slotIdx + 1) === Number(bellSettings.recess_after_period) && Number(bellSettings.recess_duration_minutes) > 0;
                        const isAfterLunch = (slotIdx + 1) === Number(bellSettings.lunch_after_period) && Number(bellSettings.lunch_duration_minutes) > 0;

                        const renderBreakChips = () => (
                          <>
                            {isAfterRecess && (
                              <div
                                style={{
                                  padding: "0.35rem 0.6rem",
                                  borderRadius: "6px",
                                  background: "#fef3c7",
                                  border: "1px solid #fde68a",
                                  color: "#92400e",
                                  fontSize: "0.70rem",
                                  fontWeight: "700",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span>☕</span> Short Recess (Breather)
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "0.66rem", opacity: 0.9, background: "rgba(255,255,255,0.7)", padding: "1px 5px", borderRadius: "3px" }}>
                                    {bellSettings.recess_duration_minutes} mins
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveRecess();
                                    }}
                                    title="Delete Short Recess"
                                    style={{
                                      border: "none",
                                      background: "rgba(239, 68, 68, 0.15)",
                                      color: "#b91c1c",
                                      borderRadius: "3px",
                                      cursor: "pointer",
                                      padding: "1px 4px",
                                      fontSize: "0.68rem",
                                      fontWeight: "800",
                                      display: "inline-flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                            {isAfterLunch && (
                              <div
                                style={{
                                  padding: "0.35rem 0.6rem",
                                  borderRadius: "6px",
                                  background: "#ffedd5",
                                  border: "1px solid #fed7aa",
                                  color: "#9a3412",
                                  fontSize: "0.70rem",
                                  fontWeight: "700",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span>🍱</span> Lunch Break
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "0.66rem", opacity: 0.9, background: "rgba(255,255,255,0.7)", padding: "1px 5px", borderRadius: "3px" }}>
                                    {bellSettings.lunch_duration_minutes} mins
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveLunch();
                                    }}
                                    title="Delete Lunch Break"
                                    style={{
                                      border: "none",
                                      background: "rgba(239, 68, 68, 0.15)",
                                      color: "#b91c1c",
                                      borderRadius: "3px",
                                      cursor: "pointer",
                                      padding: "1px 4px",
                                      fontSize: "0.68rem",
                                      fontWeight: "800",
                                      display: "inline-flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );

                        if (!p) {
                          return (
                            <React.Fragment key={slotIdx}>
                              <div
                                onDragOver={(e) => handleDragOver(e, d.key, slotIdx)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, d.key, slotIdx)}
                                onClick={() => handleOpenEditModal(d.key, slotIdx, null)}
                                title="Click to allot a lecture or drop period here"
                                style={{
                                  padding: "0.45rem 0.6rem",
                                  borderRadius: "6px",
                                  border: isDropTarget ? "2px dashed #059669" : "1px dashed #cbd5e1",
                                  background: isDropTarget ? "rgba(236, 253, 245, 0.9)" : "rgba(248, 250, 252, 0.7)",
                                  fontSize: "0.72rem",
                                  color: isDropTarget ? "#059669" : "#64748b",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <span style={{ fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <Plus size={11} style={{ opacity: 0.7 }} />
                                  P{slotIdx + 1} Free
                                </span>
                                <span style={{ fontSize: "0.66rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                                  {slotMeta.timeRange} • {slotMeta.durationMins || 50}m
                                </span>
                              </div>
                              {renderBreakChips()}
                            </React.Fragment>
                          );
                        }

                        const color = getSubjectColor(p.subject);
                        const timeRangeStr = slotMeta.timeRange;
                        const durationStr = slotMeta.durationMins || bellSettings.period_duration_minutes || 50;

                        return (
                          <React.Fragment key={slotIdx}>
                            <div
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, d.key, slotIdx, p)}
                              onDragOver={(e) => handleDragOver(e, d.key, slotIdx)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, d.key, slotIdx)}
                              onClick={() => handleOpenEditModal(d.key, slotIdx, p)}
                              title="Drag to swap or move • Click to edit"
                              style={{
                                padding: "0.5rem 0.6rem",
                                borderRadius: "6px",
                                border: isDropTarget ? "2px dashed #059669" : `1px solid ${color.border || "#cbd5e1"}`,
                                borderLeft: `3px solid ${color.text || "var(--accent-primary)"}`,
                                background: isDropTarget ? "#ecfdf5" : (color.bg || "#ffffff"),
                                opacity: isDragging ? 0.4 : 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                                cursor: "grab",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {/* Compact Period-wise & Duration-wise Header */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "0.68rem",
                                  color: "var(--text-secondary)",
                                  fontWeight: "700",
                                  gap: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "2px",
                                    background: "rgba(0,0,0,0.06)",
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    color: "var(--text-primary)",
                                    fontWeight: "800",
                                    fontSize: "0.70rem",
                                    flexShrink: 0,
                                  }}
                                >
                                  <GripVertical size={10} style={{ opacity: 0.5 }} />
                                  P{slotIdx + 1}
                                </span>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    color: "#475569",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <Clock size={10} style={{ opacity: 0.7, flexShrink: 0 }} />
                                  <span style={{ whiteSpace: "nowrap" }}>{timeRangeStr}</span>
                                  <span
                                    style={{
                                      background: "#e2e8f0",
                                      color: "#0f172a",
                                      padding: "1px 4px",
                                      borderRadius: "3px",
                                      fontSize: "0.62rem",
                                      fontWeight: "800",
                                      flexShrink: 0,
                                      marginLeft: "2px",
                                    }}
                                  >
                                    {durationStr}m
                                  </span>
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: "800", fontSize: "0.86rem", color: color.text || "var(--text-primary)" }}>
                                  {p.subject}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(d.key, slotIdx, p);
                                  }}
                                  title="Edit Period"
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    padding: "2px",
                                    color: color.text || "#64748b",
                                    opacity: 0.75,
                                  }}
                                >
                                  <Edit3 size={11} />
                                </button>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", minWidth: 0 }}>
                                <span
                                  style={{
                                    width: "19px",
                                    height: "19px",
                                    borderRadius: "50%",
                                    backgroundColor: color.text || "var(--accent-primary)",
                                    color: "#ffffff",
                                    fontSize: "0.60rem",
                                    fontWeight: "800",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    textTransform: "uppercase",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                    border: "1px solid rgba(255,255,255,0.7)"
                                  }}
                                >
                                  {p.teacher ? p.teacher.replace(/^(Mr|Mrs|Ms|Dr|Prof|Shri|Smt)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() : "T"}
                                </span>
                                <span style={{ fontSize: "0.74rem", color: "var(--text-primary)", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {p.teacher}
                                </span>
                              </div>
                            </div>
                            {renderBreakChips()}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              color: "var(--text-secondary)",
            }}
          >
            <Sparkles size={36} style={{ color: "#059669", opacity: 0.6 }} />
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                No Draft Routine Generated Yet
              </h3>
              <p style={{ fontSize: "0.85rem", maxWidth: "450px", margin: "6px auto 0" }}>
                Click <strong>"2. Generate 0-Clash Routine"</strong> above to run the constraint solver across all {classes.length} class divisions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bell Schedule Configuration Modal */}
      <BellScheduleModal
        isOpen={isBellModalOpen}
        onClose={() => setIsBellModalOpen(false)}
        onSaved={(savedSettings) => {
          setBellSettings(savedSettings);
          handleRunAudit(savedSettings);
          handleGenerate(savedSettings);
        }}
      />

      {/* Interactive Quick Period Editor Modal */}
      {editingPeriodModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: "100%",
              maxWidth: "460px",
              borderRadius: "12px",
              background: "#ffffff",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
                  {editingPeriodModal.period ? "Edit Period" : "Assign Period"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                  {editingPeriodModal.day.toUpperCase()} • Period {editingPeriodModal.slotIdx + 1} ({dynamicSlots[editingPeriodModal.slotIdx]?.timeRange || ""})
                </p>
              </div>
              <button
                onClick={() => setEditingPeriodModal(null)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePeriodEdit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Subject
                </label>
                <select
                  value={editingPeriodModal.subjectId}
                  onChange={(e) => {
                    const subObj = (subjects || []).find((s) => s.id === e.target.value);
                    setEditingPeriodModal((prev) => ({
                      ...prev,
                      subjectId: e.target.value,
                      subjectName: subObj?.name || "",
                    }));
                  }}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                  }}
                >
                  <option value="">-- Select Subject --</option>
                  {(subjects || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Teacher / Faculty
                </label>
                <select
                  value={editingPeriodModal.teacherId}
                  onChange={(e) => {
                    const teachObj = (users || []).find((u) => u.id === e.target.value);
                    setEditingPeriodModal((prev) => ({
                      ...prev,
                      teacherId: e.target.value,
                      teacherName: teachObj?.name || "",
                    }));
                  }}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                  }}
                >
                  <option value="">-- Select Faculty --</option>
                  {(users || [])
                    .filter((u) => u.type === "teacher" || u.role === "teacher")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Room / Location
                </label>
                <input
                  type="text"
                  value={editingPeriodModal.roomNumber}
                  onChange={(e) => setEditingPeriodModal((prev) => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="e.g. Room 102 / Lab"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                {editingPeriodModal.period ? (
                  <button
                    type="button"
                    onClick={handleClearSlot}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #fca5a5",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      fontSize: "0.80rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} /> Clear Slot (Free)
                  </button>
                ) : <div />}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setEditingPeriodModal(null)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.45rem 1.1rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Save Period
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Master Timetable Configuration Modal */}
      {publishModalOpen && (
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
              maxWidth: "540px",
              borderRadius: "14px",
              background: "var(--card-bg, #ffffff)",
              boxShadow: "0 20px 30px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
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
                    color: "var(--accent-primary, #1b8b3b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UploadCloud size={18} strokeWidth={2.4} />
                </span>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                    {publishCompletedInfo ? "Master Timetable Published!" : "Publish Generated Timetable"}
                  </h2>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    Publish to Main School Timetable calendar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPublishModalOpen(false)}
                disabled={publishing}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {publishCompletedInfo ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center", alignItems: "center" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(22, 163, 74, 0.15)",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                      Routine Published Successfully!
                    </h3>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "6px 0 0" }}>
                      Routine is now live on the <strong>Main Timetable</strong> calendar across <strong>{publishCompletedInfo.weeksCount} week(s)</strong> starting from <strong>{publishCompletedInfo.startDate}</strong>.
                    </p>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      textAlign: "left",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div><span style={{ color: "#64748b" }}>Target Scope:</span> <strong>{publishCompletedInfo.className}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Weeks Applied:</span> <strong>{publishCompletedInfo.weeksCount} week(s)</strong></div>
                    <div><span style={{ color: "#64748b" }}>Start Monday:</span> <strong>{publishCompletedInfo.startDate}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Class-Days Written:</span> <strong>{publishCompletedInfo.savedCount}</strong></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Scope Info Card */}
                  <div
                    style={{
                      padding: "0.75rem 0.9rem",
                      borderRadius: "8px",
                      background: "rgba(27, 139, 59, 0.08)",
                      border: "1px solid rgba(27, 139, 59, 0.2)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block" }}>Publishing Scope</span>
                      <strong style={{ fontSize: "0.88rem", color: "var(--accent-primary, #1b8b3b)" }}>
                        {publishOnlyCurrent
                          ? `Single Class: ${(activeClasses || []).find((c) => c.id === selectedClassId)?.label || "Inspected Class"}`
                          : `All Classes: ${activeClasses.length} Class Divisions (Master Routine)`}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublishOnlyCurrent((prev) => !prev)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Switch to {publishOnlyCurrent ? "All Classes" : "This Class Only"}
                    </button>
                  </div>

                  {/* Starting Monday Input */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      Target Starting Week (Monday Date)
                    </label>
                    <input
                      type="date"
                      value={publishStartMonday}
                      onChange={(e) => setPublishStartMonday(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                      }}
                    />
                    <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                      Select the Monday of the week from which the routine takes effect. Defaults to the current active week.
                    </p>
                  </div>

                  {/* Duration / Repeat selector */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                      Apply Routine Across Duration
                    </label>
                    <select
                      value={publishWeeksCount}
                      onChange={(e) => setPublishWeeksCount(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      <option value={1}>Current Week Only (1 Week: Mon – Sat)</option>
                      <option value={4}>Next 4 Weeks (1 Month / 4 Recurring Weeks)</option>
                      <option value={8}>Next 8 Weeks (2 Months / 8 Recurring Weeks)</option>
                      <option value={12}>Full Academic Term (12 Weeks / Quarter)</option>
                    </select>
                    <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                      Automatically populates the routine across calendar weeks so the main timetable has recurring routines.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
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
              {publishCompletedInfo ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
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
                    Stay on Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPublishModalOpen(false);
                      navigate("/timetable");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 1.25rem",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      borderRadius: "6px",
                      background: "var(--accent-primary, #1b8b3b)",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(27, 139, 59, 0.25)",
                    }}
                  >
                    <span>View in Main Timetable</span>
                    <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    disabled={publishing}
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
                    onClick={executePublish}
                    disabled={publishing}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 1.25rem",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      borderRadius: "6px",
                      background: "var(--accent-primary, #1b8b3b)",
                      color: "#ffffff",
                      border: "none",
                      cursor: publishing ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 4px rgba(27, 139, 59, 0.25)",
                    }}
                  >
                    <UploadCloud size={15} />
                    <span>{publishing ? "Publishing to Database..." : "Confirm & Publish Schedule"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
