import React, { useState, useEffect } from "react";
import { Users, Search, History, BookOpen, AlertCircle } from "lucide-react";
import { fetchClasses, fetchClassStudents } from "../services/tcApi.js";
import CustomDropdown from "./CustomDropdown.jsx";
import UserAvatar from "./UserAvatar.jsx";

export default function StudentSelector({
  selectedClassId,
  onClassChange,
  onClassSelect,
  selectedStudentId,
  onStudentSelect,
  onOpenHistory,
  loadingStudent,
  onAuthError
}) {
  const handleClassChange = onClassChange || onClassSelect;
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudentsList, setLoadingStudentsList] = useState(false);
  const [error, setError] = useState(null);

  // Load classes on mount
  useEffect(() => {
    async function loadClasses() {
      setLoadingClasses(true);
      setError(null);
      try {
        const data = await fetchClasses();
        setClasses(data);
        if (data.length > 0 && !selectedClassId && typeof handleClassChange === "function") {
          handleClassChange(data[0].id);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          if (onAuthError) onAuthError();
          return;
        }
        setError(err.response?.data?.message || err.message || "Failed to load classes");
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    async function loadStudents() {
      setLoadingStudentsList(true);
      setError(null);
      try {
        const list = await fetchClassStudents(selectedClassId);
        setStudents(list);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load class students");
      } finally {
        setLoadingStudentsList(false);
      }
    }
    loadStudents();
  }, [selectedClassId]);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.admission_number?.toLowerCase().includes(q) ||
      String(s.roll_number || "").includes(q)
    );
  });

  return (
    <div className="selector-panel card-glass">
      <div className="selector-header">
        <div className="selector-title">
          <BookOpen className="icon-gold" size={20} />
          <span>Select Class & Student</span>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={onOpenHistory}
          title="View all issued Transfer Certificates"
        >
          <History size={16} />
          <span>TC History</span>
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="selector-controls-grid">
        {/* Class Selection */}
        <div className="form-group">
          <label className="field-label">Assigned Class / Grade</label>
          <CustomDropdown
            value={selectedClassId || ""}
            options={classes.map((c) => ({
              value: c.id,
              label: `Class ${c.name}${c.section ? ` — Section ${c.section}` : ""}${
                c.isClassTeacher ? " (Class Teacher)" : ""
              }`
            }))}
            onChange={(val) => {
              if (typeof handleClassChange === "function") {
                handleClassChange(val);
              }
            }}
            disabled={loadingClasses}
            placeholder={loadingClasses ? "Loading classes..." : "Select Class / Grade"}
          />
        </div>

        {/* Student Search */}
        <div className="form-group">
          <label className="field-label">Search Student</label>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, admission no., or roll no."
              className="input-field search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Student Badges Carousel / Quick List */}
      <div className="students-quick-list">
        {loadingStudentsList ? (
          <div className="loading-state-pill">Fetching students list...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state-pill">No students found for this class.</div>
        ) : (
          <div className="student-cards-grid">
            {filteredStudents.map((st) => {
              const isSelected = st.id === selectedStudentId;
              return (
                <button
                  key={st.id}
                  type="button"
                  className={`student-chip-btn ${isSelected ? "selected" : ""} ${
                    st.tc_received ? "tc-issued" : ""
                  }`}
                  onClick={() => onStudentSelect(st.id)}
                  disabled={loadingStudent}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%" }}>
                    <UserAvatar src={st.avatar_url} name={st.name} size={30} />
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div className="student-chip-top">
                        <span className="student-chip-name">{st.name}</span>
                        {st.tc_received && <span className="badge-tc-done">TC Issued</span>}
                      </div>
                      <div className="student-chip-meta">
                        <span>Adm: <strong>{st.admission_number || "—"}</strong></span>
                        {st.roll_number && <span>Roll: <strong>{st.roll_number}</strong></span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
