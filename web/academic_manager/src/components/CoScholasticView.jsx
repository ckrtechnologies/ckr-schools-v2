import React, { useState, useEffect } from "react";
import { Award, Save, RefreshCw, CheckCircle, Sparkles, Filter } from "lucide-react";
import { getAcademicMeta, getCoScholasticGrades, saveCoScholasticGrades } from "../services/api";
import CustomDropdown from "./CustomDropdown";

const GRADE_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2", "A", "B", "C", "D", "E"];

export default function CoScholasticView() {
  const [meta, setMeta] = useState({ classes: [], terms: [] });
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Term1");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await getAcademicMeta();
        setMeta(res);
        if (res.classes && res.classes.length > 0) {
          setSelectedClass(res.classes[0].id);
        }
      } catch (err) {
        showToast(err.response?.data?.message || err.message, "error");
      }
    };
    fetchMeta();
  }, []);

  const loadStudents = async () => {
    if (!selectedClass || !selectedTerm) return;
    setLoading(true);
    try {
      const data = await getCoScholasticGrades(selectedClass, selectedTerm);
      setStudents(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClass, selectedTerm]);

  const handleGradeChange = (studentId, field, val) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, [field]: val } : s))
    );
  };

  const handleQuickFillAll = (gradeVal = "A") => {
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
    showToast(`All fields populated with Grade "${gradeVal}". Remember to click Save All.`);
  };

  const handleSaveAll = async () => {
    if (!selectedClass || !selectedTerm || students.length === 0) return;
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

      await saveCoScholasticGrades(selectedClass, selectedTerm, payload);
      showToast(`Saved co-scholastic grades for ${students.length} students!`);
      loadStudents();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toast */}
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
      <div className="card-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
              PART - 2 : Co-Scholastic Assessment & Grading
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Manage CBSE co-curricular activities (Physical & Health Education, Discipline, Work Education, Art Education, G.K.) for official report card compilation.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => handleQuickFillAll("A")}
              className="btn btn-outline"
              disabled={loading || students.length === 0}
              title="Populate Grade A for all students"
            >
              <Sparkles size={14} /> Quick-Fill All "A"
            </button>
            <button
              onClick={handleSaveAll}
              className="btn btn-primary"
              disabled={saving || loading || students.length === 0}
            >
              <Save size={15} /> {saving ? "Saving..." : "Save All Grades"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Filter size={14} color="var(--text-muted)" />
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>Class:</span>
          </div>
          <CustomDropdown
            value={selectedClass}
            onChange={(val) => setSelectedClass(val)}
            placeholder="Select Class"
            minWidth="200px"
            options={(meta.classes || []).map((c) => ({
              value: c.id,
              label: `Class ${c.name} ${c.section} (${c.student_count ?? 0} students)`,
            }))}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>Term:</span>
          </div>
          <CustomDropdown
            value={selectedTerm}
            onChange={(val) => setSelectedTerm(val)}
            placeholder="Select Term"
            minWidth="120px"
            options={[
              { value: "Term1", label: "Term1" },
              { value: "Term2", label: "Term2" },
            ]}
          />

          <button onClick={loadStudents} className="btn btn-outline" style={{ marginLeft: "auto" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Roster & Grading Table */}
      <div className="card-panel" style={{ padding: 0 }}>
        <div className="ckr-table-container">
          <table className="ckr-table">
            <thead>
              <tr>
                <th style={{ width: "65px", textAlign: "center" }}>Roll</th>
                <th>Student Name</th>
                <th style={{ textAlign: "center" }}>Physical & Health</th>
                <th style={{ textAlign: "center" }}>Discipline</th>
                <th style={{ textAlign: "center" }}>Work Education</th>
                <th style={{ textAlign: "center" }}>Art Education</th>
                <th style={{ textAlign: "center" }}>G.K.</th>
                <th>Remarks</th>
                <th style={{ width: "90px", textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem" }}>
                    Loading student roster and grades...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No students found for this class and division.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.student_id}>
                    <td style={{ textAlign: "center", fontWeight: "700" }}>{st.roll_number}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "var(--primary-light)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                          }}
                        >
                          {st.name ? st.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <p style={{ fontWeight: "600", fontSize: "0.82rem" }}>{st.name}</p>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                            GR: {st.admission_number || "--"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Physical Education */}
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={st.physical_education || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "physical_education", e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: "700", fontSize: "0.8rem", textAlign: "center" }}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>

                    {/* Discipline */}
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={st.discipline || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "discipline", e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: "700", fontSize: "0.8rem", textAlign: "center" }}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>

                    {/* Work Education */}
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={st.work_education || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "work_education", e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: "700", fontSize: "0.8rem", textAlign: "center" }}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>

                    {/* Art Education */}
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={st.art_education || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "art_education", e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: "700", fontSize: "0.8rem", textAlign: "center" }}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>

                    {/* GK */}
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={st.gk || "A"}
                        onChange={(e) => handleGradeChange(st.student_id, "gk", e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: "700", fontSize: "0.8rem", textAlign: "center" }}
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>

                    {/* Remarks */}
                    <td>
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        value={st.remarks || ""}
                        onChange={(e) => handleGradeChange(st.student_id, "remarks", e.target.value)}
                        style={{ padding: "0.3rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "0.78rem", width: "100%" }}
                      />
                    </td>

                    {/* Persisted Status */}
                    <td style={{ textAlign: "center" }}>
                      {st.is_persisted ? (
                        <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <CheckCircle size={12} /> Saved
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Default
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

