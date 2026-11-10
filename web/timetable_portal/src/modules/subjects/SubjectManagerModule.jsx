import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  GraduationCap,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../services/subjectApi";
import { fetchAllClasses } from "../../services/api";

// No keyword-guessing fallback: categories and quotas are strictly user-specified


const SubjectManagerModule = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // "ALL" | "ACADEMICS" | "CO_CURRICULAR"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: "", classIds: [] });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, cls] = await Promise.all([getSubjects(), fetchAllClasses()]);
      setSubjects(subs || []);
      setClasses(cls || []);
    } catch (err) {
      toast.error("Failed to load subjects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Natural sort classes
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA !== numB) return numA - numB;
        return (a.section || "").localeCompare(b.section || "");
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [classes]);

  // Filtered Subjects (Strictly by database category)
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch = (s.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());

      const isCoCurr = s.category === "co_curricular";

      if (categoryFilter === "ACADEMICS" && isCoCurr) return false;
      if (categoryFilter === "CO_CURRICULAR" && !isCoCurr) return false;

      return matchesSearch;
    });
  }, [subjects, searchQuery, categoryFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = subjects.length;
    let academics = 0;
    let coCurricular = 0;
    subjects.forEach((s) => {
      if (s.category === "co_curricular") coCurricular++;
      else academics++;
    });
    return { total, academics, coCurricular };
  }, [subjects]);

  // Modal handlers
  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({ name: "", category: "academics", weeklyQuota: "", classIds: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name || "",
      category: sub.category || "academics",
      weeklyQuota: sub.weeklyQuota !== undefined && sub.weeklyQuota !== null ? sub.weeklyQuota : "",
      classIds: sub.classIds || [],
    });
    setIsModalOpen(true);
  };

  const handleToggleClass = (classId) => {
    setFormData((prev) => {
      const exists = prev.classIds.includes(classId);
      return {
        ...prev,
        classIds: exists
          ? prev.classIds.filter((id) => id !== classId)
          : [...prev.classIds, classId],
      };
    });
  };

  const handleSelectAllClasses = () => {
    setFormData((prev) => ({
      ...prev,
      classIds: sortedClasses.map((c) => c.id),
    }));
  };

  const handleClearAllClasses = () => {
    setFormData((prev) => ({
      ...prev,
      classIds: [],
    }));
  };

  const handleSelectPrimary = () => {
    const primaryIds = sortedClasses
      .filter((c) => {
        const num = parseInt(c.name, 10);
        return !isNaN(num) && num <= 5;
      })
      .map((c) => c.id);
    setFormData((prev) => ({
      ...prev,
      classIds: primaryIds,
    }));
  };

  const handleSelectSecondary = () => {
    const secIds = sortedClasses
      .filter((c) => {
        const num = parseInt(c.name, 10);
        return !isNaN(num) && num > 5;
      })
      .map((c) => c.id);
    setFormData((prev) => ({
      ...prev,
      classIds: secIds,
    }));
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.warning("Subject name is required");
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData);
        toast.success(`Subject "${formData.name}" updated successfully`);
      } else {
        await createSubject(formData);
        toast.success(`Subject "${formData.name}" created successfully`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePromptDelete = (id) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteSubject(deletingId);
      toast.success("Subject deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete subject");
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Top Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: "0.75rem 1.15rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.05)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(234, 88, 12, 0.12)",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Subject Manager
              </h1>
              <span
                style={{
                  background: "#fff7ed",
                  color: "#ea580c",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "20px",
                  border: "1px solid #fed7aa",
                }}
              >
                Vision Curriculum
              </span>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                margin: "2px 0 0 0",
                fontWeight: "500",
              }}
            >
              Configure curriculum subjects, class associations, and academic/co-curricular groups
            </p>
          </div>
        </div>

        {/* Metrics & Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          {/* Metric 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f8fafc",
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Total:</span>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b" }}>
              {metrics.total}
            </span>
          </div>

          {/* Metric 2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#faf5ff",
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #f3e8ff",
            }}
          >
            <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600" }}>Academics:</span>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "#7c3aed" }}>
              {metrics.academics}
            </span>
          </div>

          {/* Metric 3 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f0fdf4",
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #dcfce7",
            }}
          >
            <span style={{ fontSize: "11px", color: "#166534", fontWeight: "600" }}>Co-Curricular:</span>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "#166534" }}>
              {metrics.coCurricular}
            </span>
          </div>

          <button
            onClick={loadData}
            className="btn btn-secondary"
            title="Refresh list"
            style={{ padding: "0.38rem 0.55rem", border: "1px solid #cbd5e1" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{
              padding: "0.38rem 0.95rem",
              fontSize: "12.5px",
              fontWeight: "700",
              background: "#16a34a",
              borderColor: "#15803d",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
            }}
          >
            <Plus size={15} strokeWidth={2.4} /> Add Subject
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "0.55rem 0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          borderRadius: "10px",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          flexShrink: 0,
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", width: "280px" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search subject by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass"
            style={{
              width: "100%",
              padding: "0.25rem 0.5rem 0.25rem 1.85rem",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>

        {/* Category Pill Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginRight: "4px" }}>
            Category:
          </span>
          {[
            { key: "ALL", label: `All (${subjects.length})` },
            { key: "ACADEMICS", label: `Academics (${metrics.academics})` },
            { key: "CO_CURRICULAR", label: `Co-Curricular (${metrics.coCurricular})` },
          ].map((cat) => {
            const active = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                style={{
                  padding: "0.25rem 0.65rem",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  borderRadius: "6px",
                  border: active ? "1px solid #0f172a" : "1px solid #e2e8f0",
                  background: active ? "#0f172a" : "#f8fafc",
                  color: active ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Subjects Table Viewport */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          borderRadius: "10px",
          overflow: "auto",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <RefreshCw size={18} className="animate-spin" style={{ marginRight: "8px" }} />
            Loading subjects...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              padding: "2rem",
              color: "#64748b",
            }}
          >
            <BookOpen size={36} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: "8px" }} />
            <p style={{ fontWeight: "700", fontSize: "14px", margin: 0 }}>
              No subjects found matching "{searchQuery}"
            </p>
            <p style={{ fontSize: "12px", margin: "4px 0 12px 0" }}>
              Add a new subject to populate the curriculum
            </p>
            <button onClick={handleOpenAdd} className="btn btn-primary" style={{ fontSize: "12px" }}>
              <Plus size={14} /> Add First Subject
            </button>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "12px",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#f8fafc",
                zIndex: 10,
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <tr style={{ borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "0.6rem 0.85rem", fontWeight: "800", color: "#334155", width: "40px" }}>
                  #
                </th>
                <th style={{ padding: "0.6rem 0.85rem", fontWeight: "800", color: "#334155", width: "220px" }}>
                  Subject Name
                </th>
                <th style={{ padding: "0.6rem 0.85rem", fontWeight: "800", color: "#334155", width: "130px" }}>
                  Category
                </th>
                <th style={{ padding: "0.6rem 0.85rem", fontWeight: "800", color: "#334155", width: "130px" }}>
                  Weekly Quota
                </th>
                <th style={{ padding: "0.6rem 0.85rem", fontWeight: "800", color: "#334155" }}>
                  Allocated Classes
                </th>
                <th
                  style={{
                    padding: "0.6rem 0.85rem",
                    fontWeight: "800",
                    color: "#334155",
                    width: "110px",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((sub, idx) => {
                const coCurr = sub.category === "co_curricular";
                const assignedClassObjs = (sub.classIds || [])
                  .map((cId) => classes.find((c) => c.id === cId))
                  .filter(Boolean);

                return (
                  <tr
                    key={sub.id}
                    className="table-row-hover"
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.12s ease",
                    }}
                  >
                    {/* Index */}
                    <td style={{ padding: "0.55rem 0.85rem", color: "#94a3b8", fontWeight: "600" }}>
                      {idx + 1}
                    </td>

                    {/* Subject Name */}
                    <td style={{ padding: "0.55rem 0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: coCurr ? "#f0fdf4" : "#faf5ff",
                            color: coCurr ? "#16a34a" : "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "11px",
                            flexShrink: 0,
                          }}
                        >
                          {sub.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "13px" }}>
                            {sub.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td style={{ padding: "0.55rem 0.85rem" }}>
                      {coCurr ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#dcfce7",
                            color: "#166534",
                            padding: "0.18rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          <Sparkles size={11} /> Co-Curricular
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#f3e8ff",
                            color: "#6b21a8",
                            padding: "0.18rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          <BookOpen size={11} /> Academic Core
                        </span>
                      )}
                    </td>

                    {/* DM Weekly Quota */}
                    <td style={{ padding: "0.55rem 0.85rem" }}>
                      {sub.weeklyQuota !== undefined && sub.weeklyQuota !== null ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            padding: "0.18rem 0.55rem",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "800",
                          }}
                        >
                          {sub.weeklyQuota} / wk
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
                          Not Set
                        </span>
                      )}
                    </td>

                    {/* Allocated Classes Chips */}
                    <td style={{ padding: "0.55rem 0.85rem" }}>
                      {assignedClassObjs.length === 0 ? (
                        <span style={{ color: "#94a3b8", fontSize: "11px", fontStyle: "italic" }}>
                          No classes mapped
                        </span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {assignedClassObjs.slice(0, 8).map((c) => (
                            <span
                              key={c.id}
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                fontSize: "10.5px",
                                fontWeight: "700",
                                padding: "0.12rem 0.45rem",
                                borderRadius: "4px",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {c.name}
                              {c.section ? `-${c.section}` : ""}
                            </span>
                          ))}
                          {assignedClassObjs.length > 8 && (
                            <span
                              style={{
                                background: "#e2e8f0",
                                color: "#475569",
                                fontSize: "10px",
                                fontWeight: "700",
                                padding: "0.12rem 0.4rem",
                                borderRadius: "4px",
                              }}
                            >
                              +{assignedClassObjs.length - 8} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "0.55rem 0.85rem", textAlign: "right" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="btn"
                          title="Edit subject"
                          style={{
                            width: "30px",
                            height: "30px",
                            padding: 0,
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            color: "#1e293b",
                            background: "#ffffff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f1f5f9";
                            e.currentTarget.style.borderColor = "#94a3b8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(sub.id)}
                          className="btn"
                          title="Delete subject"
                          style={{
                            width: "30px",
                            height: "30px",
                            padding: 0,
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            background: "#fff5f5",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 2px rgba(220, 38, 38, 0.08)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                            e.currentTarget.style.borderColor = "#f87171";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff5f5";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD / EDIT SUBJECT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel animate-scale-up"
            style={{
              width: "100%",
              maxWidth: "540px",
              background: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={18} color="#ea580c" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                  {editingSubject ? "Edit Subject" : "Create New Subject"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSubject} style={{ padding: "1.25rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#475569",
                    marginBottom: "4px",
                  }}
                >
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science, Mathematics, Art, Physical Education"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                  }}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    border: "1.5px solid #cbd5e1",
                    outline: "none",
                  }}
                  autoFocus
                />
              </div>

              {/* Explicit Category Selector */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#475569",
                    marginBottom: "6px",
                  }}
                >
                  Curriculum Category *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div
                    onClick={() => setFormData({ ...formData, category: "academics" })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border:
                        formData.category === "academics"
                          ? "2px solid #7c3aed"
                          : "1.5px solid #e2e8f0",
                      background: formData.category === "academics" ? "#faf5ff" : "#ffffff",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="subjectCategory"
                      checked={formData.category === "academics"}
                      onChange={() => setFormData({ ...formData, category: "academics" })}
                      style={{ accentColor: "#7c3aed", cursor: "pointer" }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "800",
                          color: "#6b21a8",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <BookOpen size={12} /> Academic Core
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Eng, Maths, Sci, S.St, Languages
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, category: "co_curricular" })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border:
                        formData.category === "co_curricular"
                          ? "2px solid #16a34a"
                          : "1.5px solid #e2e8f0",
                      background: formData.category === "co_curricular" ? "#f0fdf4" : "#ffffff",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="subjectCategory"
                      checked={formData.category === "co_curricular"}
                      onChange={() => setFormData({ ...formData, category: "co_curricular" })}
                      style={{ accentColor: "#16a34a", cursor: "pointer" }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "800",
                          color: "#166534",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Sparkles size={12} /> Co-Curricular
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Art, PT, Music, Chess, Activities
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DM Directive: Weekly Period Quota */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#475569",
                    marginBottom: "4px",
                  }}
                >
                  Weekly Period Quota (Validation Limit)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    placeholder="e.g. 6 (leave blank if unprescribed)"
                    value={formData.weeklyQuota !== undefined && formData.weeklyQuota !== null ? formData.weeklyQuota : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        weeklyQuota: val === "" ? "" : parseInt(val, 10),
                      }));
                    }}
                    style={{
                      width: "140px",
                      padding: "0.45rem 0.65rem",
                      fontSize: "13px",
                      fontWeight: "700",
                      borderRadius: "6px",
                      border: "1.5px solid #cbd5e1",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                    periods per week / class
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "10.5px", color: "#64748b" }}>
                  Specify the maximum allowed weekly periods for this subject. Used by Timetable validation engine.
                </p>
              </div>

              {/* Class Allocations Section */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#475569",
                    }}
                  >
                    Allocated Classes ({formData.classIds.length} selected)
                  </label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      All
                    </button>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <button
                      type="button"
                      onClick={handleSelectPrimary}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Primary 1-5
                    </button>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <button
                      type="button"
                      onClick={handleSelectSecondary}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Secondary 6-10
                    </button>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <button
                      type="button"
                      onClick={handleClearAllClasses}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
                    gap: "6px",
                  }}
                >
                  {sortedClasses.map((cls) => {
                    const isChecked = formData.classIds.includes(cls.id);
                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleToggleClass(cls.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          background: isChecked ? "#dcfce7" : "#ffffff",
                          border: isChecked ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                          cursor: "pointer",
                          userSelect: "none",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          color: isChecked ? "#166534" : "#334155",
                          transition: "all 0.12s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          style={{ cursor: "pointer", accentColor: "#16a34a" }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cls.name}
                          {cls.section ? `-${cls.section}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                  style={{ padding: "0.45rem 1rem", fontSize: "12px", fontWeight: "700" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    padding: "0.45rem 1.25rem",
                    fontSize: "12px",
                    fontWeight: "800",
                    background: "#16a34a",
                    borderColor: "#15803d",
                  }}
                >
                  {saving ? "Saving..." : editingSubject ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel animate-scale-up"
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "1.25rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
              }}
            >
              <AlertCircle size={24} />
            </div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
              Delete Subject?
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 16px 0" }}>
              Are you sure you want to remove this subject? This will also remove its class associations.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "12px", fontWeight: "700" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn"
                style={{
                  padding: "0.4rem 1.15rem",
                  fontSize: "12px",
                  fontWeight: "800",
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagerModule;
