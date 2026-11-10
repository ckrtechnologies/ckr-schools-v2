import React, { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Edit2, AlertCircle, CheckCircle, RefreshCw, Settings } from "lucide-react";
import CustomDropdown from "./CustomDropdown";
import TermsManagementModal from "./TermsManagementModal";
import {
  getAcademicMeta,
  getDistributions,
  saveDistribution,
  deleteDistribution,
  cloneDistribution,
} from "../services/api";

const CBSE_PRESETS = [
  {
    name: "CBSE Standard (Periodic 10 + Enrichment 5 + Multiple 5 + Written 80)",
    total: 100,
    components: [
      { key: "periodic_test_1", label: "Periodic Test 1", max_marks: 10, is_exam: true },
      { key: "subject_enrichment", label: "Subject Enrichment", max_marks: 5, is_exam: false },
      { key: "multiple_assessment", label: "Multiple Assessment", max_marks: 5, is_exam: false },
      { key: "term1_written", label: "Term1 Written", max_marks: 80, is_exam: true },
    ],
  },
  {
    name: "Computer / IT (Written 50 + Practical 50)",
    total: 100,
    components: [
      { key: "term1_written", label: "Term1 Written", max_marks: 50, is_exam: true },
      { key: "practical", label: "Practical", max_marks: 50, is_exam: true },
    ],
  },
  {
    name: "CBSE Internal + Board (20 + 80)",
    total: 100,
    components: [
      { key: "internal_assessment", label: "Internal Assessment", max_marks: 20, is_exam: false },
      { key: "board_exam", label: "Board Exam", max_marks: 80, is_exam: true },
    ],
  },
];

export default function MarksDistributionView() {
  const [distributions, setDistributions] = useState([]);
  const [meta, setMeta] = useState({ classes: [], subjects: [], terms: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterYear, setFilterYear] = useState("2026-27");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTerm, setFilterTerm] = useState("");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    academic_year: "2026-27",
    class_id: "",
    subject_id: "",
    term: "Term1",
    total_marks: 100,
    components: [
      { key: "periodic_test", label: "Periodic Test", max_marks: 10, is_exam: true },
      { key: "subject_enrichment", label: "Subject Enrichment", max_marks: 5, is_exam: false },
      { key: "multiple_assessment", label: "Multiple Assessment", max_marks: 5, is_exam: false },
      { key: "term_exam", label: "Term Exam", max_marks: 80, is_exam: true },
    ],
  });

  // Clone Modal
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState(null);
  const [cloneTargets, setCloneTargets] = useState([]);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [metaRes, distRes] = await Promise.all([
        getAcademicMeta(),
        getDistributions({
          academic_year: filterYear,
          class_id: filterClass,
          subject_id: filterSubject,
          term: filterTerm,
        }),
      ]);
      setMeta(metaRes || { classes: [], subjects: [], terms: [] });
      setDistributions(distRes || []);
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterYear, filterClass, filterSubject, filterTerm]);

  // Math sum calculations
  const componentSum = (formData.components || []).reduce(
    (acc, curr) => acc + (Number(curr.max_marks) || 0),
    0
  );
  const isSumValid = componentSum === Number(formData.total_marks);
  const sumDiff = componentSum - Number(formData.total_marks);

  const handleAddComponent = () => {
    setFormData({
      ...formData,
      components: [
        ...formData.components,
        {
          key: `comp_${Date.now()}`,
          label: "New Assessment",
          max_marks: 10,
          is_exam: false,
        },
      ],
    });
  };

  const handleRemoveComponent = (idx) => {
    setFormData({
      ...formData,
      components: formData.components.filter((_, i) => i !== idx),
    });
  };

  const handleComponentChange = (idx, field, val) => {
    const updated = [...formData.components];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === "label" && (!updated[idx].key || updated[idx].key.startsWith("comp_"))) {
      updated[idx].key = val.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    setFormData({ ...formData, components: updated });
  };

  const handleApplyPreset = (preset) => {
    setFormData({
      ...formData,
      total_marks: preset.total,
      components: JSON.parse(JSON.stringify(preset.components)),
    });
  };

  const handleOpenCreateModal = () => {
    setFormData({
      academic_year: filterYear || "2026-27",
      class_id: filterClass || (meta.classes?.[0]?.id || ""),
      subject_id: filterSubject || (meta.subjects?.[0]?.id || ""),
      term: filterTerm || "Term1",
      total_marks: 100,
      components: [
        { key: "periodic_test", label: "Periodic Test", max_marks: 10, is_exam: true },
        { key: "subject_enrichment", label: "Subject Enrichment", max_marks: 5, is_exam: false },
        { key: "multiple_assessment", label: "Multiple Assessment", max_marks: 5, is_exam: false },
        { key: "term_exam", label: "Term Exam", max_marks: 80, is_exam: true },
      ],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (dist) => {
    setFormData({
      id: dist.id,
      academic_year: dist.academic_year || "2026-27",
      class_id: dist.class_id,
      subject_id: dist.subject_id,
      term: dist.term,
      total_marks: dist.total_marks || 100,
      components: JSON.parse(JSON.stringify(dist.components || [])),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isSumValid) {
      showToast(`Component sum (${componentSum}) must equal Total (${formData.total_marks})`, "error");
      return;
    }

    try {
      await saveDistribution(formData);
      showToast("Marks distribution scheme saved successfully!");
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this marks distribution?")) return;
    try {
      await deleteDistribution(id);
      showToast("Distribution deleted successfully");
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  const handleExecuteClone = async () => {
    if (!cloneSource || cloneTargets.length === 0) {
      showToast("Select at least one target division", "error");
      return;
    }
    try {
      await cloneDistribution(cloneSource.id, cloneTargets);
      showToast(`Successfully cloned scheme to ${cloneTargets.length} division(s)!`);
      setCloneModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
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

      {/* Action Header */}
      <div className="card-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
              Dynamic Marks Distribution & Grading Schemes
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              Configure multi-component assessment breakdowns (Periodic, Enrichment, Multiple, Term) with strict mathematical verification (Sum of components = Total Marks).
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button 
              onClick={() => setIsTermsModalOpen(true)} 
              className="btn btn-outline"
              style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem" }}
            >
              <Settings size={14} /> Manage Terms
            </button>
            <button onClick={handleOpenCreateModal} className="btn btn-primary">
              <Plus size={16} /> Configure Scheme
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <CustomDropdown
            value={filterYear}
            onChange={(val) => setFilterYear(val)}
            placeholder="Select Academic Year"
            minWidth="190px"
            options={[
              { value: "2026-27", label: "Academic Year 2026-27" },
              { value: "2025-26", label: "Academic Year 2025-26" },
            ]}
          />

          <CustomDropdown
            value={filterClass}
            onChange={(val) => setFilterClass(val)}
            placeholder="All Classes & Divisions"
            minWidth="200px"
            options={[
              { value: "", label: "All Classes & Divisions" },
              ...(meta.classes || []).map((c) => ({
                value: c.id,
                label: `Class ${c.name} ${c.section}`,
              })),
            ]}
          />

          <CustomDropdown
            value={filterSubject}
            onChange={(val) => setFilterSubject(val)}
            placeholder="All Subjects"
            minWidth="160px"
            options={[
              { value: "", label: "All Subjects" },
              ...(meta.subjects || []).map((s) => ({
                value: s.id,
                label: s.name,
              })),
            ]}
          />

          <CustomDropdown
            value={filterTerm}
            onChange={(val) => setFilterTerm(val)}
            placeholder="All Terms"
            minWidth="130px"
            options={[
              { value: "", label: "All Terms" },
              ...(meta.terms || []).map((t) => ({
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

      {/* Table */}
      <div className="card-panel" style={{ padding: 0 }}>
        <div className="ckr-table-container">
          <table className="ckr-table">
            <thead>
              <tr>
                <th>Class & Division</th>
                <th>Subject</th>
                <th>Term</th>
                <th>Total</th>
                <th>Assessment Components Breakdown</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                    Loading distributions...
                  </td>
                </tr>
              ) : distributions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No marks distribution schemes configured yet. Click "+ Configure Scheme" to set up your CBSE rubrics.
                  </td>
                </tr>
              ) : (
                distributions.map((dist) => (
                  <tr key={dist.id}>
                    <td style={{ fontWeight: "700" }}>
                      Class {dist.class_name || dist.class?.name || "--"} {dist.section || dist.class?.section || ""}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--primary)" }}>
                      {dist.subject_name || dist.subject?.name || "--"}
                    </td>
                    <td>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "var(--primary-light)", color: "var(--primary)", fontWeight: "600" }}>
                        {dist.term}
                      </span>
                    </td>
                    <td style={{ fontWeight: "800" }}>{dist.total_marks} Marks</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {dist.components?.map((c, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "2px 7px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: "600",
                              background: "rgba(37, 99, 235, 0.08)",
                              color: "#2563eb",
                              border: "1px solid rgba(37, 99, 235, 0.2)",
                            }}
                          >
                            {c.label || c.key}: {c.max_marks}M
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: "3px 10px", borderRadius: "12px", background: "#dcfce7", color: "#166534", fontSize: "0.75rem", fontWeight: "700" }}>
                        Active
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        <button
                          onClick={() => handleEdit(dist)}
                          className="btn btn-outline"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          title="Edit Scheme"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setCloneSource(dist);
                            setCloneTargets([]);
                            setCloneModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          title="Clone to parallel divisions"
                        >
                          <Copy size={13} /> Clone
                        </button>
                        <button
                          onClick={() => handleDelete(dist.id)}
                          className="btn btn-outline"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}
                          title="Delete Scheme"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Scheme Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.35rem" }}>
              {formData.id ? "Edit Marks Distribution Scheme" : "Configure Marks Distribution Scheme"}
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Define component maximums ensuring running sum equals total subject marks.
            </p>

            <form onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
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
                    {meta.classes?.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.name} {c.section}
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
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  >
                    <option value="">Select Subject</option>
                    {meta.subjects?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", margin: 0 }}>
                      Term *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer", padding: 0 }}
                    >
                      + Manage Terms
                    </button>
                  </div>
                  <select
                    required
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  >
                    <option value="">Select Term</option>
                    {(meta.terms || []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.3rem" }}>
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              {/* CBSE Presets */}
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", marginRight: "0.5rem" }}>
                  1-Click Presets:
                </span>
                {CBSE_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="btn btn-outline"
                    style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", marginRight: "0.4rem", marginTop: "0.3rem" }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Mathematical Sum Meter */}
              <div
                style={{
                  padding: "0.65rem 0.85rem",
                  borderRadius: "6px",
                  background: isSumValid ? "var(--primary-light)" : "var(--danger-light)",
                  border: `1px solid ${isSumValid ? "var(--primary)" : "var(--danger)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {isSumValid ? <CheckCircle size={16} color="var(--primary)" /> : <AlertCircle size={16} color="var(--danger)" />}
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: isSumValid ? "var(--primary)" : "var(--danger)" }}>
                    Component Sum: {componentSum} / {formData.total_marks} Marks
                  </span>
                </div>
                {!isSumValid && (
                  <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "var(--danger)" }}>
                    {sumDiff > 0 ? `Exceeds by +${sumDiff}M` : `Deficit: ${Math.abs(sumDiff)}M needed`}
                  </span>
                )}
              </div>

              {/* Dynamic Components List */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700" }}>Assessment Components</label>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                  >
                    <Plus size={13} /> Add Component
                  </button>
                </div>

                {formData.components.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Component Label"
                      value={c.label}
                      onChange={(e) => handleComponentChange(i, "label", e.target.value)}
                      style={{ flex: 2, padding: "0.35rem 0.5rem", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "0.8rem" }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={c.max_marks}
                      onChange={(e) => handleComponentChange(i, "max_marks", Number(e.target.value))}
                      style={{ width: "80px", padding: "0.35rem 0.5rem", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "0.8rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(i)}
                      className="btn btn-ghost"
                      style={{ padding: "0.3rem", color: "var(--danger)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={!isSumValid} className="btn btn-primary">
                  Save Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {cloneModalOpen && cloneSource && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.35rem" }}>
              Clone Scheme to Parallel Divisions
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Source: <strong>Class {cloneSource.class_name} {cloneSource.section}</strong> • {cloneSource.subject_name} ({cloneSource.term})
            </p>

            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.5rem", marginBottom: "1rem" }}>
              {meta.classes
                ?.filter((c) => String(c.name) === String(cloneSource.class_name) && c.id !== cloneSource.class_id)
                .map((target) => (
                  <label
                    key={target.id}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem", fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={cloneTargets.includes(target.id)}
                      onChange={(e) => {
                        if (e.target.checked) setCloneTargets([...cloneTargets, target.id]);
                        else setCloneTargets(cloneTargets.filter((id) => id !== target.id));
                      }}
                    />
                    Class {target.name} {target.section}
                  </label>
                ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button type="button" onClick={() => setCloneModalOpen(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="button" onClick={handleExecuteClone} className="btn btn-primary">
                Execute Clone
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

