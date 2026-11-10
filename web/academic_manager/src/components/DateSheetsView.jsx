import React, { useState, useEffect, useMemo } from "react";
import { Plus, Calendar, Clock, Copy, RefreshCw, LayoutGrid, Table, Settings } from "lucide-react";
import { getExams, createExam, cloneDateSheet, getAcademicMeta } from "../services/api";
import api from "../services/api";
import DateSheetCalendar from "./DateSheetCalendar";
import CustomDropdown from "./CustomDropdown";
import TermsManagementModal from "./TermsManagementModal";

export default function DateSheetsView() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'Calendar' by default (exactly like admin panel) | 'Tabular'
  const [viewMode, setViewMode] = useState("Calendar");

  // Filter
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [customTitles, setCustomTitles] = useState([]);
  const [classTerms, setClassTerms] = useState({});

  // Modal for Tabular Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "Term1",
    subject: "",
    class_id: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: 120,
    marks: 100,
  });

  // Cloner Modal
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneSourceClass, setCloneSourceClass] = useState("");
  const [cloneTargets, setCloneTargets] = useState([]);
  const [cloneTerm, setCloneTerm] = useState("Term1");

  // Terms Management Modal
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Filter subjects strictly mapped to selected class
  const tabularClassSubjects = useMemo(() => {
    if (!formData.class_id) return [];
    return subjects.filter((s) => {
      const ids = s.classIds || s.class_ids || (Array.isArray(s.classes) ? s.classes.map((cl) => cl.id || cl) : []);
      return ids.some((id) => String(id) === String(formData.class_id));
    });
  }, [subjects, formData.class_id]);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [exRes, metaRes, usersRes, roomsRes] = await Promise.all([
        getExams(),
        getAcademicMeta(),
        api.get("/admin_panel/users").catch(() => ({ data: { users: [] } })),
        api.get("/rooms/getRooms").catch(() => ({ data: { rooms: [] } })),
      ]);

      const examsList = exRes || [];
      setExams(examsList);
      setClasses(metaRes?.classes || []);
      setSubjects(metaRes?.subjects || []);
      setUsers(usersRes.data?.users || usersRes.data || []);
      setRooms(roomsRes.data?.rooms || roomsRes.data || []);
      setClassTerms(metaRes?.class_terms || {});

      // Extract unique titles from exams or meta terms
      const titles = [...new Set([...examsList.map((e) => e.title), ...(metaRes?.terms || [])].filter(Boolean))];
      setCustomTitles(titles.length > 0 ? titles : ["Term1", "Term2"]);
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await createExam(formData);
      showToast("Exam added to Date Sheet successfully!");
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  const handleExecuteClone = async () => {
    if (!cloneSourceClass || cloneTargets.length === 0) {
      showToast("Select source class and at least one target class", "error");
      return;
    }
    try {
      await cloneDateSheet(cloneSourceClass, cloneTargets, cloneTerm);
      showToast(`Successfully cloned date sheet to ${cloneTargets.length} division(s)!`);
      setCloneModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  // Distinct class names for filtering
  const distinctClassNames = useMemo(() => {
    return [...new Set(classes.map((c) => c.name || c.className).filter(Boolean))];
  }, [classes]);

  // Section options matching selected class
  const sectionOptions = useMemo(() => {
    if (!classFilter) return [];
    return classes
      .filter((c) => String(c.name || c.className) === String(classFilter))
      .map((c) => c.section)
      .filter(Boolean);
  }, [classes, classFilter]);

  // Available titles linked with class selected
  const availableTitles = useMemo(() => {
    if (!classFilter) {
      const titles = [...new Set(exams.map((e) => e.title).filter(Boolean))];
      return titles.length > 0 ? titles : (customTitles.length > 0 ? customTitles : ["Term1", "Term2"]);
    }

    const matchingClassIds = classes
      .filter((c) => String(c.name || c.className) === String(classFilter))
      .map((c) => c.id);

    const classExams = exams.filter(
      (e) =>
        String(e.class) === String(classFilter) ||
        String(e.class_name) === String(classFilter) ||
        String(e.classes?.name) === String(classFilter) ||
        matchingClassIds.includes(e.class_id)
    );

    const examTitles = [...new Set(classExams.map((e) => e.title).filter(Boolean))];
    const configuredTerms = classTerms[classFilter] || [];
    const merged = [...new Set([...examTitles, ...configuredTerms])].filter(Boolean);

    if (merged.length === 0) {
      return customTitles.length > 0 ? customTitles : ["Term1", "Term2"];
    }
    return merged;
  }, [exams, classFilter, classes, classTerms, customTitles]);

  // Automatically sync selectedTitle when availableTitles changes (e.g. class switched)
  useEffect(() => {
    if (availableTitles.length > 0) {
      if (!selectedTitle || !availableTitles.includes(selectedTitle)) {
        setSelectedTitle(availableTitles[0]);
      }
    }
  }, [availableTitles, selectedTitle]);

  // Filtered exams for Tabular view
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (classFilter) {
        const clsMatch =
          String(e.class) === String(classFilter) ||
          String(e.class_name) === String(classFilter) ||
          String(e.classes?.name) === String(classFilter) ||
          classes.some((c) => c.id === e.class_id && String(c.name || c.className) === String(classFilter));
        if (!clsMatch) return false;
      }
      if (sectionFilter) {
        const secMatch =
          String(e.section) === String(sectionFilter) ||
          String(e.classes?.section) === String(sectionFilter) ||
          classes.some((c) => c.id === e.class_id && String(c.section) === String(sectionFilter));
        if (!secMatch) return false;
      }
      if (selectedTitle && e.title?.toLowerCase() !== selectedTitle.toLowerCase()) return false;
      return true;
    });
  }, [exams, classFilter, sectionFilter, selectedTitle, classes]);

  return (
    <div>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            background: toast.type === "error" ? "var(--danger)" : "var(--primary)",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "0.85rem",
            zIndex: 1000,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header Panel */}
      <div className="card-panel" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Examination Date Sheets Management
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Visual drag-and-drop calendar scheduling, invigilator assignments, duration, and 1-click division cloner.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {/* View Mode Switcher */}
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => setViewMode("Calendar")}
                className={`btn ${viewMode === "Calendar" ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              >
                <Calendar size={14} /> Calendar View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("Tabular")}
                className={`btn ${viewMode === "Tabular" ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              >
                <Table size={14} /> Tabular View
              </button>
            </div>

            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="btn btn-outline"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
            >
              <Settings size={14} /> Manage Terms
            </button>

            <button
              onClick={() => {
                setCloneSourceClass("");
                setCloneTargets([]);
                setCloneModalOpen(true);
              }}
              className="btn btn-outline"
            >
              <Copy size={15} /> 1-Click Clone
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <CustomDropdown
            value={classFilter}
            onChange={(val) => {
              setClassFilter(val);
              setSectionFilter("");
            }}
            placeholder="All Classes"
            minWidth="140px"
            options={[
              { value: "", label: "All Classes" },
              ...distinctClassNames.map((cName) => ({
                value: cName,
                label: `Class ${cName}`,
              })),
            ]}
          />

          {classFilter && sectionOptions.length > 0 && (
            <CustomDropdown
              value={sectionFilter}
              onChange={(val) => setSectionFilter(val)}
              placeholder="All Sections"
              minWidth="130px"
              options={[
                { value: "", label: "All Sections" },
                ...sectionOptions.map((sec) => ({
                  value: sec,
                  label: `Section ${sec}`,
                })),
              ]}
            />
          )}

          <CustomDropdown
            value={selectedTitle}
            onChange={(val) => setSelectedTitle(val)}
            placeholder="All Terms"
            minWidth="140px"
            options={[
              { value: "", label: "All Terms" },
              ...availableTitles.map((t) => ({
                value: t,
                label: t,
              })),
            ]}
          />

          <button onClick={loadData} className="btn btn-outline" style={{ marginLeft: "auto" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "Calendar" ? (
        <div className="card-panel" style={{ padding: "1rem", minHeight: "680px" }}>
          <DateSheetCalendar
            exams={exams}
            classes={classes}
            users={users}
            subjects={subjects}
            rooms={rooms}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            customTitles={customTitles}
            selectedTitle={selectedTitle}
            setSelectedTitle={setSelectedTitle}
            onRefresh={loadData}
            onShowToast={showToast}
          />
        </div>
      ) : (
        <div className="card-panel" style={{ padding: 0 }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>
              Scheduled Exams ({filteredExams.length})
            </span>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}>
              <Plus size={14} /> Add Exam to Date Sheet
            </button>
          </div>

          <div className="ckr-table-container" style={{ border: "none" }}>
            <table className="ckr-table">
              <thead>
                <tr>
                  <th>Exam ID</th>
                  <th>Term</th>
                  <th>Subject</th>
                  <th>Class & Section</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                      Loading date sheets...
                    </td>
                  </tr>
                ) : filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                      No examinations scheduled. Click "+ Add Exam to Date Sheet" or switch to Calendar View.
                    </td>
                  </tr>
                ) : (
                  filteredExams.map((exam) => (
                    <tr key={exam.id}>
                      <td style={{ fontWeight: "700" }}>#{exam.id}</td>
                      <td>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", background: "var(--primary-light)", color: "var(--primary)", fontWeight: "600" }}>
                          {exam.title}
                        </span>
                      </td>
                      <td style={{ fontWeight: "700" }}>{exam.subject}</td>
                      <td>
                        Class {exam.class || exam.classes?.name || exam.class_name || classes.find((c) => c.id === exam.class_id)?.name || "--"} {exam.section || exam.classes?.section || classes.find((c) => c.id === exam.class_id)?.section || ""}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span>{exam.date}</span>
                          <Clock size={13} color="var(--text-muted)" style={{ marginLeft: "4px" }} />
                          <span>{exam.time || "09:00"}</span>
                        </div>
                      </td>
                      <td>{exam.duration || 120} mins</td>
                      <td style={{ fontWeight: "800", color: "var(--primary)" }}>{exam.marks || 100}M</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Exam Modal for Tabular View */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.35rem" }}>
              Add Exam to Date Sheet
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Specify assessment date, time, duration and total marks.
            </p>

            <form onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Term *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Class & Division *
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.name || c.className} {c.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    disabled={!formData.class_id || tabularClassSubjects.length === 0}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  >
                    <option value="">
                      {!formData.class_id ? "Select Class first" : tabularClassSubjects.length === 0 ? "No subjects mapped to this class" : "Select Subject"}
                    </option>
                    {tabularClassSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {formData.class_id && tabularClassSubjects.length === 0 && (
                    <span style={{ fontSize: "0.72rem", color: "#e11d48", fontWeight: "600", marginTop: "0.25rem", display: "block" }}>
                      ⚠️ No subjects mapped. Assign subjects in Subject Management first.
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Date Sheet Modal */}
      {cloneModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "480px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.35rem" }}>
              Clone Entire Date Sheet to Parallel Divisions
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Copies all exam schedules, timings, and marks from one division to another in 1 click.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                Source Class *
              </label>
              <select
                value={cloneSourceClass}
                onChange={(e) => setCloneSourceClass(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
              >
                <option value="">Select Source Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.name || c.className} {c.section}
                  </option>
                ))}
              </select>
            </div>

            {cloneSourceClass && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Target Parallel Divisions *
                </label>
                <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.5rem" }}>
                  {classes
                    .filter((c) => c.id !== cloneSourceClass)
                    .map((target) => (
                      <label
                        key={target.id}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem", fontSize: "0.82rem", cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={cloneTargets.includes(target.id)}
                          onChange={(e) => {
                            if (e.target.checked) setCloneTargets([...cloneTargets, target.id]);
                            else setCloneTargets(cloneTargets.filter((id) => id !== target.id));
                          }}
                        />
                        Class {target.name || target.className} {target.section}
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button type="button" onClick={() => setCloneModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="button" onClick={handleExecuteClone} className="btn btn-primary">
                Execute Date Sheet Clone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Management CRUD Modal */}
      <TermsManagementModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onTermsUpdated={() => loadData()}
      />
    </div>
  );
}
