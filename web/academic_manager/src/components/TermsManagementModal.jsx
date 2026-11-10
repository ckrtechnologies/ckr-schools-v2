import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, Calendar, Check, AlertCircle, RefreshCw } from "lucide-react";
import { getTerms, createTerm, updateTerm, deleteTerm } from "../services/api";

export default function TermsManagementModal({ isOpen, onClose, onTermsUpdated, initialYear = "2026-27" }) {
  const [academicYear, setAcademicYear] = useState(initialYear);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state for creating / editing
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    academic_year: initialYear,
    weightage_percent: 50,
    display_order: 1
  });

  const loadTerms = async (year = academicYear) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTerms(year);
      setTerms(data || []);
      if (onTermsUpdated) onTermsUpdated(data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to load terms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTerms(academicYear);
      resetForm();
    }
  }, [isOpen, academicYear]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      academic_year: academicYear,
      weightage_percent: 50,
      display_order: (terms.length > 0 ? Math.max(...terms.map(t => Number(t.display_order) || 0)) + 1 : 1)
    });
  };

  const handleEditClick = (term) => {
    setEditingId(term.id);
    setFormData({
      name: term.name,
      academic_year: term.academic_year || academicYear,
      weightage_percent: Number(term.weightage_percent) || 50,
      display_order: Number(term.display_order) || 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Term name is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await updateTerm(editingId, formData);
        setSuccess(`Term "${formData.name}" updated successfully.`);
      } else {
        await createTerm({ ...formData, academic_year: academicYear });
        setSuccess(`Term "${formData.name}" added successfully.`);
      }
      resetForm();
      await loadTerms(academicYear);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (term) => {
    if (!window.confirm(`Are you sure you want to delete term "${term.name}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteTerm(term.id);
      setSuccess(`Term "${term.name}" deleted.`);
      if (editingId === term.id) resetForm();
      await loadTerms(academicYear);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to delete term");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }} onClick={onClose}>
      <div 
        className="modal-box" 
        style={{ maxWidth: "780px", width: "95%", background: "#ffffff", padding: "1.75rem", borderRadius: "14px" }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.85rem", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={20} color="var(--primary)" /> Academic Terms Management
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0 }}>
              Define examination terms, periodic assessments, weightages, and date boundaries for report cards and date sheets.
            </p>
          </div>
          <button onClick={onClose} className="icon-btn hover-bg"><X size={20} /></button>
        </div>

        {/* Year Filter & Alerts */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Academic Session:</label>
            <select
              className="input-glass"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.82rem", fontWeight: "600" }}
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>
          <button onClick={() => loadTerms(academicYear)} className="btn btn-ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && (
          <div style={{ padding: "0.65rem 0.85rem", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: "0.65rem 0.85rem", background: "#dcfce7", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Check size={15} /> {success}
          </div>
        )}

        {/* Existing Terms Table */}
        <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "1.25rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", color: "#475569", fontWeight: "700", textAlign: "left" }}>
                <th style={{ padding: "0.55rem 0.75rem", width: "50px" }}>Order</th>
                <th style={{ padding: "0.55rem 0.75rem" }}>Term Name</th>
                <th style={{ padding: "0.55rem 0.75rem", width: "130px" }}>Weightage (%)</th>
                <th style={{ padding: "0.55rem 0.75rem", width: "90px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
                    No terms configured for {academicYear}. Add your first term below.
                  </td>
                </tr>
              ) : (
                terms.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9", background: editingId === t.id ? "#f0fdf4" : "transparent" }}>
                    <td style={{ padding: "0.5rem 0.75rem", fontWeight: "700", color: "#64748b" }}>#{t.display_order}</td>
                    <td style={{ padding: "0.5rem 0.75rem", fontWeight: "600", color: "var(--text-primary)" }}>{t.name}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <span style={{ padding: "0.2rem 0.45rem", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700" }}>
                        {t.weightage_percent}%
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.3rem" }}>
                        <button 
                          onClick={() => handleEditClick(t)} 
                          className="icon-btn hover-bg" 
                          title="Edit Term"
                          style={{ padding: "3px" }}
                        >
                          <Edit2 size={13} color="#0284c7" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t)} 
                          className="icon-btn hover-bg" 
                          title="Delete Term"
                          style={{ padding: "3px" }}
                        >
                          <Trash2 size={13} color="#e11d48" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add / Edit Form */}
        <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.75rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {editingId ? <Edit2 size={14} /> : <Plus size={14} />} {editingId ? "Edit Examination Term" : "Add New Examination Term"}
          </h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginBottom: "0.25rem" }}>Term Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Term 1, Periodic Assessment 1, Annual"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-glass"
                  style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginBottom: "0.25rem" }}>Weightage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.weightage_percent}
                  onChange={(e) => setFormData({ ...formData, weightage_percent: Number(e.target.value) })}
                  className="input-glass"
                  style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginBottom: "0.25rem" }}>Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="input-glass"
                  style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}>
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}>
                {loading ? "Saving..." : editingId ? "Update Term" : "Save Term"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

