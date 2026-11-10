import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { fetchTimeTables } from "../../features/dataSlice";
import TeacherSelectorBar from "./TeacherSelectorBar";
import TeacherWeeklyRoutine from "./TeacherWeeklyRoutine";
import TeacherFullYearView from "./TeacherFullYearView";
import TeacherWorkloadMatrix from "./TeacherWorkloadMatrix";
import MasterAllotmentMatrix from "./MasterAllotmentMatrix";
import {
  fetchTeachers,
  fetchTeacherWeeklyRoutine,
  fetchTeacherFullYearSchedule,
  fetchWorkloadMatrix,
  fetchMasterAllotmentMatrix,
  fetchTimetableSettings,
} from "../../services/teacherScheduleApi";
import {
  exportTeacherRoutineToPDF,
  exportTeacherRoutineToExcel,
  exportTeacherFullYearToPDF,
  exportTeacherFullYearToExcel,
  exportAllotmentMatrixToPDF,
  exportAllotmentMatrixToExcel,
  exportTeacherDiarySlipPDF,
  exportAllTeacherSlipsPDF,
} from "../../utils/teacherTimetableExport";

const TeacherScheduleModule = ({ initialView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { timeTables } = useSelector((state) => state.data || state.timetable || {});

  const getInitialView = () => {
    if (initialView) return initialView;
    if (location.pathname.includes("/allotment")) return "allotment";
    if (location.pathname.includes("/matrix") || location.pathname.includes("/quotas")) return "matrix";
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["routine", "yearly", "matrix", "allotment"].includes(tab)) return tab;
    return "routine";
  };

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [activeView, setActiveView] = useState(getInitialView); // "routine" | "yearly" | "matrix" | "allotment"
  const [academicYear, setAcademicYear] = useState("2026 - 2027");

  // Sync activeView when route or params change
  useEffect(() => {
    if (location.pathname.includes("/allotment")) {
      setActiveView("allotment");
    } else if (location.pathname.includes("/matrix") || location.pathname.includes("/quotas")) {
      setActiveView("matrix");
    } else if (location.pathname.includes("/teachers")) {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab");
      setActiveView(tab || "routine");
    }
  }, [location.pathname, location.search]);

  // Secondary Filter States
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [yearlySearch, setYearlySearch] = useState("");
  const [matrixSearch, setMatrixSearch] = useState("");

  // Allotment Matrix State
  const [allotmentData, setAllotmentData] = useState({
    classes: [],
    subjects: [],
    matrix: {},
    totals: {},
  });

  // Week Navigation State (Defaults to Monday of current week)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Generate 6 days for the selected week (Monday to Saturday)
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const todayStr = (() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    })();

    for (let i = 0; i < 6; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        date: dateStr,
        dayKey: dayKeys[i],
        dayName: dayNames[i],
        displayDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentWeekStart]);

  // Derived week range
  const weekRange = useMemo(() => {
    if (weekDays.length === 0) return { startDate: "", endDate: "", label: "" };
    const start = weekDays[0];
    const end = weekDays[5];
    const year = new Date(currentWeekStart).getFullYear();
    return {
      startDate: start.date,
      endDate: end.date,
      label: `${start.displayDate} – ${end.displayDate}, ${year}`,
    };
  }, [weekDays, currentWeekStart]);

  // Week navigation controls
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

  // State data
  const [routineData, setRoutineData] = useState({
    routine: {},
    timeSlots: [],
    summary: {},
  });
  const [yearlyData, setYearlyData] = useState({
    sessions: [],
    monthlyDistribution: {},
    classDistribution: {},
  });
  const [matrixData, setMatrixData] = useState([]);
  const [bellSettings, setBellSettings] = useState(null);

  // Loaders
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // 1. Fetch Teachers on mount
  useEffect(() => {
    let isMounted = true;
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const list = await fetchTeachers();
        if (isMounted) {
          setTeachers(list || []);
          if (list?.length > 0) {
            setSelectedTeacherId(list[0].id);
          }
        }
      } catch (err) {
        toast.error("Failed to load teachers list");
        console.error(err);
      } finally {
        if (isMounted) setLoadingTeachers(false);
      }
    };
    loadTeachers();
    fetchTimetableSettings().then((s) => {
      if (s) setBellSettings(s);
    }).catch(console.warn);
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected Teacher object
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  // 2. Fetch Active Schedule whenever teacher, view, weekRange, or academicYear changes
  const loadActiveTeacherSchedule = useCallback(async () => {
    if ((activeView === "routine" || activeView === "yearly") && !selectedTeacherId) return;

    setLoadingSchedule(true);
    try {
      if (activeView === "routine") {
        let data = null;
        try {
          data = await fetchTeacherWeeklyRoutine(selectedTeacherId, {
            startDate: weekRange.startDate,
            endDate: weekRange.endDate,
          });
        } catch (e) {
          console.warn("fetchTeacherWeeklyRoutine notice, falling back to local timeTables:", e);
        }

        const routineFromData = data?.routine || {};
        const countFromData = Object.values(routineFromData).reduce(
          (sum, list) => sum + (list || []).filter((p) => !p.isBreak).length,
          0
        );

        if (countFromData > 0) {
          setRoutineData({
            routine: data.routine || {},
            timeSlots: data.timeSlots || [],
            summary: data.summary || {},
          });
        } else if (timeTables && timeTables.length > 0) {
          // Client-side extraction fallback from published timeTables
          const routineByDay = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
          };
          const teacherObj = teachers.find((t) => t.id === selectedTeacherId);
          const teacherName = teacherObj?.name?.trim().toLowerCase();

          timeTables.forEach((tt) => {
            if (!tt.dates) return;
            Object.entries(tt.dates).forEach(([dStr, periods]) => {
              if (weekRange.startDate && weekRange.endDate) {
                if (dStr < weekRange.startDate || dStr > weekRange.endDate) return;
              }
              const dayName = new Date(dStr + "T00:00:00")
                .toLocaleDateString("en-US", { weekday: "long" })
                .toLowerCase();
              if (!routineByDay[dayName]) return;

              (periods || []).forEach((p) => {
                const matchId =
                  String(p.teacher) === String(selectedTeacherId) ||
                  String(p.teacherId) === String(selectedTeacherId);
                const matchName =
                  teacherName &&
                  String(p.teacherName || p.teacher || "").trim().toLowerCase() === teacherName;

                if (matchId || matchName) {
                  routineByDay[dayName].push({
                    id: p.id || `${dStr}-${p.time}`,
                    date: dStr,
                    timeSlot: p.time,
                    subject: p.subject,
                    isBreak: p.isBreak || false,
                    roomNumber: p.roomNumber || "-",
                    classId: tt.classId,
                    className: tt.className || "Class",
                  });
                }
              });
            });
          });

          setRoutineData({
            routine: routineByDay,
            timeSlots: data?.timeSlots || [],
            summary: data?.summary || {},
          });
        } else {
          setRoutineData({
            routine: data?.routine || {},
            timeSlots: data?.timeSlots || [],
            summary: data?.summary || {},
          });
        }
      } else if (activeView === "yearly") {
        const data = await fetchTeacherFullYearSchedule(selectedTeacherId, { academicYear });
        setYearlyData({
          sessions: data.sessions || [],
          monthlyDistribution: data.monthlyDistribution || {},
          classDistribution: data.classDistribution || {},
        });
      } else if (activeView === "matrix") {
        const data = await fetchWorkloadMatrix({
          startDate: weekRange.startDate,
          endDate: weekRange.endDate,
        });
        setMatrixData(data.matrix || []);
      } else if (activeView === "allotment") {
        const data = await fetchMasterAllotmentMatrix({ academicYear });
        setAllotmentData({
          classes: data.classes || [],
          subjects: data.subjects || [],
          matrix: data.matrix || {},
          totals: data.totals || {},
        });
      }
    } catch (err) {
      toast.error("Failed to load teacher schedule details");
      console.error(err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [selectedTeacherId, activeView, academicYear, weekRange.startDate, weekRange.endDate, timeTables, teachers]);

  useEffect(() => {
    loadActiveTeacherSchedule();
  }, [loadActiveTeacherSchedule]);

  // Export handlers
  const handleExportPDF = async () => {
    try {
      if (activeView === "allotment") {
        await exportAllotmentMatrixToPDF(allotmentData);
        toast.success("Master Allotment Matrix PDF downloaded");
      } else if (activeView === "yearly") {
        await exportTeacherFullYearToPDF(selectedTeacher, yearlyData.sessions, academicYear);
        toast.success("Annual Schedule PDF downloaded");
      } else {
        await exportTeacherRoutineToPDF(selectedTeacher, routineData.routine, routineData.timeSlots);
        toast.success("Weekly Timetable PDF downloaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  const handleExportExcel = () => {
    if (activeView === "allotment") {
      exportAllotmentMatrixToExcel(allotmentData);
      toast.success("Master Allotment Matrix Excel downloaded");
    } else if (activeView === "yearly") {
      exportTeacherFullYearToExcel(selectedTeacher, yearlyData.sessions, academicYear);
      toast.success("Annual Schedule Excel downloaded");
    } else {
      exportTeacherRoutineToExcel(selectedTeacher, routineData.routine, routineData.timeSlots);
      toast.success("Weekly Timetable Excel downloaded");
    }
  };

  // US-13: Individual Teacher Diary Slip PDF Export
  const handleExportDiarySlip = async () => {
    try {
      await exportTeacherDiarySlipPDF(selectedTeacher, routineData.routine, routineData.timeSlots);
      toast.success(`Diary routine slip downloaded for ${selectedTeacher?.name || "Teacher"}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export diary slip: " + err.message);
    }
  };

  // US-14: 1-Click Bulk Export All Teacher Diary Slips
  const handleBulkExportSlips = async () => {
    try {
      toast.info(`Preparing diary slips for all ${teachers.length} faculty members...`, { autoClose: 2000 });
      await exportAllTeacherSlipsPDF(
        teachers,
        (tId) => fetchTeacherWeeklyRoutine(tId, { startDate: weekRange.startDate, endDate: weekRange.endDate }),
        routineData.timeSlots
      );
      toast.success("All Teacher Diary Slips compiled and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile bulk diary slips: " + err.message);
    }
  };

  const handleSelectFromMatrix = (teacherId) => {
    setSelectedTeacherId(teacherId);
    setActiveView("routine");
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Fixed Position Universal Header & Filter Bar */}
      <TeacherSelectorBar
        teachers={teachers}
        selectedTeacherId={selectedTeacherId}
        onSelectTeacher={setSelectedTeacherId}
        activeView={activeView}
        onChangeView={(v) => {
          setActiveView(v);
          if (v === "matrix") {
            navigate("/matrix");
          } else if (v === "allotment") {
            navigate("/allotment");
          } else if (v === "yearly") {
            navigate("/teachers?tab=yearly");
          } else {
            navigate("/teachers");
          }
        }}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onExportDiarySlip={handleExportDiarySlip}
        onBulkExportSlips={handleBulkExportSlips}
        routineSummary={routineData.summary}
        selectedTeacher={selectedTeacher}
        loading={loadingTeachers || loadingSchedule}
        weekRange={weekRange}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
        academicYear={academicYear}
        onChangeAcademicYear={setAcademicYear}
        selectedMonth={selectedMonth}
        onChangeMonth={setSelectedMonth}
        yearlySearch={yearlySearch}
        onChangeYearlySearch={setYearlySearch}
        matrixSearch={matrixSearch}
        onChangeMatrixSearch={setMatrixSearch}
        totalFacultyCount={teachers.length}
      />

      {/* Main Viewport */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {loadingSchedule ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Loading schedule details...
          </div>
        ) : activeView === "routine" ? (
          <TeacherWeeklyRoutine
            routineByDay={routineData.routine}
            teacher={selectedTeacher}
            timeSlots={routineData.timeSlots}
            bellSettings={bellSettings}
            weekDays={weekDays}
            weekRange={weekRange}
          />
        ) : activeView === "yearly" ? (
          <TeacherFullYearView
            sessions={yearlyData.sessions}
            teacher={selectedTeacher}
            academicYear={academicYear}
            selectedMonth={selectedMonth}
            searchQuery={yearlySearch}
          />
        ) : activeView === "matrix" ? (
          <TeacherWorkloadMatrix
            matrixData={matrixData}
            onSelectTeacher={handleSelectFromMatrix}
            weekRange={weekRange}
            searchQuery={matrixSearch}
            onRefresh={loadActiveTeacherSchedule}
          />
        ) : (
          <MasterAllotmentMatrix
            classes={allotmentData.classes}
            subjects={allotmentData.subjects}
            matrix={allotmentData.matrix}
            totals={allotmentData.totals}
            teachers={teachers}
            onRefresh={loadActiveTeacherSchedule}
            onSelectTeacher={(teacherName) => {
              if (!teacherName) return;
              const matched = teachers.find(
                (t) =>
                  t.name?.toLowerCase().includes(teacherName.toLowerCase()) ||
                  teacherName.toLowerCase().includes(t.name?.toLowerCase())
              );
              if (matched) {
                setSelectedTeacherId(matched.id);
                setActiveView("routine");
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherScheduleModule;
