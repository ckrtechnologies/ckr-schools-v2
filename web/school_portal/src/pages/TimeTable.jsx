import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchTimeTables, fetchClasses, fetchUsers, fetchSubjects, fetchRooms } from "../features/dataSlice";
import { toast } from "react-toastify";
import api from "../services/api";
import { Calendar, Plus, Clock, ChevronLeft, ChevronRight, Edit2, Trash2, Filter, Download, Copy, Share2, AlertCircle } from "lucide-react";
import TimePicker from "../components/TimePicker";
import DateRangePicker, { formatDate } from "../components/DateRangePicker";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enGB from 'date-fns/locale/en-GB';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dragAndDropModule from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-theme.css';
import Select from 'react-select';
const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: 'white',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    borderRadius: '0.5rem',
    minHeight: '42px',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db'
    }
  }),
  menu: (base) => ({
    ...base,
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    minWidth: '100%',
    width: 'max-content',
    maxWidth: 'min(92vw, 420px)',
    overflow: 'hidden',
    zIndex: 99999,
    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.16), 0 6px 12px -4px rgba(0, 0, 0, 0.08)'
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
    maxHeight: '260px'
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected ? '#eff6ff' : state.isFocused ? '#f8fafc' : 'white',
    color: state.isSelected ? '#1d4ed8' : '#374151',
    cursor: 'pointer',
    fontSize: '0.84rem',
    padding: '8px 12px',
    borderRadius: '4px',
    '&:active': {
      background: '#e5edff'
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: '#111827',
    fontSize: '0.85rem',
    width: '100%'
  }),
  input: (base) => ({
    ...base,
    color: '#111827',
    fontSize: '0.85rem'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    fontSize: '0.85rem'
  })
};

const selectStylesRight = {
  ...selectStyles,
  menu: (base) => ({
    ...selectStyles.menu(base),
    right: 0,
    left: 'auto',
  }),
};

const withDragAndDrop = dragAndDropModule.default || dragAndDropModule;
const DnDCalendar = withDragAndDrop(BigCalendar);

const locales = {
  'en-GB': enGB,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const getThisWeek = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const last = first + 6; // Sunday
  return { start: formatDate(new Date(curr.setDate(first))), end: formatDate(new Date(curr.setDate(last))) };
};

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  return (
    <div className="rbc-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.2rem 0.4rem' }}>
      <div className="rbc-btn-group">
        <button type="button" onClick={goToCurrent}>Today</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.05rem', color: "var(--text-primary)" }}>
        <button type="button" onClick={goToBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#1b8b3b', border: 'none', color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '1.1rem', lineHeight: '1' }} className="hover-bg">&#10094;</button>
        <span style={{ minWidth: "160px", textAlign: "center" }}>{toolbar.label}</span>
        <button type="button" onClick={goToNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#1b8b3b', border: 'none', color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '1.1rem', lineHeight: '1' }} className="hover-bg">&#10095;</button>
      </div>

      <div className="rbc-btn-group">
        {toolbar.views.map(viewName => (
          <button
            key={viewName}
            type="button"
            className={toolbar.view === viewName ? 'rbc-active' : ''}
            onClick={() => toolbar.onView(viewName)}
          >
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

const CustomEvent = ({ event }) => {
  if (event.resource?.isPlannerEvent) {
    let bgColor = "rgba(59, 130, 246, 0.95)";
    if (event.resource.category === 'Holiday') bgColor = "rgba(16, 185, 129, 0.95)";
    else if (event.resource.category === 'Exam') bgColor = "rgba(239, 68, 68, 0.95)";
    else if (event.resource.category === 'PTM') bgColor = "rgba(245, 158, 11, 0.95)";

    return (
      <div 
        title={event.title}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          width: '100%',
          fontWeight: '700', 
          backgroundColor: bgColor, 
          color: '#ffffff', 
          borderRadius: '4px', 
          padding: '2px 6px', 
          fontSize: '0.78rem', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis' 
        }}
      >
        {event.title}
      </div>
    );
  }

  if (event.resource?.isMark) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
        {event.title}
      </div>
    );
  }

  if (event.resource?.isAssembly) {
    return (
      <div 
        title={`Assembly (${event.resource.time || ''})`}
        style={{ 
          padding: '2px 8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '6px', 
          height: '100%', 
          width: '100%', 
          boxSizing: 'border-box', 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          backgroundColor: '#8b5cf6',
          borderRadius: '5px',
          color: '#ffffff', 
          fontWeight: '700', 
          fontSize: '0.78rem',
          lineHeight: 1
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🔔</span> Assembly
        </span>
        {event.resource.time && (
          <span style={{ fontSize: '0.70rem', fontWeight: '600', opacity: 0.95, background: 'rgba(0,0,0,0.18)', padding: '1px 5px', borderRadius: '3px' }}>
            {event.resource.time}
          </span>
        )}
      </div>
    );
  }

  if (event.resource?.isBreak) {
    return (
      <div 
        title={`Break / Lunch (${event.resource.time || ''})`}
        style={{ 
          padding: '2px 8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '6px', 
          height: '100%', 
          width: '100%', 
          boxSizing: 'border-box', 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          backgroundColor: '#f59e0b',
          borderRadius: '5px',
          color: '#ffffff', 
          fontWeight: '700', 
          fontSize: '0.78rem',
          lineHeight: 1
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>☕</span> Break / Lunch
        </span>
        {event.resource.time && (
          <span style={{ fontSize: '0.70rem', fontWeight: '600', opacity: 0.95, background: 'rgba(0,0,0,0.18)', padding: '1px 5px', borderRadius: '3px' }}>
            {event.resource.time}
          </span>
        )}
      </div>
    );
  }

  const { subject, roomNumber, teacherName, time } = event.resource;

  return (
    <div 
      title={`${subject} | Teacher: ${teacherName || 'Unassigned'} | Room: ${roomNumber || 'N/A'} (${time || ''})`}
      style={{ 
        padding: '3px 6px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        height: '100%', 
        width: '100%', 
        backgroundColor: '#3b82f6',
        borderRadius: '5px',
        color: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Row: Subject Title + Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', minWidth: 0 }}>
        <span style={{ fontWeight: '700', fontSize: '0.86rem', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' }}>
          {subject}
        </span>
        {time && (
          <span style={{ fontSize: '0.68rem', opacity: 0.95, whiteSpace: 'nowrap', flexShrink: 0, fontWeight: '600', background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: '3px' }}>
            {time}
          </span>
        )}
      </div>

      {/* Bottom Row: Teacher & Room */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', opacity: 0.95, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
          <span style={{ fontSize: '0.70rem' }}>👤</span> {teacherName || 'Unassigned'}
        </span>
        {roomNumber && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.22)', padding: '0px 4px', borderRadius: '3px', fontSize: '0.67rem', fontWeight: '600' }}>
            🚪 {roomNumber}
          </span>
        )}
      </div>
    </div>
  );
};

const CustomDayHeader = ({ date, label }) => {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const dayName = format(d, 'EEE');
  const dateNum = format(d, 'd');
  const monthName = format(d, 'MMM');

  const today = new Date();
  const isCurrentDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  return (
    <div className={`custom-calendar-header-cell ${isCurrentDay ? 'is-today' : ''}`}>
      <div className="header-row-day">
        <span>{dayName.toUpperCase()}</span>
      </div>
      <div className="header-row-date">
        <span className="header-date-num">{dateNum}</span>
        <span className="header-date-month">{monthName}</span>
      </div>
    </div>
  );
};

const CustomTimeGutterHeader = () => (
  <div className="custom-calendar-header-cell gutter-cell">
    <div className="header-row-day">TIME</div>
    <div className="header-row-date">SLOT</div>
  </div>
);

export default function TimeTable() {
  const [activeTab, setActiveTab] = useState("view");
  const dispatch = useDispatch();
  const { classes, timeTables, users, subjects, rooms } = useSelector((state) => state.data);

  const [selectedClass, setSelectedClass] = useState("");
  const [dateRange, setDateRange] = useState(getThisWeek());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(Views.WEEK);
  const [agendaLength, setAgendaLength] = useState(7);

  const handleViewChange = (newView) => {
    if (newView === 'agenda') {
      if (calendarView === 'month') setAgendaLength(30);
      else if (calendarView === 'week') setAgendaLength(7);
      else if (calendarView === 'day') setAgendaLength(1);
    }
    setCalendarView(newView);
  };

  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openAddSingleModal, setOpenAddSingleModal] = useState(false);
  const [openDuplicateModal, setOpenDuplicateModal] = useState(false);
  const [duplicateConfig, setDuplicateConfig] = useState({ sourceDate: "", targetStartDate: "", targetEndDate: "", copyMode: "exact", selectedDays: [1, 2, 3, 4, 5] });
  const [loading, setLoading] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [plannerEvents, setPlannerEvents] = useState([]);

  const [newTimeTable, setNewTimeTable] = useState({ date: "", timeTables: [] });
  const [timeSubject, setTimeSubject] = useState({ date: "", subject: "", initialTime: "", finalTime: "", teacher: "", isBreak: false, isAssembly: false, roomNumber: "" });

  useEffect(() => {
    dispatch(fetchTimeTables());
    dispatch(fetchClasses());
    dispatch(fetchUsers());
    dispatch(fetchSubjects());
    dispatch(fetchRooms());

    api.get('/admin_panel/planner').then(res => {
      setPlannerEvents(res.data.data || []);
    }).catch(console.error);
  }, [dispatch]);

  useEffect(() => {
    if (classes?.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  const activeClassData = useMemo(() => {
    return classes?.find(c => String(c.id) === String(selectedClass));
  }, [selectedClass, classes]);

  const activeTimeTable = useMemo(() => {
    if (!selectedClass || !timeTables?.length) return null;
    return timeTables.find(t => String(t.classId) === String(selectedClass));
  }, [selectedClass, timeTables]);

  const sortedClasses = useMemo(() => {
    if (!classes) return [];

    const classOrder = {
      'PLAY': 1,
      'NUR': 2,
      'LKG': 3,
      'UKG': 4
    };

    return [...classes].sort((a, b) => {
      const getOrder = (name) => {
        const strName = String(name).toUpperCase().trim();
        if (classOrder[strName]) return classOrder[strName];

        const num = parseInt(strName, 10);
        if (!isNaN(num)) return 10 + num;

        return 100; // fallback
      };

      const orderA = getOrder(a.className);
      const orderB = getOrder(b.className);

      if (orderA !== orderB) return orderA - orderB;
      return String(a.section).localeCompare(String(b.section));
    });
  }, [classes]);

  const getUserName = (userId) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.name : "Unknown";
  };

  const allTeachers = useMemo(() => users?.filter(u => u.type === "teacher") || [], [users]);

  // ISO date helpers for week calculations
  const getWeekBounds = (dateStr) => {
    if (!dateStr) return { start: "", end: "" };
    const d = new Date(dateStr + "T00:00:00Z");
    const day = d.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const toISO = (dateObj) => {
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const dayStr = String(dateObj.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${dayStr}`;
    };
    return { start: toISO(monday), end: toISO(sunday) };
  };

  const modalActiveDate = timeSubject.date || newTimeTable.date || formatDate(calendarDate);
  const { start: activeWeekStart, end: activeWeekEnd } = useMemo(() => {
    return getWeekBounds(modalActiveDate);
  }, [modalActiveDate]);

  const currentSlotTime = useMemo(() => {
    if (timeSubject.initialTime && timeSubject.finalTime) {
      return `${timeSubject.initialTime} - ${timeSubject.finalTime}`.trim().toLowerCase();
    }
    return "";
  }, [timeSubject.initialTime, timeSubject.finalTime]);

  const enrichedSubjectOptions = useMemo(() => {
    const classSubjects = subjects?.filter((s) => s.classIds?.includes(selectedClass)) || [];
    const activeClassTT = timeTables?.find((tt) => String(tt.classId) === String(selectedClass));

    return classSubjects.map((s) => {
      const quota = s.weeklyQuota !== undefined && s.weeklyQuota !== null ? Number(s.weeklyQuota) : null;
      const isConfigured = quota !== null && quota !== undefined && Number(quota) > 0;

      let scheduledCount = 0;
      if (activeClassTT?.dates) {
        Object.entries(activeClassTT.dates).forEach(([dStr, periods]) => {
          if (dStr >= activeWeekStart && dStr <= activeWeekEnd && Array.isArray(periods)) {
            periods.forEach((p) => {
              if (editingPeriodId && String(p.id) === String(editingPeriodId)) return;
              if (p.isBreak) return;
              if ((p.subject || "").trim().toLowerCase() === s.name.trim().toLowerCase()) {
                scheduledCount++;
              }
            });
          }
        });
      }

      let badge = "No Quota ⚠️";
      let badgeBg = "#fffbeb";
      let badgeColor = "#b45309";
      let isExceeded = false;

      if (isConfigured) {
        const quotaNum = Number(quota);
        const remaining = quotaNum - scheduledCount;
        if (remaining <= 0) {
          badge = `${scheduledCount}/${quotaNum} (Full)`;
          badgeBg = "#fef2f2";
          badgeColor = "#b91c1c";
          isExceeded = true;
        } else {
          badge = `${scheduledCount}/${quotaNum} (${remaining} left)`;
          badgeBg = "#ecfdf5";
          badgeColor = "#047857";
        }
      }

      return {
        value: s.name,
        label: s.name,
        name: s.name,
        badge,
        badgeBg,
        badgeColor,
        isExceeded,
        isBlocked: !isConfigured || isExceeded,
      };
    });
  }, [subjects, selectedClass, timeTables, activeWeekStart, activeWeekEnd, editingPeriodId]);

  const enrichedTeacherOptions = useMemo(() => {
    return allTeachers.map((t) => {
      let clashingClass = null;
      if (currentSlotTime && modalActiveDate && timeTables) {
        for (const tt of timeTables) {
          const dayPeriods = tt.dates?.[modalActiveDate];
          if (Array.isArray(dayPeriods)) {
            const clash = dayPeriods.find((p) => {
              if (editingPeriodId && String(p.id) === String(editingPeriodId)) return false;
              if (p.isBreak) return false;
              const pTime = (p.time || "").trim().toLowerCase();
              return String(p.teacher) === String(t.id) && pTime === currentSlotTime;
            });
            if (clash) {
              clashingClass = `${tt.className || "Class"} ${tt.section || ""}`.trim();
              break;
            }
          }
        }
      }

      let todayCount = 0;
      let weekCount = 0;
      if (timeTables) {
        timeTables.forEach((tt) => {
          if (!tt.dates) return;
          const todayPeriods = tt.dates[modalActiveDate];
          if (Array.isArray(todayPeriods)) {
            todayPeriods.forEach((p) => {
              if (editingPeriodId && String(p.id) === String(editingPeriodId)) return;
              if (!p.isBreak && String(p.teacher) === String(t.id)) {
                todayCount++;
              }
            });
          }
          Object.entries(tt.dates).forEach(([dStr, periods]) => {
            if (dStr >= activeWeekStart && dStr <= activeWeekEnd && Array.isArray(periods)) {
              periods.forEach((p) => {
                if (editingPeriodId && String(p.id) === String(editingPeriodId)) return;
                if (!p.isBreak && String(p.teacher) === String(t.id)) {
                  weekCount++;
                }
              });
            }
          });
        });
      }

      let badge = `${todayCount} today • ${weekCount}/wk`;
      let badgeBg = "#eff6ff";
      let badgeColor = "#1d4ed8";
      let isClashing = false;

      if (clashingClass) {
        badge = `⚠️ Busy (${clashingClass})`;
        badgeBg = "#fef2f2";
        badgeColor = "#dc2626";
        isClashing = true;
      } else if (todayCount >= 5) {
        badgeBg = "#fffbeb";
        badgeColor = "#b45309";
      }

      return {
        value: t.id,
        label: t.name,
        name: t.name,
        badge,
        badgeBg,
        badgeColor,
        isClashing,
        todayCount,
        weekCount,
      };
    });
  }, [allTeachers, timeTables, modalActiveDate, currentSlotTime, activeWeekStart, activeWeekEnd, editingPeriodId]);

  // Custom renderer for react-select options displaying name & informative pill with auto-fitting width
  const renderSelectOption = (option, { context }) => {
    const isMenu = context === "menu";
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          gap: "12px",
          minWidth: isMenu ? "250px" : "auto",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: option.isClashing ? "#dc2626" : "inherit",
            whiteSpace: "nowrap",
            overflow: isMenu ? "visible" : "hidden",
            textOverflow: isMenu ? "clip" : "ellipsis",
          }}
        >
          {option.name || option.label}
        </span>
        {option.badge && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "4px",
              background: option.badgeBg || "#f1f5f9",
              color: option.badgeColor || "#475569",
              border: option.isClashing
                ? "1px solid #fecaca"
                : option.isExceeded
                ? "1px solid #fecaca"
                : "1px solid rgba(0,0,0,0.06)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {option.badge}
          </span>
        )}
      </div>
    );
  };

  const customFilterOption = (candidate, input) => {
    if (!input) return true;
    const q = input.toLowerCase();
    const labelMatch = (candidate.data.name || candidate.data.label || "").toLowerCase().includes(q);
    const badgeMatch = (candidate.data.badge || "").toLowerCase().includes(q);
    return labelMatch || badgeMatch;
  };

  const subjectOptions = enrichedSubjectOptions;

  const allTimeSlots = useMemo(() => {
    if (!activeTimeTable || !activeTimeTable.dates) return [];
    const times = new Set();
    Object.values(activeTimeTable.dates).forEach(periodsForDate => {
      periodsForDate.forEach(p => {
        if (p && p.time && p.time !== "All Day") times.add(p.time);
      });
    });
    return Array.from(times).sort((a, b) => {
      if (!a || !b) return 0;
      const startA = a.split(" - ")[0];
      const startB = b.split(" - ")[0];
      return startA.localeCompare(startB);
    });
  }, [activeTimeTable]);

  const visibleDates = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    const dates = [];
    let current = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    let count = 0;
    while (current <= end && count < 31) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  }, [dateRange]);

  const eventStyleGetter = (event) => {
    if (event.resource?.isPlannerEvent) {
      let bg = '#3b82f6';
      if (event.resource.category === 'Holiday') bg = '#10b981';
      else if (event.resource.category === 'Exam') bg = '#ef4444';
      else if (event.resource.category === 'PTM') bg = '#f59e0b';
      return {
        style: {
          backgroundColor: bg,
          color: '#ffffff',
          borderRadius: '4px',
          border: 'none',
          display: 'block',
          overflow: 'hidden'
        }
      };
    }

    if (event.resource?.isAssembly) {
      return {
        style: {
          backgroundColor: '#8b5cf6',
          color: '#ffffff',
          borderRadius: '5px',
          border: '1px solid #7c3aed',
          boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)',
          display: 'block',
          overflow: 'hidden'
        }
      };
    }

    if (event.resource?.isBreak) {
      return {
        style: {
          backgroundColor: '#f59e0b',
          color: '#ffffff',
          borderRadius: '5px',
          border: '1px solid #d97706',
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
          display: 'block',
          overflow: 'hidden'
        }
      };
    }

    // Regular Period styling
    return {
      style: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #2563eb',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
        display: 'block',
        overflow: 'hidden'
      }
    };
  };

  const dayPropGetter = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const markType = getDayMarkType(dateStr);
    if (markType === 'Holiday' || markType === 'Public Holiday') {
      return { style: { backgroundColor: 'rgba(16, 185, 129, 0.1)' } }; // Light green tint
    }
    if (markType === 'Week Off') {
      return { style: { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }; // Light purple tint
    }
    return {};
  };

  const handleSelectEvent = (event) => {
    if (event.resource?.isMark) return;
    handleEditClick(event.resource, event.resource.date);
  };

  const handleSelectSlot = ({ start, end, action }) => {
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;

    const initialTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const finalTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

    setTimeSubject({
      date: dateStr,
      subject: "",
      initialTime,
      finalTime,
      teacher: "",
      isBreak: false,
      isAssembly: false,
      roomNumber: ""
    });
    setOpenAddSingleModal(true);
  };

  const handleEventDrop = async ({ event, start, end }) => {
    if (event.resource?.isMark) return;

    const pad = (n) => n.toString().padStart(2, '0');
    const newDateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;

    const markType = getDayMarkType(newDateStr);
    if (markType === "Public Holiday" || markType === "Holiday" || markType === "Week Off") {
      return toast.error(`Cannot move period to a ${markType}.`);
    }

    const initialTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const finalTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    const formattedTime = `${initialTime} - ${finalTime}`;

    const existingPeriods = activeTimeTable?.dates?.[newDateStr] || [];
    const isOverlapping = existingPeriods.some(p => {
      if (p.id === event.id) return false;
      const [pStart, pEnd] = p.time.split(" - ");
      return initialTime < pEnd && finalTime > pStart;
    });

    if (isOverlapping) {
      return toast.error("This time slot overlaps with an existing period on this date.");
    }

    setLoading(true);
    try {
      await api.put(`/admin_panel/timeTable/updatePeriod/${event.id}`, {
        data: {
          date: newDateStr,
          time: formattedTime,
          subject: event.resource.subject,
          teacher: event.resource.teacher,
          isBreak: event.resource.isBreak || event.resource.isAssembly,
          roomNumber: event.resource.roomNumber
        }
      });
      toast.success("Period moved successfully");
      dispatch(fetchTimeTables());
    } catch (error) {
      toast.error("Failed to move period");
    } finally {
      setLoading(false);
    }
  };

  const handleEventResize = handleEventDrop;

  const handleRangeChange = (range) => {
    if (Array.isArray(range)) {
      if (range.length > 0) {
        setDateRange({ start: formatDate(range[0]), end: formatDate(range[range.length - 1]) });
      }
    } else {
      setDateRange({ start: formatDate(range.start), end: formatDate(range.end) });
    }
  };

  const handlePrevInterval = () => {
    if (!dateRange.start || !dateRange.end) {
      setDateRange(getThisWeek());
      return;
    }
    const s = new Date(dateRange.start);
    const e = new Date(dateRange.end);
    const intervalDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;

    s.setDate(s.getDate() - intervalDays);
    e.setDate(e.getDate() - intervalDays);
    setDateRange({ start: formatDate(s), end: formatDate(e) });
  };

  const handleNextInterval = () => {
    if (!dateRange.start || !dateRange.end) {
      setDateRange(getThisWeek());
      return;
    }
    const s = new Date(dateRange.start);
    const e = new Date(dateRange.end);
    const intervalDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;

    s.setDate(s.getDate() + intervalDays);
    e.setDate(e.getDate() + intervalDays);
    setDateRange({ start: formatDate(s), end: formatDate(e) });
  };



  const handleAddPeriod = () => {
    if (!newTimeTable.date || !timeSubject.initialTime || !timeSubject.finalTime) {
      toast.error("Please fill required fields for the period");
      return;
    }
    const markType = getDayMarkType(newTimeTable.date);
    if (markType === "Public Holiday" || markType === "Holiday" || markType === "Week Off") {
      toast.error(`Cannot add period on a ${markType}.`);
      return;
    }
    if (timeSubject.initialTime >= timeSubject.finalTime) {
      toast.error("End time must be after start time");
      return;
    }

    const existingPeriods = activeTimeTable?.dates?.[newTimeTable.date] || [];
    const isOverlappingExisting = existingPeriods.some(p => {
      const [pStart, pEnd] = p.time.split(" - ");
      return timeSubject.initialTime < pEnd && timeSubject.finalTime > pStart;
    });
    if (isOverlappingExisting) {
      toast.error("Overlaps with an existing period on this date.");
      return;
    }

    const isOverlappingNew = newTimeTable.timeTables.some(p => {
      const [pStart, pEnd] = p.time.split(" - ");
      return timeSubject.initialTime < pEnd && timeSubject.finalTime > pStart;
    });
    if (isOverlappingNew) {
      toast.error("Overlaps with a period you just added to this list.");
      return;
    }
    const formattedTime = `${timeSubject.initialTime} - ${timeSubject.finalTime}`;
    setNewTimeTable({
      ...newTimeTable,
      timeTables: [
        ...newTimeTable.timeTables,
        {
          subject: timeSubject.isAssembly ? "Assembly" : (timeSubject.isBreak ? "Break/Lunch" : (timeSubject.subject || "Unassigned")),
          teacher: (timeSubject.isAssembly || timeSubject.isBreak) ? null : (timeSubject.teacher || null),
          time: formattedTime,
          isBreak: timeSubject.isBreak || timeSubject.isAssembly,
          isAssembly: timeSubject.isAssembly,
          roomNumber: timeSubject.roomNumber
        }
      ]
    });
    setTimeSubject({ day: "", subject: "", initialTime: "", finalTime: "", teacher: "", isBreak: false, isAssembly: false, roomNumber: "" });
  };

  const handleMarkDay = async (date, type) => {
    if (!window.confirm(`Are you sure you want to mark ${date} as a ${type}? This will clear all existing periods for this date.`)) return;
    setLoading(true);
    try {
      const existingPeriods = activeTimeTable?.dates?.[date] || [];
      for (const period of existingPeriods) {
        await api.delete(`/admin_panel/timeTable/deletePeriod/${period.id}`);
      }
      await api.post("/admin_panel/timeTable/createTimeTable", {
        data: {
          classId: selectedClass,
          date: date,
          timeTables: [{ time: "All Day", subject: type, isBreak: true }]
        }
      });
      toast.success(`Marked as ${type}`);
      dispatch(fetchTimeTables());
    } catch (err) {
      toast.error(`Failed to mark ${type.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDayMark = async (date) => {
    if (!window.confirm(`Are you sure you want to remove the mark on ${date}?`)) return;
    setLoading(true);
    try {
      const markPeriod = activeTimeTable?.dates?.[date]?.find(p => p.subject === "Holiday" || p.subject === "Week Off");
      if (markPeriod) {
        await api.delete(`/admin_panel/timeTable/deletePeriod/${markPeriod.id}`);
        toast.success("Removed successfully");
        dispatch(fetchTimeTables());
      }
    } catch (err) {
      toast.error("Failed to remove");
    } finally {
      setLoading(false);
    }
  };

  const getDayMarkType = (date) => {
    const d = new Date(date);
    if (d.getDay() === 0) return "Week Off";
    if (plannerEvents.some(h => h.start_date === date && h.category === 'Holiday')) return "Public Holiday";

    const period = activeTimeTable?.dates?.[date]?.find(p => p.subject === "Holiday" || p.subject === "Week Off");
    return period ? period.subject : null;
  };

  const calendarEvents = useMemo(() => {
    const events = [];

    if (plannerEvents && activeClassData) {
      plannerEvents.forEach(pe => {
        const targets = Array.isArray(pe.target_classes) ? pe.target_classes : [];
        const isTarget = targets.includes("All") || targets.some(t => {
          const lower = t.toLowerCase();
          return activeClassData.name?.toLowerCase().includes(lower) ||
            `${activeClassData.name} ${activeClassData.section}`.toLowerCase().includes(lower);
        });

        if (isTarget) {
          events.push({
            id: `planner-${pe.id}`,
            title: pe.title,
            start: new Date(pe.start_date + "T00:00:00"),
            end: new Date((pe.end_date || pe.start_date) + "T23:59:59"),
            allDay: true,
            resource: { isPlannerEvent: true, ...pe }
          });
        }
      });
    }

    if (!activeTimeTable) return events;

    if (activeTimeTable.dates) {
      Object.keys(activeTimeTable.dates).forEach(dateStr => {
        const periods = activeTimeTable.dates[dateStr];
        if (periods) {
          periods.forEach(p => {
            if (!p.time) return;
            const [startT, endT] = p.time.split(" - ");
            const isAssembly = p.subject === "Assembly" || (p.subject && p.subject.trim().toLowerCase() === "assembly");
            const isBreak = p.isBreak && !isAssembly;
            events.push({
              id: p.id,
              title: isAssembly ? "🔔 Assembly" : (isBreak ? "☕ Break / Lunch" : `${p.subject}`),
              start: new Date(`${dateStr}T${startT}:00`),
              end: new Date(`${dateStr}T${endT}:00`),
              resource: { ...p, date: dateStr, isBreak, isAssembly, teacherName: getUserName(p.teacher) }
            });
          });
        }
      });
    }
    return events;
  }, [activeTimeTable, plannerEvents, activeClassData]);

  const { minTime, maxTime } = useMemo(() => {
    let minH = 8;
    let maxH = 18;
    calendarEvents.forEach(e => {
      if (!e.allDay && e.start && e.end) {
        if (e.start.getHours() < minH) minH = e.start.getHours();
        if (e.end.getHours() > maxH) maxH = e.end.getHours();
        if (e.end.getMinutes() > 0 && e.end.getHours() === maxH) maxH++;
      }
    });
    return {
      minTime: new Date(1970, 0, 1, minH, 0, 0),
      maxTime: new Date(1970, 0, 1, maxH, 0, 0)
    };
  }, [calendarEvents]);

  const handleSubmit = async () => {
    if (!newTimeTable.date || newTimeTable.timeTables.length === 0) {
      toast.error("Add at least one period before submitting");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin_panel/timeTable/createTimeTable", {
        data: {
          classId: selectedClass,
          date: newTimeTable.date,
          timeTables: newTimeTable.timeTables
        }
      });
      toast.success("Timetable created successfully");
      dispatch(fetchTimeTables());
      setOpenModal(false);
      setNewTimeTable({ date: "", timeTables: [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (period) => {
    if (period.subject !== "Unassigned" && period.subject !== "") {
      if (!window.confirm(`This period is already assigned to a subject/teacher. Are you sure you want to delete it?`)) return;
    } else {
      if (!window.confirm("Are you sure you want to delete this period?")) return;
    }
    try {
      await api.delete(`/admin_panel/timeTable/deletePeriod/${period.id}`);
      toast.success("Period deleted successfully");
      dispatch(fetchTimeTables());
      setOpenEditModal(false);
    } catch (error) {
      toast.error("Failed to delete period");
    }
  };

  const handleDeleteSlot = async (time) => {
    if (!window.confirm(`Are you sure you want to delete the entire ${time} slot?`)) return;

    const periodsToDelete = [];
    const conflictDates = [];

    if (activeTimeTable && activeTimeTable.dates) {
      Object.keys(activeTimeTable.dates).forEach(date => {
        const period = activeTimeTable.dates[date].find(p => p.time === time);
        if (period) {
          if (period.subject !== "Unassigned" && period.subject !== "Holiday" && period.subject !== "Week Off") {
            conflictDates.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          }
          periodsToDelete.push(period.id);
        }
      });
    }

    if (conflictDates.length > 0) {
      const datesStr = conflictDates.join(", ");
      toast.error(`Cannot delete slot. It contains booked classes on: ${datesStr}. Please clear them first.`, { autoClose: 6000 });
      return;
    }

    setLoading(true);
    try {
      for (const id of periodsToDelete) {
        await api.delete(`/admin_panel/timeTable/deletePeriod/${id}`);
      }
      toast.success("Time slot deleted successfully");
      dispatch(fetchTimeTables());
    } catch (error) {
      toast.error("Failed to delete time slot");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (period, date) => {
    const [initialTime, finalTime] = period.time.split(" - ");
    const isAssembly = period.subject === "Assembly" || (period.subject && period.subject.trim().toLowerCase() === "assembly");
    const isBreak = (period.isBreak || false) && !isAssembly;
    setTimeSubject({
      id: period._id || period.id,
      date: date || "",
      subject: period.subject || "",
      initialTime,
      finalTime,
      teacher: period.teacher || "",
      isBreak: isBreak,
      isAssembly: isAssembly,
      roomNumber: period.roomNumber || ""
    });
    setEditingPeriodId(period.id);
    setOpenEditModal(true);
  };

  const handleAddSpecificClick = (date, timeSlot) => {
    const [initialTime, finalTime] = timeSlot.split(" - ");
    setTimeSubject({
      date: date,
      subject: "",
      initialTime,
      finalTime,
      teacher: "",
      isBreak: false,
      isAssembly: false,
      roomNumber: ""
    });
    setOpenAddSingleModal(true);
  };

  const handleUpdatePeriod = async () => {
    if (!timeSubject.initialTime || !timeSubject.finalTime) {
      return toast.error("Time is required");
    }

    const existingPeriods = activeTimeTable?.dates?.[timeSubject.date] || [];
    const isOverlapping = existingPeriods.some(p => {
      if (p.id === editingPeriodId) return false;
      const [pStart, pEnd] = p.time.split(" - ");
      return timeSubject.initialTime < pEnd && timeSubject.finalTime > pStart;
    });
    if (isOverlapping) {
      return toast.error("This time slot overlaps with an existing period on this date.");
    }

    setLoading(true);
    try {
      const formattedTime = `${timeSubject.initialTime} - ${timeSubject.finalTime}`;
      await api.put(`/admin_panel/timeTable/updatePeriod/${editingPeriodId}`, {
        data: {
          time: formattedTime,
          subject: timeSubject.isAssembly ? "Assembly" : (timeSubject.isBreak ? "Break/Lunch" : (timeSubject.subject || "Unassigned")),
          teacher: (timeSubject.isAssembly || timeSubject.isBreak) ? null : (timeSubject.teacher || null),
          isBreak: timeSubject.isBreak || timeSubject.isAssembly,
          roomNumber: timeSubject.roomNumber
        }
      });
      toast.success("Period updated successfully");
      dispatch(fetchTimeTables());
      setOpenEditModal(false);
      setTimeSubject({ date: "", subject: "", initialTime: "", finalTime: "", teacher: "", isBreak: false, isAssembly: false, roomNumber: "" });
    } catch (error) {
      toast.error("Failed to update period");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSinglePeriod = async () => {
    if (!timeSubject.initialTime || !timeSubject.finalTime) {
      return toast.error("Time is required");
    }

    const markType = getDayMarkType(timeSubject.date);
    if (markType === "Public Holiday" || markType === "Holiday" || markType === "Week Off") {
      toast.error(`Cannot add period on a ${markType}.`);
      return;
    }

    const existingPeriods = activeTimeTable?.dates?.[timeSubject.date] || [];
    const isOverlapping = existingPeriods.some(p => {
      const [pStart, pEnd] = p.time.split(" - ");
      return timeSubject.initialTime < pEnd && timeSubject.finalTime > pStart;
    });
    if (isOverlapping) {
      return toast.error("This time slot overlaps with an existing period on this date.");
    }

    setLoading(true);
    try {
      const formattedTime = `${timeSubject.initialTime} - ${timeSubject.finalTime}`;
      await api.post(`/admin_panel/timeTable/addPeriod`, {
        data: {
          classId: selectedClass,
          date: timeSubject.date,
          time: formattedTime,
          subject: timeSubject.isAssembly ? "Assembly" : (timeSubject.isBreak ? "Break/Lunch" : (timeSubject.subject || "Unassigned")),
          teacher: (timeSubject.isAssembly || timeSubject.isBreak) ? null : (timeSubject.teacher || null),
          isBreak: timeSubject.isBreak || timeSubject.isAssembly,
          roomNumber: timeSubject.roomNumber
        }
      });
      toast.success("Period added successfully");
      dispatch(fetchTimeTables());
      setOpenAddSingleModal(false);
      setTimeSubject({ date: "", subject: "", initialTime: "", finalTime: "", teacher: "", isBreak: false, isAssembly: false, roomNumber: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add period");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateDay = async () => {
    if (!duplicateConfig.sourceDate || !duplicateConfig.targetStartDate || !duplicateConfig.targetEndDate) {
      return toast.error("Please fill all required fields");
    }
    if (duplicateConfig.targetStartDate > duplicateConfig.targetEndDate) {
      return toast.error("Target end date must be after target start date");
    }
    setLoading(true);
    try {
      await api.post("/admin_panel/timeTable/duplicateDay", {
        classId: selectedClass,
        sourceDate: duplicateConfig.sourceDate,
        targetStartDate: duplicateConfig.targetStartDate,
        targetEndDate: duplicateConfig.targetEndDate,
        copyMode: duplicateConfig.copyMode,
        selectedDays: duplicateConfig.selectedDays
      });
      toast.success("Schedule duplicated successfully!");
      dispatch(fetchTimeTables());
      setOpenDuplicateModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to duplicate schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!activeTimeTable || allTimeSlots.length === 0) return toast.warn("No timetable to export");
    const dataToExport = allTimeSlots.map(time => {
      const row = { Time: time };
      visibleDates.forEach(date => {
        const markType = getDayMarkType(date);
        const period = activeTimeTable?.dates?.[date]?.find(p => p.time === time);

        if (markType) {
          row[date] = markType.toUpperCase();
        } else if (period) {
          const isAssembly = period.subject === "Assembly" || (period.subject && period.subject.trim().toLowerCase() === "assembly");
          if (isAssembly) row[date] = "Assembly";
          else if (period.isBreak) row[date] = "Break / Lunch";
          else {
            row[date] = `${period.subject} (${getUserName(period.teacher)})${period.roomNumber ? ` - Room: ${period.roomNumber}` : ""}`;
          }
        } else {
          row[date] = "-";
        }
      });
      return row;
    });
    exportToExcel(dataToExport, `Timetable_${activeClassData?.className}_${activeClassData?.section}`, `Timetable - ${activeClassData?.className} ${activeClassData?.section}`);
  };

  const handleExportPDF = async () => {
    if (!activeTimeTable || allTimeSlots.length === 0) return toast.warn("No timetable to export");
    const columns = ["Time", ...visibleDates];
    const dataToExport = allTimeSlots.map(time => {
      const row = [time];
      visibleDates.forEach(date => {
        const markType = getDayMarkType(date);
        const period = activeTimeTable?.dates?.[date]?.find(p => p.time === time);

        if (markType) {
          row.push(markType.toUpperCase());
        } else if (period) {
          const isAssembly = period.subject === "Assembly" || (period.subject && period.subject.trim().toLowerCase() === "assembly");
          if (isAssembly) row.push("Assembly");
          else if (period.isBreak) row.push("Break / Lunch");
          else {
            row.push(`${period.subject} (${getUserName(period.teacher)})${period.roomNumber ? ` - Room: ${period.roomNumber}` : ""}`);
          }
        } else {
          row.push("-");
        }
      });
      return row;
    });
    await exportToPDF(columns, dataToExport, `Timetable_${activeClassData?.className}_${activeClassData?.section}`, `Timetable - ${activeClassData?.className} ${activeClassData?.section}`);
  };

  const handleShare = () => {
    if (!selectedClass) {
      toast.warn("Please select a class first.");
      return;
    }
    const shareUrl = `${window.location.origin}/timetable?classId=${selectedClass}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Timetable link copied to clipboard!");
    } else {
      toast.info(`Share link: ${shareUrl}`);
    }
  };

  const handleClearSchedule = async () => {
    if (!selectedClass || !activeTimeTable) {
      toast.warn("No active timetable to clear.");
      return;
    }
    const count = Object.values(activeTimeTable.dates || {}).flat().length;
    if (count === 0) {
      toast.info("Timetable is already empty.");
      return;
    }
    if (!window.confirm(`Are you sure you want to clear all ${count} periods from this timetable schedule? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      const allPeriods = Object.values(activeTimeTable.dates || {}).flat();
      for (const p of allPeriods) {
        if (p.id) {
          await api.delete(`/admin_panel/timeTable/deletePeriod/${p.id}`);
        }
      }
      toast.success("Timetable cleared successfully");
      dispatch(fetchTimeTables());
    } catch (err) {
      toast.error("Failed to clear timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
      {/* Compact Top Header & Controls Bar */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "0.55rem",
          gap: "1rem",
          flexShrink: 0
        }}
      >
        {/* Left: Title + Class Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-primary)", lineHeight: 1.15 }}>
              Timetable Scheduler
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.76rem", margin: 0 }}>
              Manage daily class routines
            </p>
          </div>

          {/* Inline Class Selector */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              background: "#ffffff", 
              padding: "0.22rem 0.65rem", 
              borderRadius: "8px", 
              border: "1px solid var(--glass-border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Class:
            </label>
            <select 
              className="input-glass" 
              style={{ 
                width: "210px", 
                padding: "0.28rem 0.5rem", 
                fontSize: "0.84rem", 
                fontWeight: "600",
                border: "none",
                background: "transparent",
                outline: "none"
              }} 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Choose Class --</option>
              {sortedClasses?.map(c => (
                <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
              ))}
            </select>
          </div>

          {activeClassData && (
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: "500" }}>
              Showing: <strong style={{ color: "var(--accent-primary)", fontWeight: "700" }}>{activeClassData.className} - {activeClassData.section}</strong>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexShrink: 0 }}>
          {selectedClass && (
            <button 
              onClick={handleShare} 
              className="btn btn-ghost" 
              style={{ padding: "0.32rem 0.65rem", fontSize: "0.78rem", border: "1px solid var(--glass-border)", background: "#ffffff" }} 
              title="Share Timetable Link"
            >
              <Share2 size={14} /> Share
            </button>
          )}
          {selectedClass && allTimeSlots.length > 0 && (
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button onClick={handleExportExcel} className="btn btn-ghost" style={{ padding: "0.32rem 0.65rem", fontSize: "0.78rem" }} title="Export to Excel">
                <Download size={14} /> Excel
              </button>
              <button onClick={handleExportPDF} className="btn btn-ghost" style={{ padding: "0.32rem 0.65rem", fontSize: "0.78rem" }} title="Export to PDF">
                <Download size={14} /> PDF
              </button>
              <button 
                onClick={handleClearSchedule} 
                className="btn btn-ghost" 
                style={{ padding: "0.32rem 0.65rem", fontSize: "0.78rem", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.15)", background: "rgba(220, 38, 38, 0.04)" }} 
                title="Clear Timetable Schedule"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          )}
          <button
            onClick={() => {
              if (!selectedClass) {
                toast.warn("Please select a class first.");
                return;
              }
              setDuplicateConfig({ sourceDate: formatDate(new Date()), targetStartDate: "", targetEndDate: "", copyMode: "exact", selectedDays: [1, 2, 3, 4, 5] });
              setOpenDuplicateModal(true);
            }}
            className="btn btn-ghost" 
            style={{ border: "1px solid var(--glass-border)", background: "#ffffff", padding: "0.32rem 0.75rem", fontSize: "0.78rem" }}
          >
            <Copy size={14} /> Duplicate Schedule
          </button>
          <button
            onClick={() => {
              if (!selectedClass) {
                toast.warn("Please select a class first to add a timetable.");
                return;
              }
              setNewTimeTable({ date: formatDate(new Date()), timeTables: [] });
              setOpenModal(true);
            }}
            className="btn btn-primary"
            style={{ padding: "0.32rem 0.85rem", fontSize: "0.78rem" }}
          >
            <Plus size={15} /> Add Timetable
          </button>
        </div>
      </div>

      {/* Main Calendar Viewport (100% Canvas Height) */}
      {selectedClass ? (
        <div 
          className="glass-panel" 
          style={{ 
            padding: "0.55rem 0.75rem", 
            flex: 1, 
            height: "calc(100% - 50px)", 
            minHeight: "550px", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <div style={{ flex: 1, height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <DnDCalendar
              localizer={localizer}
              culture="en-GB"
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              date={calendarDate}
              view={calendarView}
              onNavigate={(newDate) => setCalendarDate(newDate)}
              onView={handleViewChange}
              length={agendaLength}
              min={minTime}
              max={maxTime}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              step={30}
              timeslots={2}
              selectable={true}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onRangeChange={handleRangeChange}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              draggableAccessor={() => true}
              resizable
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent,
                header: CustomDayHeader,
                timeGutterHeader: CustomTimeGutterHeader
              }}
              style={{ fontFamily: "'Inter', sans-serif", color: "var(--text-primary)", height: "100%", width: "100%" }}
            />
          </div>
        </div>
      ) : (
        <div 
          className="glass-panel" 
          style={{ 
            padding: "3rem", 
            textAlign: "center", 
            color: "var(--text-secondary)", 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}
        >
          <p style={{ fontSize: "0.95rem", fontWeight: "500" }}>Please select a class from the dropdown above to view its timetable.</p>
        </div>
      )}

      {openModal && createPortal(
        <div className="modal-backdrop-right" onClick={() => setOpenModal(false)}>
          <div className="modal-drawer-right" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--glass-border)" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>Create Timetable</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "0.25rem 0 0 0" }}>Build full-day period sequence</p>
              </div>
              <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "1.1rem" }}>✕</button>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Date</label>
              <input
                type="date"
                className="input-glass"
                value={newTimeTable.date}
                onChange={(e) => setNewTimeTable({ ...newTimeTable, date: e.target.value })}
              />
            </div>

            <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1rem" }}>Add Period to Sequence</h3>

              <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>
                  <input 
                    type="checkbox" 
                    checked={timeSubject.isBreak} 
                    onChange={(e) => setTimeSubject({ ...timeSubject, isBreak: e.target.checked, isAssembly: e.target.checked ? false : timeSubject.isAssembly })} 
                    style={{ width: "16px", height: "16px", accentColor: "#f59e0b" }} 
                  />
                  <span style={{ color: timeSubject.isBreak ? "#d97706" : "inherit", fontWeight: timeSubject.isBreak ? "600" : "500" }}>
                    ☕ Mark as Break / Lunch
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>
                  <input 
                    type="checkbox" 
                    checked={timeSubject.isAssembly} 
                    onChange={(e) => setTimeSubject({ ...timeSubject, isAssembly: e.target.checked, isBreak: e.target.checked ? false : timeSubject.isBreak })} 
                    style={{ width: "16px", height: "16px", accentColor: "#8b5cf6" }} 
                  />
                  <span style={{ color: timeSubject.isAssembly ? "#7c3aed" : "inherit", fontWeight: timeSubject.isAssembly ? "600" : "500" }}>
                    🔔 Mark as Assembly
                  </span>
                </label>
              </div>

              {timeSubject.isAssembly && (
                <div style={{ marginBottom: "1rem", padding: "0.6rem 0.85rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#7c3aed", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔔</span> <span>School Assembly — no teacher or subject required</span>
                </div>
              )}
              {timeSubject.isBreak && (
                <div style={{ marginBottom: "1rem", padding: "0.6rem 0.85rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#d97706", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>☕</span> <span>Recess / Lunch break</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <TimePicker
                  label="Start Time"
                  value={timeSubject.initialTime}
                  onChange={(val) => setTimeSubject({ ...timeSubject, initialTime: val })}
                />
                <TimePicker
                  label="End Time"
                  value={timeSubject.finalTime}
                  onChange={(val) => setTimeSubject({ ...timeSubject, finalTime: val })}
                />
              </div>

              {timeSubject.initialTime && timeSubject.finalTime && (
                <>
                  {!timeSubject.isBreak && !timeSubject.isAssembly && (
                    <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Teacher</label>
                        <Select
                          styles={selectStyles}
                          options={enrichedTeacherOptions}
                          value={enrichedTeacherOptions.find(opt => opt.value === timeSubject.teacher) || null}
                          onChange={(option) => setTimeSubject({ ...timeSubject, teacher: option ? option.value : "" })}
                          placeholder="Search Teacher..."
                          isClearable
                          menuPlacement="auto"
                          formatOptionLabel={renderSelectOption}
                          filterOption={customFilterOption}
                        />
                        {(() => {
                          const selT = enrichedTeacherOptions.find(t => t.value === timeSubject.teacher);
                          if (!selT) return null;
                          if (selT.isClashing) {
                            return (
                              <div style={{ marginTop: "4px", fontSize: "11px", color: "#dc2626", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                                <AlertCircle size={12} />
                                {selT.badge} — Teacher double-booked at this time
                              </div>
                            );
                          }
                          return (
                            <div style={{ marginTop: "3px", fontSize: "11px", color: "var(--text-secondary)" }}>
                              Workload: <strong>{selT.badge}</strong>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Subject</label>
                        <Select
                          styles={selectStylesRight}
                          options={enrichedSubjectOptions}
                          value={enrichedSubjectOptions.find(opt => opt.value === timeSubject.subject) || (timeSubject.subject ? { value: timeSubject.subject, label: timeSubject.subject } : null)}
                          onChange={(option) => setTimeSubject({ ...timeSubject, subject: option ? option.value : "" })}
                          placeholder="Select Subject..."
                          noOptionsMessage={() => "No subjects assigned to this class"}
                          isClearable
                          menuPlacement="auto"
                          formatOptionLabel={renderSelectOption}
                          filterOption={customFilterOption}
                        />
                        {(() => {
                          const selS = enrichedSubjectOptions.find(s => s.value === timeSubject.subject);
                          if (!selS) return null;
                          return (
                            <div style={{ marginTop: "3px", fontSize: "11px", color: selS.isExceeded ? "#dc2626" : "var(--text-secondary)", fontWeight: "500" }}>
                              Weekly Quota: <strong>{selS.badge}</strong>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Room Number (Optional)</label>
                    <select className="input-glass" value={timeSubject.roomNumber} onChange={(e) => setTimeSubject({ ...timeSubject, roomNumber: e.target.value })}>
                      <option value="">Select Room</option>
                      {rooms?.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button type="button" onClick={handleAddPeriod} className="btn btn-ghost" style={{ width: "100%", border: "1px dashed var(--glass-border)" }}>+ Add to List</button>
            </div>

            {newTimeTable.timeTables.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: "700" }}>Periods Summary ({newTimeTable.timeTables.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {newTimeTable.timeTables.map((pt, i) => {
                    const isAssembly = pt.isAssembly || (pt.subject && pt.subject.trim().toLowerCase() === "assembly");
                    const isBreak = pt.isBreak && !isAssembly;
                    return (
                      <div key={i} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        background: isAssembly ? "rgba(139, 92, 246, 0.08)" : (isBreak ? "rgba(245, 158, 11, 0.08)" : "#f8fafc"), 
                        padding: "0.6rem 0.85rem", 
                        borderRadius: "8px", 
                        border: isAssembly ? "1px solid rgba(139, 92, 246, 0.25)" : (isBreak ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid var(--glass-border)") 
                      }}>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "0.85rem", color: isAssembly ? "#7c3aed" : (isBreak ? "#d97706" : "inherit") }}>
                            {isAssembly ? "🔔 Assembly" : (isBreak ? "☕ Break / Lunch" : pt.subject)}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {!isBreak && !isAssembly && getUserName(pt.teacher)}
                            {pt.roomNumber && <span style={{ marginLeft: (!isBreak && !isAssembly) ? "8px" : "0" }}>Room: {pt.roomNumber}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.82rem", fontWeight: "600", color: isAssembly ? "#7c3aed" : (isBreak ? "#d97706" : "var(--accent-primary)") }}>{pt.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--glass-border)" }}>
              <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary">{loading ? "Saving..." : "Save Timetable"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {openEditModal && createPortal(
        <div className="modal-backdrop-right" onClick={() => setOpenEditModal(false)}>
          <div className="modal-drawer-right" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--glass-border)" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>Edit Period</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "0.25rem 0 0 0" }}>Update period time or allocation</p>
              </div>
              <button type="button" onClick={() => setOpenEditModal(false)} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "1.1rem" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>
                <input 
                  type="checkbox" 
                  checked={timeSubject.isBreak} 
                  onChange={(e) => setTimeSubject({ ...timeSubject, isBreak: e.target.checked, isAssembly: e.target.checked ? false : timeSubject.isAssembly })} 
                  style={{ width: "16px", height: "16px", accentColor: "#f59e0b" }} 
                />
                <span style={{ color: timeSubject.isBreak ? "#d97706" : "inherit", fontWeight: timeSubject.isBreak ? "600" : "500" }}>
                  ☕ Mark as Break / Lunch
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>
                <input 
                  type="checkbox" 
                  checked={timeSubject.isAssembly} 
                  onChange={(e) => setTimeSubject({ ...timeSubject, isAssembly: e.target.checked, isBreak: e.target.checked ? false : timeSubject.isBreak })} 
                  style={{ width: "16px", height: "16px", accentColor: "#8b5cf6" }} 
                />
                <span style={{ color: timeSubject.isAssembly ? "#7c3aed" : "inherit", fontWeight: timeSubject.isAssembly ? "600" : "500" }}>
                  🔔 Mark as Assembly
                </span>
              </label>
            </div>

            {timeSubject.isAssembly && (
              <div style={{ marginBottom: "1rem", padding: "0.6rem 0.85rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#7c3aed", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔔</span> <span>School Assembly — no teacher or subject required</span>
              </div>
            )}
            {timeSubject.isBreak && (
              <div style={{ marginBottom: "1rem", padding: "0.6rem 0.85rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#d97706", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>☕</span> <span>Recess / Lunch break</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <TimePicker
                label="Start Time"
                value={timeSubject.initialTime}
                onChange={(val) => setTimeSubject({ ...timeSubject, initialTime: val })}
              />
              <TimePicker
                label="End Time"
                value={timeSubject.finalTime}
                onChange={(val) => setTimeSubject({ ...timeSubject, finalTime: val })}
              />
            </div>

            {timeSubject.initialTime && timeSubject.finalTime && (
              <>
                {!timeSubject.isBreak && !timeSubject.isAssembly && (
                  <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Teacher</label>
                      <Select
                        styles={selectStyles}
                        options={enrichedTeacherOptions}
                        value={enrichedTeacherOptions.find(opt => opt.value === timeSubject.teacher) || null}
                        onChange={(option) => setTimeSubject({ ...timeSubject, teacher: option ? option.value : "" })}
                        placeholder="Search Teacher..."
                        isClearable
                        menuPlacement="auto"
                        formatOptionLabel={renderSelectOption}
                        filterOption={customFilterOption}
                      />
                      {(() => {
                        const selT = enrichedTeacherOptions.find(t => t.value === timeSubject.teacher);
                        if (!selT) return null;
                        if (selT.isClashing) {
                          return (
                            <div style={{ marginTop: "4px", fontSize: "11px", color: "#dc2626", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <AlertCircle size={12} />
                              {selT.badge} — Teacher double-booked at this time
                            </div>
                          );
                        }
                        return (
                          <div style={{ marginTop: "3px", fontSize: "11px", color: "var(--text-secondary)" }}>
                            Workload: <strong>{selT.badge}</strong>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Subject</label>
                      <Select
                        styles={selectStylesRight}
                        options={enrichedSubjectOptions}
                        value={enrichedSubjectOptions.find(opt => opt.value === timeSubject.subject) || (timeSubject.subject ? { value: timeSubject.subject, label: timeSubject.subject } : null)}
                        onChange={(option) => setTimeSubject({ ...timeSubject, subject: option ? option.value : "" })}
                        placeholder="Select Subject..."
                        noOptionsMessage={() => "No subjects assigned to this class"}
                        isClearable
                        menuPlacement="auto"
                        formatOptionLabel={renderSelectOption}
                        filterOption={customFilterOption}
                      />
                      {(() => {
                        const selS = enrichedSubjectOptions.find(s => s.value === timeSubject.subject);
                        if (!selS) return null;
                        return (
                          <div style={{ marginTop: "3px", fontSize: "11px", color: selS.isExceeded ? "#dc2626" : "var(--text-secondary)", fontWeight: "500" }}>
                            Weekly Quota: <strong>{selS.badge}</strong>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Room Number (Optional)</label>
                  <select className="input-glass" value={timeSubject.roomNumber} onChange={(e) => setTimeSubject({ ...timeSubject, roomNumber: e.target.value })}>
                    <option value="">Select Room</option>
                    {rooms?.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--glass-border)" }}>
              <button
                type="button"
                onClick={() => handleDeletePeriod(timeSubject)}
                className="btn btn-ghost hover-bg"
                style={{ color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.05)" }}
              >
                Delete
              </button>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => setOpenEditModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="button" onClick={handleUpdatePeriod} disabled={loading} className="btn btn-primary">{loading ? "Saving..." : "Update Period"}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {openAddSingleModal && createPortal(
        <div className="modal-backdrop-right" onClick={() => setOpenAddSingleModal(false)}>
          <div className="modal-drawer-right" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--glass-border)" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>Add Period</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "0.25rem 0 0 0" }}>
                  {new Date(timeSubject.date).toLocaleDateString()} ({timeSubject.initialTime} - {timeSubject.finalTime})
                </p>
              </div>
              <button type="button" onClick={() => setOpenAddSingleModal(false)} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "1.1rem" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>
                <input 
                  type="checkbox" 
                  checked={timeSubject.isBreak} 
                  onChange={(e) => setTimeSubject({ ...timeSubject, isBreak: e.target.checked, isAssembly: e.target.checked ? false : timeSubject.isAssembly })} 
                  style={{ width: "16px", height: "16px", accentColor: "#f59e0b" }} 
                />
                <span style={{ color: timeSubject.isBreak ? "#d97706" : "inherit", fontWeight: timeSubject.isBreak ? "600" : "500" }}>
                  ☕ Mark as Break / Lunch
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500" }}>
                <input 
                  type="checkbox" 
                  checked={timeSubject.isAssembly} 
                  onChange={(e) => setTimeSubject({ ...timeSubject, isAssembly: e.target.checked, isBreak: e.target.checked ? false : timeSubject.isBreak })} 
                  style={{ width: "16px", height: "16px", accentColor: "#8b5cf6" }} 
                />
                <span style={{ color: timeSubject.isAssembly ? "#7c3aed" : "inherit", fontWeight: timeSubject.isAssembly ? "600" : "500" }}>
                  🔔 Mark as Assembly
                </span>
              </label>
            </div>

            {timeSubject.isAssembly && (
              <div style={{ marginBottom: "1rem", padding: "0.6rem 0.85rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#7c3aed", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔔</span> <span>School Assembly — no teacher or subject required</span>
              </div>
            )}
            {timeSubject.isBreak && (
              <div style={{ marginBottom: "1rem", padding: "0.6rem 0.85rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#d97706", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>☕</span> <span>Recess / Lunch break</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <TimePicker
                label="Start Time"
                value={timeSubject.initialTime}
                onChange={(val) => setTimeSubject({ ...timeSubject, initialTime: val })}
              />
              <TimePicker
                label="End Time"
                value={timeSubject.finalTime}
                onChange={(val) => setTimeSubject({ ...timeSubject, finalTime: val })}
              />
            </div>

            {timeSubject.initialTime && timeSubject.finalTime && (
              <>
                {!timeSubject.isBreak && !timeSubject.isAssembly && (
                  <div style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Teacher</label>
                      <Select
                        styles={selectStyles}
                        options={enrichedTeacherOptions}
                        value={enrichedTeacherOptions.find(opt => opt.value === timeSubject.teacher) || null}
                        onChange={(option) => setTimeSubject({ ...timeSubject, teacher: option ? option.value : "" })}
                        placeholder="Search Teacher..."
                        isClearable
                        menuPlacement="auto"
                        formatOptionLabel={renderSelectOption}
                        filterOption={customFilterOption}
                      />
                      {(() => {
                        const selT = enrichedTeacherOptions.find(t => t.value === timeSubject.teacher);
                        if (!selT) return null;
                        if (selT.isClashing) {
                          return (
                            <div style={{ marginTop: "4px", fontSize: "11px", color: "#dc2626", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <AlertCircle size={12} />
                              {selT.badge} — Teacher double-booked at this time
                            </div>
                          );
                        }
                        return (
                          <div style={{ marginTop: "3px", fontSize: "11px", color: "var(--text-secondary)" }}>
                            Workload: <strong>{selT.badge}</strong>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Subject</label>
                      <Select
                        styles={selectStylesRight}
                        options={enrichedSubjectOptions}
                        value={enrichedSubjectOptions.find(opt => opt.value === timeSubject.subject) || (timeSubject.subject ? { value: timeSubject.subject, label: timeSubject.subject } : null)}
                        onChange={(option) => setTimeSubject({ ...timeSubject, subject: option ? option.value : "" })}
                        placeholder="Select Subject..."
                        noOptionsMessage={() => "No subjects assigned to this class"}
                        isClearable
                        menuPlacement="auto"
                        formatOptionLabel={renderSelectOption}
                        filterOption={customFilterOption}
                      />
                      {(() => {
                        const selS = enrichedSubjectOptions.find(s => s.value === timeSubject.subject);
                        if (!selS) return null;
                        return (
                          <div style={{ marginTop: "3px", fontSize: "11px", color: selS.isExceeded ? "#dc2626" : "var(--text-secondary)", fontWeight: "500" }}>
                            Weekly Quota: <strong>{selS.badge}</strong>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: "600" }}>Room Number (Optional)</label>
                  <select className="input-glass" value={timeSubject.roomNumber} onChange={(e) => setTimeSubject({ ...timeSubject, roomNumber: e.target.value })}>
                    <option value="">Select Room</option>
                    {rooms?.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--glass-border)" }}>
              <button type="button" onClick={() => setOpenAddSingleModal(false)} className="btn btn-ghost">Cancel</button>
              <button type="button" onClick={handleSaveSinglePeriod} disabled={loading} className="btn btn-primary">{loading ? "Saving..." : "Add Period"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {openDuplicateModal && createPortal(
        <div className="modal-backdrop-right" onClick={() => setOpenDuplicateModal(false)}>
          <div className="modal-drawer-right" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--glass-border)" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>Duplicate Schedule</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "0.25rem 0 0 0" }}>Copy day routine across multiple dates</p>
              </div>
              <button type="button" onClick={() => setOpenDuplicateModal(false)} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "1.1rem" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Source Date (Copy From)</label>
                <input type="date" className="input-glass" value={duplicateConfig.sourceDate} onChange={(e) => setDuplicateConfig({ ...duplicateConfig, sourceDate: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Target Start Date (Copy To)</label>
                <input type="date" className="input-glass" value={duplicateConfig.targetStartDate} onChange={(e) => setDuplicateConfig({ ...duplicateConfig, targetStartDate: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Target End Date (Copy Until)</label>
                <input type="date" className="input-glass" value={duplicateConfig.targetEndDate} onChange={(e) => setDuplicateConfig({ ...duplicateConfig, targetEndDate: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Copy Mode</label>
                <select className="input-glass" value={duplicateConfig.copyMode} onChange={(e) => setDuplicateConfig({ ...duplicateConfig, copyMode: e.target.value })}>
                  <option value="exact">Exact Copy (Keep Subjects & Teachers)</option>
                  <option value="structure">Structure Only (Set all to Unassigned)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Days to Duplicate</label>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                  {[{label: "Mon", val: 1}, {label: "Tue", val: 2}, {label: "Wed", val: 3}, {label: "Thu", val: 4}, {label: "Fri", val: 5}, {label: "Sat", val: 6}, {label: "Sun", val: 0}].map(d => (
                    <label key={d.val} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.875rem", cursor: "pointer", fontWeight: "500" }}>
                      <input 
                        type="checkbox" 
                        checked={(duplicateConfig.selectedDays || []).includes(d.val)} 
                        onChange={(e) => {
                          const currentDays = duplicateConfig.selectedDays || [];
                          const newDays = e.target.checked 
                            ? [...currentDays, d.val] 
                            : currentDays.filter(day => day !== d.val);
                          setDuplicateConfig({ ...duplicateConfig, selectedDays: newDays });
                        }} 
                      /> {d.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--glass-border)" }}>
              <button type="button" onClick={() => setOpenDuplicateModal(false)} className="btn btn-ghost">Cancel</button>
              <button type="button" onClick={handleDuplicateDay} disabled={loading} className="btn btn-primary">{loading ? "Duplicating..." : "Duplicate"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
