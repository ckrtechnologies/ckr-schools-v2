import React, { useState, useEffect } from "react";
import { Sparkles, Save, RefreshCw, CheckCircle, Users, Award, Shield } from "lucide-react";
import { toast } from "react-toastify";
import api, { getCoScholasticGrades, saveCoScholasticGrades } from "../services/api";

const GRADE_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2", "A", "B", "C", "D", "E"];

export default function CoScholasticTab() {
  const [meta, setMeta] = useState({ classes: [], terms: [] });
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Term1");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch academic metadata (classes with student counts and terms)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get("/academic_manager/meta");
        const data = res.data || res;
        setMeta(data);
        if (data.classes && data.classes.length > 0) {
          setSelectedClassId(data.classes[0].id);
        }
      } catch (err) {
        toast.error("Failed to load classes for Co-Scholastic grading");
      }
    };
    fetchMeta();
  }, []);

  const loadGrades = async () => {
    if (!selectedClassId || !selectedTerm) return;
    setLoading(true);
    try {
      const res = await getCoScholasticGrades(selectedClassId, selectedTerm);
      const list = res.data?.data || res.data || [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load co-scholastic grades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, [selectedClassId, selectedTerm]);

  const handleGradeChange = (studentId, field, val) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, [field]: val } : s))
    );
  };

  const handleQuickFillAll = (gradeVal = "A") => {
    if (students.length === 0) return;
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        physical_education: gradeVal,
        discipline: gradeVal,
        work_education: gradeVal,
        art_education: gradeVal,
        gk: gradeVal,
      }))
    );
    toast.info(`Filled all activities with Grade "${gradeVal}". Click "Save All Grades" to commit.`);
  };

  const handleSaveAll = async () => {
    if (!selectedClassId || !selectedTerm || students.length === 0) return;
    setSaving(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.student_id,
        physical_education: s.physical_education || "A",
        discipline: s.discipline || "A",
        work_education: s.work_education || "A",
        art_education: s.art_education || "A",
        gk: s.gk || "A",
        remarks: s.remarks || "",
      }));

      await saveCoScholasticGrades(selectedClassId, selectedTerm, payload);
      toast.success(`Successfully saved co-scholastic grades for ${students.length} students!`);
      loadGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Error saving grades");
    } finally {
      setSaving(false);
    }
  };

  const persistedCount = students.filter((s) => s.is_persisted).length;
  const currentClassObj = meta.classes?.find((c) => c.id === selectedClassId);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
      {/* Control Banner Card */}
      <div
        className="glass-card"
        style={{
          padding: "1.25rem 1.5rem",
          borderRadius: "12px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={20} color="#10b981" />
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                PART - 2: Co-Scholastic Assessment & Grading
              </h2>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.35rem", marginBottom: 0 }}>
              Official CBSE Co-Scholastic ratings (Physical & Health, Discipline, Work Education, Art Education, G.K.) for report cards.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => handleQuickFillAll("A")}
              className="btn btn-outline"
              disabled={loading || students.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.82rem",
                padding: "0.45rem 0.85rem",
              }}
              title="Populate Grade A for all students"
            >
              <Sparkles size={14} color="#f59e0b" /> Quick-Fill All "A"
            </button>
            <button
              onClick={handleSaveAll}
              className="btn btn-primary"
              disabled={saving || loading || students.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.82rem",
                padding: "0.45rem 1rem",
                background: "#059669",
                color: "#ffffff",
                border: "none",
                fontWeight: "600",
              }}
            >
              <Save size={14} /> {saving ? "Saving..." : "Save All Grades"}
            </button>
            <button
              onClick={loadGrades}
              className="btn btn-ghost"
              disabled={loading}
              style={{
                padding: "0.45rem 0.65rem",
                display: "inline-flex",
                alignItems: "center",
                color: "var(--text-secondary)",
              }}
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Controls & Headcount summary */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--glass-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {/* Class Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                Class:
              </label>
              <select
                className="input-glass"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.82rem",
                  borderRadius: "8px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--glass-border)",
                  minWidth: "220px",
                }}
              >
                {meta.classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.student_count !== undefined ? `(${c.student_count} students)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                Term:
              </label>
              <select
                className="input-glass"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.82rem",
                  borderRadius: "8px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--glass-border)",
                  minWidth: "120px",
                }}
              >
                {meta.terms?.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Status Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <Users size={14} color="#6366f1" />
              <strong>{students.length}</strong> Students Enrolled
            </span>
            <span>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <CheckCircle size={14} color={persistedCount === students.length && students.length > 0 ? "#10b981" : "#f59e0b"} />
              <strong>{persistedCount}</strong> / {students.length} Saved in DB
            </span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div
        style={{
          overflowX: "auto",
          background: "var(--bg-secondary)",
          borderRadius: "12px",
          border: "1px solid var(--glass-border)",
        }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            <div>Loading Co-Scholastic grades...</div>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <Users size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
            <div>No students found in {currentClassObj?.name || "this class"}.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--glass-border)",
                  background: "rgba(0,0,0,0.03)",
                  color: "var(--text-secondary)",
                  fontWeight: "700",
                }}
              >
                <th style={{ padding: "0.75rem 0.5rem", width: "45px", textAlign: "center" }}>Roll</th>
                <th style={{ padding: "0.75rem 1rem", minWidth: "180px" }}>Student Name</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", minWidth: "90px" }}>Physical & Health</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", minWidth: "90px" }}>Discipline</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", minWidth: "90px" }}>Work Edu</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", minWidth: "90px" }}>Art Edu</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", minWidth: "80px" }}>G.K.</th>
                <th style={{ padding: "0.75rem 0.75rem", minWidth: "180px" }}>Remarks</th>
                <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", width: "85px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => {
                return (
                  <tr
                    key={st.student_id}
                    style={{
                      borderBottom: "1px solid var(--glass-border)",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Roll Number */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center", fontWeight: "600", color: "var(--text-secondary)" }}>
                      {st.roll_number || idx + 1}
                    </td>

                    {/* Student Info */}
                    <td style={{ padding: "0.55rem 1rem" }}>
                      <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{st.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        GR: {st.admission_number || "--"}
                      </div>
                    </td>

                    {/* Physical & Health */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                      <select
                        value={st.physical_education || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "physical_education", e.target.value)}
                        style={gradeSelectStyle}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Discipline */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                      <select
                        value={st.discipline || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "discipline", e.target.value)}
                        style={gradeSelectStyle}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Work Education */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                      <select
                        value={st.work_education || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "work_education", e.target.value)}
                        style={gradeSelectStyle}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Art Education */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                      <select
                        value={st.art_education || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "art_education", e.target.value)}
                        style={gradeSelectStyle}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* G.K. */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                      <select
                        value={st.gk || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "gk", e.target.value)}
                        style={gradeSelectStyle}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Remarks */}
                    <td style={{ padding: "0.55rem 0.75rem" }}>
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        value={st.remarks || ""}
                        onChange={(e) => handleGradeChange(st.student_id, "remarks", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.3rem 0.5rem",
                          fontSize: "0.78rem",
                          borderRadius: "6px",
                          border: "1px solid var(--glass-border)",
                          background: "var(--bg-primary)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </td>

                    {/* Status */}
                    <td style={{ padding: "0.55rem 0.5rem", textAlign: "center" }}>
                      {st.is_persisted ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            color: "#059669",
                            background: "rgba(5, 150, 105, 0.1)",
                            padding: "0.2rem 0.45rem",
                            borderRadius: "12px",
                          }}
                        >
                          <CheckCircle size={10} /> Saved
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            color: "#d97706",
                            background: "rgba(217, 119, 6, 0.1)",
                            padding: "0.2rem 0.45rem",
                            borderRadius: "12px",
                          }}
                        >
                          Draft
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const gradeSelectStyle = {
  padding: "0.25rem 0.4rem",
  fontSize: "0.78rem",
  fontWeight: "700",
  borderRadius: "6px",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  border: "1px solid var(--glass-border)",
  textAlign: "center",
  cursor: "pointer",
  minWidth: "60px",
};

