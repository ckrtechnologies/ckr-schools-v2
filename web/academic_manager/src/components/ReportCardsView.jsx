import React, { useState, useEffect } from "react";
import { Download, Search, RefreshCw, FileText, CheckCircle, Award } from "lucide-react";
import { getResults, getAcademicMeta } from "../services/api";
import { generateReportCardPDF } from "../utils/reportCardPDF";
import CustomDropdown from "./CustomDropdown";
import UserAvatar from "./UserAvatar";

export default function ReportCardsView() {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ classes: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, metaRes] = await Promise.all([getResults(), getAcademicMeta()]);
      setResults(Array.isArray(resData) ? resData : []);
      setMeta(metaRes || { classes: [] });
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPDF = async (studentResult) => {
    try {
      showToast(`Generating report card for ${studentResult.studentName}...`);
      await generateReportCardPDF(studentResult);
    } catch (err) {
      showToast("Error generating report card PDF: " + err.message, "error");
    }
  };

  const filteredResults = results.filter((r) => {
    if (selectedClass && String(r.class_id) !== String(selectedClass)) return false;
    if (selectedTerm && r.term?.toLowerCase() !== selectedTerm.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.studentName?.toLowerCase().includes(q);
      const matchAdm = r.admissionNumber?.toLowerCase().includes(q);
      const matchRoll = String(r.roll_number || "").includes(q);
      if (!matchName && !matchAdm && !matchRoll) return false;
    }
    return true;
  });

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
      <div className="card-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Official CBSE Report Cards & Student Results
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Download official Pokharana Educational Trust letterhead report cards with itemized assessment breakdowns, live CBSE grading, and official signature blocks.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by student name, roll or admission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "0.82rem",
              }}
            />
          </div>

          <CustomDropdown
            value={selectedClass}
            onChange={(val) => setSelectedClass(val)}
            placeholder="All Classes & Divisions"
            minWidth="220px"
            options={[
              { value: "", label: "All Classes & Divisions" },
              ...(meta.classes || []).map((c) => ({
                value: c.id,
                label: `Class ${c.name} ${c.section} (${c.student_count ?? 0} students)`,
              })),
            ]}
          />

          <CustomDropdown
            value={selectedTerm}
            onChange={(val) => setSelectedTerm(val)}
            placeholder="All Terms"
            minWidth="130px"
            options={[
              { value: "", label: "All Terms" },
              { value: "Term1", label: "Term1" },
              { value: "Term2", label: "Term2" },
            ]}
          />

          <button onClick={loadData} className="btn btn-outline" style={{ marginLeft: "auto" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="card-panel" style={{ padding: 0 }}>
        <div className="ckr-table-container">
          <table className="ckr-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class & Div</th>
                <th>Term</th>
                <th>Total Marks</th>
                <th>Percentage</th>
                <th>CBSE Grade</th>
                <th>Class Rank</th>
                <th style={{ textAlign: "right" }}>Report Card</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                    Loading student results...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No student results available matching your search.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <UserAvatar src={r.avatar_url} name={r.studentName} size={30} />
                        <div>
                          <p style={{ fontWeight: "700", lineHeight: 1.1 }}>{r.studentName}</p>
                          <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            Roll: {r.roll_number || "--"} • Adm: {r.admissionNumber || "--"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      Class {r.class} {r.section}
                    </td>
                    <td>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "var(--primary-light)", color: "var(--primary)", fontWeight: "600" }}>
                        {r.term}
                      </span>
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      {r.totalMarksObtained} <span style={{ color: "var(--text-muted)" }}>/ {r.totalMaxMarks}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "700",
                          color: r.percentage >= 40 ? "var(--primary)" : "var(--danger)",
                        }}
                      >
                        {r.percentage ? Number(r.percentage).toFixed(1) : "0.0"}%
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "800",
                          fontSize: "0.75rem",
                          background: r.gradeColor ? `${r.gradeColor}20` : "var(--primary-light)",
                          color: r.gradeColor || "var(--primary)",
                        }}
                      >
                        {r.grade || "--"}
                      </span>
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      {r.rank ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--primary)" }}>
                          <Award size={13} /> Rank {r.rank}
                        </span>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDownloadPDF(r)}
                        className="btn btn-outline"
                        style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", color: "var(--info)" }}
                      >
                        <Download size={13} /> Official PDF
                      </button>
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

