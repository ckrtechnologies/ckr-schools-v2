import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enGB from 'date-fns/locale/en-GB';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dragAndDropModule from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../pages/calendar-theme.css';
import { toast } from "react-toastify";
import api from "../services/api";
import { fetchExams } from "../features/dataSlice";
import TimePicker from "./TimePicker";
import { X, Layers, Plus } from "lucide-react";
import Select from 'react-select';

const withDragAndDrop = dragAndDropModule.default || dragAndDropModule;
const DnDCalendar = withDragAndDrop(BigCalendar);

const locales = {
  'en-GB': enGB,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomToolbar = (toolbar) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  return (
    <div className="rbc-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '0.4rem' }}>
      <div className="rbc-btn-group">
        <button type="button" onClick={goToCurrent} style={{ fontWeight: '600', fontSize: '0.85rem' }}>Today</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.05rem', color: "var(--text-primary)" }}>
        <button type="button" onClick={goToBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', border: 'none', color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '1.1rem', lineHeight: '1' }} className="hover-bg">&#10094;</button>
        <span style={{ minWidth: "160px", textAlign: "center" }}>{toolbar.label}</span>
        <button type="button" onClick={goToNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', border: 'none', color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '1.1rem', lineHeight: '1' }} className="hover-bg">&#10095;</button>
      </div>

      <div className="rbc-btn-group">
        {toolbar.views.map(viewName => (
          <button
            key={viewName}
            type="button"
            className={toolbar.view === viewName ? 'rbc-active' : ''}
            onClick={() => toolbar.onView(viewName)}
            style={{ fontSize: '0.82rem' }}
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
    let bgColor = "rgba(59, 130, 246, 0.85)"; // Event
    if (event.resource.category === 'Holiday') bgColor = "rgba(16, 185, 129, 0.85)"; 
    else if (event.resource.category === 'Exam') bgColor = "rgba(239, 68, 68, 0.85)"; 
    else if (event.resource.category === 'PTM') bgColor = "rgba(245, 158, 11, 0.85)"; 
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 'bold', backgroundColor: bgColor, color: 'white', borderRadius: '4px', padding: '2px 4px', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {event.title}
      </div>
    );
  }

  const { subject, time, marks, invigilator, className, badgeColor } = event.resource;
  return (
    <div style={{ 
      padding: '4px 6px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2px', 
      minHeight: '100%', 
      height: 'max-content',
      backgroundColor: badgeColor || '#8b5cf6', 
      color: '#ffffff', 
      borderRadius: '6px',
      zIndex: 10,
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
        <span style={{ fontWeight: '800', fontSize: '0.78rem', lineHeight: '1.1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject}</span>
        {className && (
          <span style={{ fontSize: "0.65rem", fontWeight: "800", background: "rgba(0,0,0,0.22)", padding: "1px 5px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0 }}>
            Cl. {className}
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.7rem', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span>⏱️</span> {time?.slice(0, 5)}
        {marks && <span style={{ marginLeft: "4px" }}>• {marks}M</span>}
      </div>
      {invigilator && (
        <div style={{ fontSize: '0.68rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span>👤</span> {invigilator}
        </div>
      )}
    </div>
  );
};

export default function DateSheetCalendar({ exams, classes, users, subjects, rooms, classFilter, sectionFilter, customTitles = [], selectedTitle, setSelectedTitle }) {
  const dispatch = useDispatch();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(Views.MONTH);
  const [agendaLength, setAgendaLength] = useState(30);
  const [plannerEvents, setPlannerEvents] = useState([]);

  useEffect(() => {
    api.get('/admin_panel/planner').then(res => {
      setPlannerEvents(res.data.data || []);
    }).catch(console.error);
  }, []);

  const handleViewChange = (newView) => {
    if (newView === 'agenda') {
      if (calendarView === 'month') setAgendaLength(30);
      else if (calendarView === 'week') setAgendaLength(7);
      else if (calendarView === 'day') setAgendaLength(1);
    }
    setCalendarView(newView);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalClass, setModalClass] = useState("");
  const [examSubject, setExamSubject] = useState({
    id: null, ids: [], date: "", time: "", subject: "", duration: "", marks: "", sectionDetails: {}, autoMarksHint: null
  });
  const [loading, setLoading] = useState(false);

  // Auto-fetch Total Marks from Marks Distribution when subject is selected
  const handleSubjectChange = async (subjectName) => {
    setExamSubject(prev => ({ ...prev, subject: subjectName, autoMarksHint: null }));
    if (!subjectName) return;

    try {
      const subObj = subjects?.find(s => s.name === subjectName);
      const targetClass = modalClass || (classes?.find(c => String(c.id) === String(classFilter))?.name) || classFilter;
      const clsObj = classes?.find(c => String(c.className || c.name) === String(targetClass));
      if (subObj?.id && clsObj?.id) {
        const res = await api.get('/academic_manager/distributions', {
          params: { class_id: clsObj.id, subject_id: subObj.id }
        });
        if (res.data?.success && res.data.data?.length > 0) {
          const scheme = res.data.data[0];
          const marksToUse = scheme.total_marks || 100;
          setExamSubject(prev => ({
            ...prev,
            subject: subjectName,
            marks: marksToUse,
            autoMarksHint: `Auto-filled: ${marksToUse} Marks (from Scheme)`
          }));
        }
      }
    } catch (e) {
      // Fallback
    }
  };

  const matchingClassIds = useMemo(() => {
    if (!classFilter) return [];
    return classes?.filter(c => String(c.className || c.name) === String(classFilter)).map(c => c.id) || [];
  }, [classes, classFilter]);

  // Available titles linked with class selected
  const availableTitles = useMemo(() => {
    if (!classFilter) {
      const titles = [...new Set(exams.map(e => e.title).filter(Boolean))];
      return titles.length > 0 ? titles : (customTitles.length > 0 ? customTitles : ["Term1", "Term2"]);
    }

    const classExams = exams.filter(e => 
      String(e.class) === String(classFilter) || 
      String(e.class_name) === String(classFilter) ||
      String(e.classes?.name) === String(classFilter) ||
      matchingClassIds.includes(e.class_id)
    );
    const titles = [...new Set(classExams.map(e => e.title).filter(Boolean))];
    if (titles.length === 0) {
      return customTitles.length > 0 ? customTitles : ["Term1", "Term2"];
    }
    return titles;
  }, [exams, classFilter, matchingClassIds, customTitles]);

  useEffect(() => {
    if (availableTitles.length > 0) {
      if (!selectedTitle || !availableTitles.includes(selectedTitle)) {
        setSelectedTitle(availableTitles[0]);
      }
    }
  }, [availableTitles, selectedTitle, setSelectedTitle]);

  // Consolidated calendar events for all classes (or filtered to specific class)
  const calendarEvents = useMemo(() => {
    const pEvents = [];
    if (plannerEvents) {
      const activeClass = classFilter ? classes?.find(c => String(c.className || c.name) === String(classFilter)) : null;
      plannerEvents.forEach(pe => {
        const targets = Array.isArray(pe.target_classes) ? pe.target_classes : [];
        const isTarget = !classFilter || targets.includes("All") || targets.some(t => {
           if (!activeClass) return false;
           const lower = t.toLowerCase();
           const className = activeClass.name || activeClass.className || "";
           return className.toLowerCase().includes(lower) || 
                  `${className} ${activeClass.section || ''}`.toLowerCase().includes(lower);
        });
        
        if (isTarget) {
          pEvents.push({
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

    if (!selectedTitle) return pEvents;
    
    // Filter exams by selected title and class if classFilter is provided
    let filtered = exams.filter(e => e.title === selectedTitle);
    if (classFilter) {
      filtered = filtered.filter(e => 
        String(e.class) === String(classFilter) ||
        String(e.class_name) === String(classFilter) ||
        String(e.classes?.name) === String(classFilter) ||
        matchingClassIds.includes(e.class_id)
      );
    }

    const grouped = {};
    filtered.forEach(ex => {
      // Group by class and subject when consolidated so every class has its own tile
      const key = `${ex.class}-${ex.subject}-${ex.date}-${ex.time}`;
      const sectionData = {
        exam_id: ex.id,
        class_id: ex.class_id,
        section: ex.section,
        invigilator_id: ex.invigilator_id,
        room_number: ex.room_number
      };

      if (!grouped[key]) {
        grouped[key] = { ...ex, ids: [ex.id], sectionsData: [sectionData], className: ex.class };
      } else {
        grouped[key].ids.push(ex.id);
        grouped[key].sectionsData.push(sectionData);
      }
    });

    let finalEvents = Object.values(grouped);
    if (sectionFilter) {
      finalEvents = finalEvents.filter(group => group.sectionsData.some(s => s.section === sectionFilter));
    }

    // Color palette to distinguish classes in consolidated view
    const classColors = [
      "#8b5cf6", "#3b82f6", "#059669", "#ea580c", "#db2777", 
      "#0284c7", "#d97706", "#7c3aed", "#16a34a", "#e11d48", "#4f46e5"
    ];
    const getClassColor = (cName) => {
      if (!cName) return "#8b5cf6";
      let hash = 0;
      for (let i = 0; i < cName.length; i++) hash += cName.charCodeAt(i);
      return classColors[Math.abs(hash) % classColors.length];
    };

    const regularEvents = finalEvents.map(ex => {
      const [hour, min] = (ex.time || "09:00").split(":");
      const start = new Date(ex.date);
      start.setHours(parseInt(hour, 10), parseInt(min, 10), 0);
      
      const end = new Date(start.getTime() + (ex.duration || 60) * 60000);

      let invigilatorName = null;
      if (sectionFilter) {
        const match = ex.sectionsData.find(s => s.section === sectionFilter);
        if (match) invigilatorName = users?.find(u => u.id === match.invigilator_id)?.name;
      } else {
        const uniqueInvigIds = [...new Set(ex.sectionsData.map(s => s.invigilator_id).filter(Boolean))];
        if (uniqueInvigIds.length === 1) {
          invigilatorName = users?.find(u => u.id === uniqueInvigIds[0])?.name;
        } else if (uniqueInvigIds.length > 1) {
          invigilatorName = "Multiple Invigilators";
        }
      }

      return {
        id: ex.id,
        ids: ex.ids,
        title: ex.subject,
        start,
        end,
        resource: { 
          ...ex, 
          sectionsData: ex.sectionsData, 
          invigilator: invigilatorName,
          className: ex.class,
          badgeColor: getClassColor(ex.class)
        }
      };
    });

    return [...pEvents, ...regularEvents];
  }, [exams, classFilter, selectedTitle, users, sectionFilter, plannerEvents, classes]);

  const eventStyleGetter = () => ({
    style: { backgroundColor: 'transparent', border: 'none', overflow: 'visible', zIndex: 5, padding: 0 }
  });

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

  // Unique class names from classes list
  const availableClassNames = useMemo(() => {
    return Array.from(new Set(classes?.map(c => c.className || c.name))).filter(Boolean).sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  }, [classes]);

  const activeModalClass = modalClass || classFilter || availableClassNames[0] || "";

  const handleSelectSlot = ({ start }) => {
    if (!selectedTitle) return toast.warn("Please select or create a Date Sheet Title first.");
    const targetClass = classFilter || availableClassNames[0] || "";
    setModalClass(targetClass);

    const initialSectionDetails = {};
    const classSections = classes?.filter(c => String(c.className || c.name) === String(targetClass)) || [];
    classSections.forEach(c => {
      initialSectionDetails[c.id] = { invigilator_id: "", room_number: "", exam_id: null };
    });

    setExamSubject({
      id: null, ids: [], date: format(start, 'yyyy-MM-dd'), time: "09:00", subject: "", duration: "120", marks: "100", sectionDetails: initialSectionDetails
    });
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    if (!selectedTitle) return toast.warn("Please select or create a Date Sheet Title first.");

    const today = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const targetClass = classFilter || availableClassNames[0] || "";
    setModalClass(targetClass);

    const initialSectionDetails = {};
    const classSections = classes?.filter(c => String(c.className || c.name) === String(targetClass)) || [];
    classSections.forEach(c => {
      initialSectionDetails[c.id] = { invigilator_id: "", room_number: "", exam_id: null };
    });

    setExamSubject({
      id: null, ids: [], date: dateStr, time: "09:00", subject: "", duration: "120", marks: "100", sectionDetails: initialSectionDetails
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    if (event.resource?.isPlannerEvent) return;
    const ex = event.resource;
    const targetClass = ex.className || ex.class || classFilter || "";
    setModalClass(targetClass);

    const sectionDetails = {};
    const classSections = classes?.filter(c => String(c.className || c.name) === String(targetClass)) || [];
    classSections.forEach(c => {
      const match = ex.sectionsData?.find(s => s.class_id === c.id);
      sectionDetails[c.id] = {
        invigilator_id: match ? (match.invigilator_id || "") : "",
        room_number: match ? (match.room_number || "") : "",
        exam_id: match ? match.exam_id : null
      };
    });

    setExamSubject({
      id: ex.id, ids: event.ids || [ex.id], date: ex.date, time: ex.time, subject: ex.subject, duration: ex.duration || "120", marks: ex.marks || "100", sectionDetails
    });
    setIsModalOpen(true);
  };

  const handleEventDrop = async ({ event, start }) => {
    if (event.resource?.isPlannerEvent) return;
    const pad = (n) => n.toString().padStart(2, '0');
    const newDateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const newTimeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    
    setLoading(true);
    try {
      await Promise.all(event.ids.map(id => 
        api.put(`/admin_panel/exams/updateExams/${id}`, { data: { date: newDateStr, time: newTimeStr } })
      ));
      toast.success("Exam moved successfully");
      dispatch(fetchExams());
    } catch (error) {
      toast.error("Failed to move exam");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!examSubject.subject || !examSubject.date || !examSubject.time) {
      return toast.error("Please fill required fields (Subject, Date, Time)");
    }
    setLoading(true);
    try {
      if (examSubject.ids && examSubject.ids.length > 0) {
        await Promise.all(Object.entries(examSubject.sectionDetails).map(([classId, details]) => {
          if (details.exam_id) {
            return api.put(`/admin_panel/exams/updateExams/${details.exam_id}`, {
              data: {
                subject: examSubject.subject,
                date: examSubject.date,
                time: examSubject.time,
                duration: examSubject.duration,
                marks: examSubject.marks,
                invigilator_id: details.invigilator_id || null,
                room_number: details.room_number || null
              }
            });
          }
          return Promise.resolve();
        }));
        toast.success("Exam updated");
      } else {
        await api.post(`/admin_panel/exams/datesheet`, {
          data: {
            title: selectedTitle,
            class: activeModalClass,
            subjects: [{
              subject: examSubject.subject,
              date: examSubject.date,
              time: examSubject.time,
              duration: examSubject.duration,
              marks: examSubject.marks
            }],
            sectionsData: examSubject.sectionDetails
          }
        });
        toast.success("Exam added to Date Sheet");
      }
      dispatch(fetchExams());
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!window.confirm("Delete this exam?")) return;
    setLoading(true);
    try {
      await Promise.all(examSubject.ids.map(id => 
        api.delete(`/admin_panel/exams/deleteExams/${id}`)
      ));
      toast.success("Exam deleted");
      dispatch(fetchExams());
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete exam");
    } finally {
      setLoading(false);
    }
  };

  const classSubjects = useMemo(() => {
    const targetClass = activeModalClass;
    if (!targetClass) return [];
    const normalizedTarget = String(targetClass).replace(/^Class\s+/i, '').trim().toLowerCase();
    const matchingClassIds = classes?.filter(c => {
      const cName = String(c.className || c.name || '').replace(/^Class\s+/i, '').trim().toLowerCase();
      return cName === normalizedTarget;
    }).map(c => c.id) || [];

    const mapped = subjects?.filter(s => {
      const ids = s.classIds || s.class_ids || (Array.isArray(s.classes) ? s.classes.map(cl => cl.id || cl) : []);
      return ids.some(id => matchingClassIds.includes(String(id)));
    }) || [];
    return mapped;
  }, [subjects, classes, activeModalClass]);

  const uniqueConsolidatedClasses = useMemo(() => {
    const classSet = new Set(calendarEvents.filter(e => !e.resource?.isPlannerEvent).map(e => e.resource?.className).filter(Boolean));
    return Array.from(classSet);
  }, [calendarEvents]);

  return (
    <div className="glass-card" style={{ padding: "0.75rem 1rem", marginTop: "0.5rem" }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", margin: 0 }}>Date Sheet Title:</label>
          <select 
            className="input-glass" 
            value={selectedTitle} 
            onChange={e => {
              if (e.target.value === "__new__") {
                const newTitle = window.prompt("Enter new Date Sheet / Term title (e.g. Unit Test 2, Term 2):");
                if (newTitle && newTitle.trim()) {
                  setSelectedTitle(newTitle.trim());
                }
              } else {
                setSelectedTitle(e.target.value);
              }
            }}
            style={{ margin: 0, padding: "0.3rem 0.75rem", height: "34px", fontSize: "0.85rem", minWidth: "220px", fontWeight: "600" }}
          >
            <option value="">-- Select Date Sheet / Term --</option>
            {availableTitles.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__new__">+ Add New Term...</option>
          </select>
        </div>

        {/* View Indicator Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {!classFilter ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.75rem", background: "rgba(99, 102, 241, 0.12)", color: "var(--primary-color)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
              <Layers size={14} />
              <span>Consolidated All Classes ({uniqueConsolidatedClasses.length} {uniqueConsolidatedClasses.length === 1 ? 'class' : 'classes'})</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.75rem", background: "rgba(16, 185, 129, 0.12)", color: "#059669", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
              <span>Class {classFilter}{sectionFilter ? ` • Section ${sectionFilter}` : ''}</span>
            </div>
          )}
        </div>
        
        <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ height: "34px", padding: "0 1rem", fontSize: "0.85rem", marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={15} /> Add Exam
        </button>
      </div>

      {/* Helpful banner when class is selected but has no exams under this title */}
      {selectedTitle && calendarEvents.filter(e => !e.resource?.isPlannerEvent).length === 0 && (
        <div style={{
          marginBottom: "0.75rem",
          padding: "0.6rem 1rem",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.82rem",
          color: "#1e40af"
        }}>
          <span>
            No examinations scheduled for {classFilter ? `Class ${classFilter}` : "any class"} under <strong>"{selectedTitle}"</strong>.
          </span>
          <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem" }}>
            + Add Exam to Date Sheet
          </button>
        </div>
      )}

      <div style={{ height: "68vh", minHeight: "450px", background: 'white', borderRadius: '12px', padding: '0.5rem', border: '1px solid #e5e7eb' }}>
        <DnDCalendar
          localizer={localizer}
          events={calendarEvents}
          date={calendarDate}
          view={calendarView}
          onNavigate={setCalendarDate}
          onView={handleViewChange}
          length={agendaLength}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          resizable={false}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
          eventPropGetter={eventStyleGetter}
          step={30}
          timeslots={2}
          min={minTime}
          max={maxTime}
        />
      </div>

      {isModalOpen && createPortal(
        <div 
          className="modal-overlay animate-fade-in" 
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="modal-box" 
            style={{ width: "100%", maxWidth: "640px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "1.75rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>{examSubject.id ? "Edit Exam" : "Add Exam to Date Sheet"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn hover-bg"><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600" }}>Class *</label>
                  <select 
                    className="input-glass" 
                    style={{ width: "100%" }}
                    value={activeModalClass}
                    disabled={!!examSubject.id || !!classFilter}
                    onChange={(e) => {
                      setModalClass(e.target.value);
                      const initialSectionDetails = {};
                      const classSections = classes?.filter(c => String(c.className || c.name) === String(e.target.value)) || [];
                      classSections.forEach(c => {
                        initialSectionDetails[c.id] = { invigilator_id: "", room_number: "", exam_id: null };
                      });
                      setExamSubject(prev => ({ ...prev, subject: "", sectionDetails: initialSectionDetails }));
                    }}
                  >
                    {availableClassNames.map(cName => (
                      <option key={cName} value={cName}>Class {cName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600" }}>Subject *</label>
                  <select 
                    className="input-glass" 
                    style={{ width: "100%", borderColor: classSubjects.length === 0 ? "#fca5a5" : undefined }}
                    value={examSubject.subject} 
                    disabled={classSubjects.length === 0}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                  >
                    <option value="">
                      {classSubjects.length === 0 ? `No subjects mapped to Class ${activeModalClass}` : "Select Subject"}
                    </option>
                    {classSubjects.map((sub, i) => (
                      <option key={i} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                  {classSubjects.length === 0 && (
                    <span style={{ fontSize: "0.72rem", color: "#e11d48", fontWeight: "600", marginTop: "0.3rem", display: "block" }}>
                      ⚠️ No subjects mapped to Class {activeModalClass}. Map subjects in Subject Management first.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600" }}>Date *</label>
                  <input 
                    type="date" 
                    className="input-glass" 
                    style={{ width: "100%" }}
                    value={examSubject.date} 
                    onChange={(e) => setExamSubject({...examSubject, date: e.target.value})} 
                  />
                </div>
                <div>
                  <TimePicker 
                    label="Time *"
                    value={examSubject.time} 
                    onChange={(val) => setExamSubject({...examSubject, time: val})} 
                    placeholder="Start Time"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600" }}>Duration (mins)</label>
                  <input 
                    type="number" 
                    className="input-glass" 
                    style={{ width: "100%" }}
                    value={examSubject.duration} 
                    onChange={(e) => setExamSubject({...examSubject, duration: e.target.value})} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600" }}>Total Marks</label>
                  <input 
                    type="number" 
                    className="input-glass" 
                    style={{ width: "100%" }}
                    value={examSubject.marks} 
                    onChange={(e) => setExamSubject({...examSubject, marks: e.target.value, autoMarksHint: null})} 
                  />
                  {examSubject.autoMarksHint && (
                    <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: "600", marginTop: "0.25rem", display: "block" }}>
                      ✨ {examSubject.autoMarksHint}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "0.25rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "0.75rem" }}>Section Assignments (Class {activeModalClass})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {classes?.filter(c => String(c.className || c.name) === String(activeModalClass)).sort((a, b) => (a.section || "").localeCompare(b.section || "")).map(c => (
                    <div key={c.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: "0.75rem", alignItems: "end", padding: "0.65rem 0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: "700", paddingBottom: "0.4rem", color: "#334155", fontSize: "0.85rem" }}>Sec {c.section}</div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.2rem", fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>Invigilator</label>
                        <Select
                          options={users?.filter(u => u.type === 'teacher').sort((a,b) => a.name.localeCompare(b.name)).map(t => ({ value: t.id, label: t.name }))}
                          value={examSubject.sectionDetails[c.id]?.invigilator_id ? { value: examSubject.sectionDetails[c.id].invigilator_id, label: users.find(u => u.id === examSubject.sectionDetails[c.id].invigilator_id)?.name } : null}
                          onChange={(selectedOption) => setExamSubject(prev => ({
                            ...prev, sectionDetails: { ...prev.sectionDetails, [c.id]: { ...prev.sectionDetails[c.id], invigilator_id: selectedOption ? selectedOption.value : "" } }
                          }))}
                          isClearable
                          placeholder="Search teacher..."
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '34px',
                              height: '34px',
                              borderRadius: '6px',
                              borderColor: '#cbd5e1',
                              fontSize: '0.82rem'
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              padding: '0 6px'
                            }),
                            input: (base) => ({
                              ...base,
                              margin: 0,
                              padding: 0
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 100
                            })
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.2rem", fontSize: "0.72rem", color: "#64748b", fontWeight: "600" }}>Room</label>
                        <select 
                          className="input-glass" 
                          style={{ width: "100%", padding: "0.3rem 0.6rem", minHeight: "34px", fontSize: "0.82rem" }}
                          value={examSubject.sectionDetails[c.id]?.room_number || ""} 
                          onChange={(e) => setExamSubject(prev => ({
                            ...prev, sectionDetails: { ...prev.sectionDetails, [c.id]: { ...prev.sectionDetails[c.id], room_number: e.target.value } }
                          }))}
                        >
                          <option value="">Select Room</option>
                          {rooms?.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                {examSubject.id ? (
                  <button onClick={handleDeleteExam} className="btn btn-outline" style={{ color: "#ef4444", borderColor: "#fca5a5", fontSize: "0.85rem" }}>Delete Exam</button>
                ) : <div></div>}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ fontSize: "0.85rem" }}>Cancel</button>
                  <button onClick={handleSaveExam} className="btn btn-primary" disabled={loading} style={{ fontSize: "0.85rem" }}>
                    {loading ? "Saving..." : examSubject.id ? "Update Exam" : "Save Exam"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
