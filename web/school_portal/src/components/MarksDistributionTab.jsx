import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Lock, Unlock, Copy, CheckCircle, AlertCircle, RefreshCw, X } from "lucide-react";
import api from "../services/api";
import { toast } from "react-toastify";

// CBSE standard quick-presets
const PRESETS = [
  {
    name: "CBSE Class 1-10 (Periodic 10 + Enrichment 5 + Multiple 5 + Written 80)",
    total_marks: 100,
    components: [
      { key: "periodic_test_1", label: "Periodic Test 1", max_marks: 10 },
      { key: "subject_enrichment", label: "Subject Enrichment", max_marks: 5 },
      { key: "multiple_assessment", label: "Multiple Assessment", max_marks: 5 },
      { key: "term1_written", label: "Term1 Written", max_marks: 80 },
    ],
  },
  {
    name: "Computer / IT (Term1 Written 50 + Practical 50)",
    total_marks: 100,
    components: [
      { key: "term1_written", label: "Term1 Written", max_marks: 50 },
      { key: "practical", label: "Practical", max_marks: 50 },
    ],
  },
  {
    name: "Senior Science (Theory 70 + Practical 20 + Viva 10)",
    total_marks: 100,
    components: [
      { key: "theory", label: "Theory Exam", max_marks: 70 },
      { key: "practical", label: "Practical Assessment", max_marks: 20 },
      { key: "viva_internal", label: "Viva / Portfolio", max_marks: 10 },
    ],
  },
  {
    name: "Senior Commerce/Arts (Theory 80 + Project 20)",
    total_marks: 100,
    components: [
      { key: "theory", label: "Theory Exam", max_marks: 80 },
      { key: "project_work", label: "Project & Viva", max_marks: 20 },
    ],
  },
];

const MarksDistributionTab = ({ customTitles = [], exams = [] }) => {
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ classes: [], subjects: [], terms: [], academic_years: [] });
  const [distributions, setDistributions] = useState([]);

  // Filter state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(""); // "" means All Terms

  // Modal custom term mode
  const [isCustomTerm, setIsCustomTerm] = useState(false);
  const [customTermInput, setCustomTermInput] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    academic_year: "2026-27",
    class_id: "",
    subject_id: "",
    term: "TERM 1",
    total_marks: 100,
    components: [
      { key: "periodic", label: "Periodic Test", max_marks: 10 },
      { key: "subject_enrichment", label: "Subject Enrichment", max_marks: 5 },
      { key: "multiple_assessment", label: "Multiple Assessment", max_marks: 5 },
      { key: "term_exam", label: "Term Exam", max_marks: 80 },
    ],
  });

  // Clone Modal state
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneSourceClassId, setCloneSourceClassId] = useState("");
  const [cloneTargetClassIds, setCloneTargetClassIds] = useState([]);
  const [cloneOverwrite, setCloneOverwrite] = useState(false);

  // Load Meta
  const loadMeta = async () => {
    try {
      const res = await api.get("/academic_manager/meta");
      if (res.data?.success) {
        setMeta(res.data.data);
        if (!selectedYear && res.data.data.academic_years?.length > 0) {
          setSelectedYear(res.data.data.academic_years[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load academic meta", err);
      toast.error("Could not load classes & subjects");
    }
  };

  // Load Distributions
  const loadDistributions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedYear) params.academic_year = selectedYear;
      if (selectedClassId) params.class_id = selectedClassId;
      if (selectedSubjectId) params.subject_id = selectedSubjectId;
      if (selectedTerm) params.term = selectedTerm;

      const res = await api.get("/academic_manager/distributions", { params });
      if (res.data?.success) {
        setDistributions(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch distributions", err);
      toast.error(err.response?.data?.message || "Failed to load marks distributions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadDistributions();
  }, [selectedYear, selectedClassId, selectedSubjectId, selectedTerm]);

  // Combined terms purely from DB meta API, existing exams, custom date sheet titles, and existing distributions
  const availableTerms = useMemo(() => {
    const metaTerms = meta.terms || [];
    const examTitles = (exams || []).map((e) => e.title?.trim()).filter(Boolean);
    const custom = (customTitles || []).map((t) => t?.trim()).filter(Boolean);
    const distTerms = (distributions || []).map((d) => d.term?.trim()).filter(Boolean);
    return Array.from(new Set([...metaTerms, ...examTitles, ...custom, ...distTerms])).filter(Boolean);
  }, [meta.terms, exams, customTitles, distributions]);

  // Math sum calculation
  const totalComponentSum = useMemo(() => {
    return (formData.components || []).reduce((acc, c) => acc + (parseFloat(c.max_marks) || 0), 0);
  }, [formData.components]);

  const mathDifference = useMemo(() => {
    return Math.round((parseFloat(formData.total_marks || 0) - totalComponentSum) * 100) / 100;
  }, [formData.total_marks, totalComponentSum]);

  const isMathValid = useMemo(() => {
    return Math.abs(mathDifference) < 0.01 && (formData.components || []).length > 0;
  }, [mathDifference, formData.components]);

  // Open modal for new distribution
  const handleOpenNew = () => {
    setEditingId(null);
    setIsCustomTerm(false);
    setCustomTermInput("");
    setFormData({
      academic_year: selectedYear || "2026-27",
      class_id: selectedClassId || (meta.classes[0]?.id || ""),
      subject_id: selectedSubjectId || (meta.subjects[0]?.id || ""),
      term: selectedTerm || availableTerms[0] || "TERM 1",
      total_marks: 100,
      components: [
        { key: "periodic", label: "Periodic Test", max_marks: 10 },
        { key: "subject_enrichment", label: "Subject Enrichment", max_marks: 5 },
        { key: "multiple_assessment", label: "Multiple Assessment", max_marks: 5 },
        { key: "term_exam", label: "Term Exam", max_marks: 80 },
      ],
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item) => {
    if (item.is_locked) {
      toast.warning("This distribution is locked. Unlock it first to edit.");
      return;
    }
    setEditingId(item.id);
    setIsCustomTerm(false);
    setCustomTermInput("");
    setFormData({
      academic_year: item.academic_year,
      class_id: item.class_id,
      subject_id: item.subject_id,
      term: item.term,
      total_marks: item.total_marks,
      components: item.components || [],
    });
    setIsModalOpen(true);
  };

  // Preset applicator
  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      total_marks: preset.total_marks,
      components: JSON.parse(JSON.stringify(preset.components)),
    }));
  };

  // Add / remove / update components
  const addComponentRow = () => {
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        { key: `comp_${prev.components.length + 1}`, label: "New Assessment", max_marks: 10 },
      ],
    }));
  };

  const removeComponentRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  const updateComponent = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.components];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "label" && !updated[index].is_custom_key) {
        // Auto slugify key
        updated[index].key = value.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 30);
      }
      return { ...prev, components: updated };
    });
  };

  // Save distribution
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isMathValid) {
      toast.error(`Mathematical mismatch! Components sum (${totalComponentSum}) must equal Total (${formData.total_marks}).`);
      return;
    }

    const termToSave = isCustomTerm ? customTermInput.trim() : formData.term;
    if (!termToSave) {
      toast.error("Please select or enter a valid Term name");
      return;
    }

    try {
      const payload = {
        ...formData,
        term: termToSave,
      };
      const res = await api.post("/academic_manager/distributions", payload);
      if (res.data?.success) {
        toast.success(res.data.message || "Marks distribution saved!");
        setIsModalOpen(false);
        loadDistributions();
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Failed to save marks distribution");
    }
  };

  // Toggle lock
  const handleToggleLock = async (item) => {
    try {
      const newStatus = !item.is_locked;
      const res = await api.patch(`/academic_manager/distributions/${item.id}/lock`, { is_locked: newStatus });
      if (res.data?.success) {
        toast.success(`Scheme ${newStatus ? "locked" : "unlocked"} successfully`);
        loadDistributions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle lock status");
    }
  };

  // Delete distribution
  const handleDelete = async (item) => {
    if (item.is_locked) {
      toast.warning("Cannot delete a locked scheme. Unlock it first.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the distribution for ${item.subject?.name} (${item.class?.name} - ${item.class?.section})?`)) {
      return;
    }
    try {
      const res = await api.delete(`/academic_manager/distributions/${item.id}`);
      if (res.data?.success) {
        toast.success("Marks distribution deleted");
        loadDistributions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete distribution");
    }
  };

  // Handle Clone
  const handleCloneSubmit = async (e) => {
    e.preventDefault();
    if (!cloneSourceClassId) {
      toast.error("Please select a source division");
      return;
    }
    if (cloneTargetClassIds.length === 0) {
      toast.error("Please select at least one target division");
      return;
    }

    try {
      const res = await api.post("/academic_manager/distributions/clone", {
        source_class_id: cloneSourceClassId,
        target_class_ids: cloneTargetClassIds,
        academic_year: selectedYear,
        term: selectedTerm,
        overwrite: cloneOverwrite,
      });

      if (res.data?.success) {
        toast.success(res.data.data?.message || "Cloning completed!");
        setIsCloneModalOpen(false);
        loadDistributions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clone distributions");
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Top Header Card */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Dynamic Marks Distribution & Grading Schemes</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Configure multi-component assessment breakdowns (Periodic, Enrichment, Multiple Assessment, Term) per subject with strict mathematical validation.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => setIsCloneModalOpen(true)} title="Clone schemes across parallel divisions">
            <Copy size={16} /> Clone to Divisions
          </button>
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={16} /> Configure Scheme
          </button>
        </div>
      </div>

      {/* Filter Header */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "1rem",
          marginBottom: "1.25rem",
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Academic Year</label>
          <select className="input-glass" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ minWidth: "120px" }}>
            {meta.academic_years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Term</label>
          <select className="input-glass" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ minWidth: "140px" }}>
            <option value="">All Terms</option>
            {availableTerms.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Class & Division</label>
          <select className="input-glass" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ minWidth: "180px" }}>
            <option value="">All Classes</option>
            {meta.classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.name} {c.section ? `(${c.section})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Subject</label>
          <select className="input-glass" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} style={{ minWidth: "180px" }}>
            <option value="">All Subjects</option>
            {meta.subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", height: "100%" }}>
          <button className="btn btn-ghost" onClick={loadDistributions} title="Refresh list">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Schemes Table */}
      <div className="glass-panel" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.03)", textAlign: "left", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Class & Section</th>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Subject</th>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Term / Year</th>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Total</th>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Assessment Breakdown (Columns)</th>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>Status</th>
              <th style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.05)", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {distributions.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <td style={{ padding: "0.875rem 1rem", fontWeight: "600" }}>
                  Class {item.class?.name} <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{item.class?.section || ""}</span>
                </td>
                <td style={{ padding: "0.875rem 1rem", fontWeight: "600", color: "var(--primary-color)" }}>
                  {item.subject?.name}
                </td>
                <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: "500" }}>{item.term}</span>
                  <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.75rem" }}>{item.academic_year}</span>
                </td>
                <td style={{ padding: "0.875rem 1rem", fontWeight: "700" }}>
                  {item.total_marks}M
                </td>
                <td style={{ padding: "0.875rem 1rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {(item.components || []).map((comp, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "#2563eb",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        {comp.label}: <strong>{comp.max_marks}</strong>
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "0.875rem 1rem" }}>
                  {item.is_locked ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#d97706", background: "rgba(217, 119, 6, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                      <Lock size={12} /> Locked
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#16a34a", background: "rgba(22, 163, 74, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                      <Unlock size={12} /> Active
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "0.4rem" }}
                      title={item.is_locked ? "Unlock Scheme" : "Lock Scheme"}
                      onClick={() => handleToggleLock(item)}
                    >
                      {item.is_locked ? <Unlock size={15} color="#16a34a" /> : <Lock size={15} color="#d97706" />}
                    </button>
                    {!item.is_locked && (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem" }}
                        title="Edit Distribution"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={15} color="var(--text-secondary)" />
                      </button>
                    )}
                    {!item.is_locked && (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem" }}
                        title="Delete Distribution"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {distributions.length === 0 && !loading && (
              <tr>
                <td colSpan="7" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  No marks distribution schemes found for the selected filters.
                  <div style={{ marginTop: "0.5rem" }}>
                    Click <strong>"Configure Scheme"</strong> to set up component weights for this class & subject.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Configuration Builder Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                  {editingId ? "Edit Marks Distribution Scheme" : "Configure Marks Distribution Scheme"}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  All components must mathematically add up to the total subject marks.
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: "0.4rem" }} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Presets Toolbar */}
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "rgba(0,0,0,0.03)", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                ⚡ Quick CBSE Presets:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", background: "#fff", border: "1px solid rgba(0,0,0,0.1)" }}
                    onClick={() => applyPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave}>
              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.25rem" }}>Class & Division</label>
                  <select
                    className="input-glass"
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    required
                    disabled={!!editingId}
                    style={{ width: "100%" }}
                  >
                    <option value="">Select Class</option>
                    {meta.classes.map((c) => (
                      <option key={c.id} value={c.id}>Class {c.name} {c.section ? `(${c.section})` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.25rem" }}>Subject</label>
                  <select
                    className="input-glass"
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    required
                    disabled={!!editingId}
                    style={{ width: "100%" }}
                  >
                    <option value="">Select Subject</option>
                    {meta.subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>Term</label>
                    {!editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTerm(!isCustomTerm);
                          if (!isCustomTerm && !customTermInput) {
                            setCustomTermInput(formData.term || "");
                          }
                        }}
                        style={{ background: "none", border: "none", color: "var(--primary-color, #2563eb)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        {isCustomTerm ? "Choose from list" : "+ Enter custom term"}
                      </button>
                    )}
                  </div>

                  {isCustomTerm ? (
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. Unit Test 1, Periodic Test, Term 1"
                      value={customTermInput}
                      onChange={(e) => setCustomTermInput(e.target.value)}
                      required
                      style={{ width: "100%" }}
                      autoFocus
                    />
                  ) : (
                    <select
                      className="input-glass"
                      value={formData.term}
                      onChange={(e) => {
                        if (e.target.value === "__CUSTOM__") {
                          setIsCustomTerm(true);
                          setCustomTermInput("");
                        } else {
                          setFormData({ ...formData, term: e.target.value });
                        }
                      }}
                      required
                      disabled={!!editingId}
                      style={{ width: "100%" }}
                    >
                      {availableTerms.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      {!editingId && <option value="__CUSTOM__">+ Enter custom term name...</option>}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.25rem" }}>Subject Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    className="input-glass"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) || 0 })}
                    required
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Assessment Components List */}
              <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "700" }}>Assessment Components (Columns)</label>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }} onClick={addComponentRow}>
                    <Plus size={14} /> Add Component
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {formData.components.map((comp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr auto",
                        gap: "0.75rem",
                        alignItems: "center",
                        background: "rgba(0,0,0,0.02)",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                      }}
                    >
                      <div>
                        <input
                          type="text"
                          placeholder="e.g. Periodic Test, Theory Exam"
                          className="input-glass"
                          value={comp.label}
                          onChange={(e) => updateComponent(idx, "label", e.target.value)}
                          required
                          style={{ width: "100%", fontSize: "0.85rem" }}
                        />
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginLeft: "0.25rem" }}>
                          Key: {comp.key}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <input
                            type="number"
                            min="0.5"
                            max="500"
                            step="0.5"
                            placeholder="Marks"
                            className="input-glass"
                            value={comp.max_marks}
                            onChange={(e) => updateComponent(idx, "max_marks", parseFloat(e.target.value) || 0)}
                            required
                            style={{ width: "100%", fontSize: "0.85rem" }}
                          />
                          <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>M</span>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem" }}
                          disabled={formData.components.length <= 1}
                          onClick={() => removeComponentRow(idx)}
                          title="Remove row"
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mathematical Sum Meter */}
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "8px",
                  background: isMathValid ? "rgba(22, 163, 74, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${isMathValid ? "rgba(22, 163, 74, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {isMathValid ? (
                    <CheckCircle size={22} color="#16a34a" />
                  ) : (
                    <AlertCircle size={22} color="#ef4444" />
                  )}
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: isMathValid ? "#16a34a" : "#ef4444" }}>
                      {isMathValid ? "Mathematical Balance Verified" : "Sum Mismatch Alert"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Sum of Components: <strong>{totalComponentSum} marks</strong> / Subject Total: <strong>{formData.total_marks} marks</strong>
                      {!isMathValid && (
                        <span style={{ marginLeft: "0.5rem", fontWeight: "600", color: "#ef4444" }}>
                          ({mathDifference > 0 ? `Deficit: ${mathDifference} marks` : `Surplus: ${Math.abs(mathDifference)} marks`})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "800", color: isMathValid ? "#16a34a" : "#ef4444" }}>
                    {totalComponentSum} / {formData.total_marks}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isMathValid}
                  title={!isMathValid ? "Correct component sum to enable save" : ""}
                >
                  {editingId ? "Update Scheme" : "Save Scheme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Across Divisions Modal (Phase 2 feature) */}
      {isCloneModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
          onClick={() => setIsCloneModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: "100%", maxWidth: "520px", padding: "2rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Clone Schemes Across Divisions</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Replicate all configured subject distribution schemes from one division to parallel divisions.
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: "0.4rem" }} onClick={() => setIsCloneModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCloneSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                  Source Division (Template)
                </label>
                <select
                  className="input-glass"
                  value={cloneSourceClassId}
                  onChange={(e) => setCloneSourceClassId(e.target.value)}
                  required
                  style={{ width: "100%" }}
                >
                  <option value="">Select Source Class & Division</option>
                  {meta.classes.map((c) => (
                    <option key={c.id} value={c.id}>Class {c.name} {c.section ? `(${c.section})` : ""}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Target Divisions (Replicate to)
                </label>
                <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "6px", padding: "0.5rem" }}>
                  {meta.classes
                    .filter((c) => c.id !== cloneSourceClassId)
                    .map((c) => (
                      <label
                        key={c.id}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        <input
                          type="checkbox"
                          checked={cloneTargetClassIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCloneTargetClassIds([...cloneTargetClassIds, c.id]);
                            } else {
                              setCloneTargetClassIds(cloneTargetClassIds.filter((id) => id !== c.id));
                            }
                          }}
                        />
                        Class {c.name} {c.section ? `(${c.section})` : ""}
                      </label>
                    ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={cloneOverwrite}
                    onChange={(e) => setCloneOverwrite(e.target.checked)}
                  />
                  Overwrite existing schemes in target divisions
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsCloneModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Start Cloning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksDistributionTab;

