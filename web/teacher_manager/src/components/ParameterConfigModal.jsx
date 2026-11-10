import React, { useState } from "react";
import { X, Plus, Trash2, Edit2, Check, AlertCircle } from "lucide-react";
import {
  createParameter,
  updateParameter,
  deleteParameter
} from "../services/api.js";

export default function ParameterConfigModal({
  isOpen,
  onClose,
  parameters,
  academicYear,
  onParametersUpdated
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMin, setNewMin] = useState(0);
  const [newMax, setNewMax] = useState(3);
  const [newOrder, setNewOrder] = useState(parameters.length + 1);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handle start inline edit
  const handleStartEdit = (param) => {
    setEditingId(param.id);
    setEditForm({
      title: param.title,
      min_points: param.min_points,
      max_points: param.max_points,
      display_order: param.display_order
    });
    setErrorMsg("");
  };

  // Handle save inline edit
  const handleSaveEdit = async (id) => {
    if (Number(editForm.min_points) > Number(editForm.max_points)) {
      setErrorMsg("Min score cannot be greater than Max score");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await updateParameter(id, editForm);
      setEditingId(null);
      onParametersUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update parameter");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add New Parameter
  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg("Criterion title is required");
      return;
    }
    if (Number(newMin) > Number(newMax)) {
      setErrorMsg("Min score cannot be greater than Max score");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await createParameter({
        title: newTitle.trim(),
        min_points: Number(newMin),
        max_points: Number(newMax),
        display_order: Number(newOrder),
        academic_year: academicYear
      });
      setNewTitle("");
      setNewMin(0);
      setNewMax(3);
      setNewOrder(parameters.length + 2);
      setIsAdding(false);
      onParametersUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create parameter");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Parameter
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove scoring criterion: "${title}"?`)) {
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await deleteParameter(id);
      onParametersUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to delete parameter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "800px" }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>Scoring Criteria & Bounds Configuration</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Configure evaluation topics, minimum, and maximum scoring limits for {academicYear}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {errorMsg && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.825rem",
                fontWeight: 600
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Add New Criterion Section */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "1.25rem"
            }}
          >
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Plus size={16} />
                <span>Add New Scoring Parameter</span>
              </button>
            ) : (
              <form onSubmit={handleAddNew}>
                <div style={{ fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-primary)" }}>
                  Add New Evaluation Parameter
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 80px auto",
                    gap: "0.6rem",
                    alignItems: "end"
                  }}
                >
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Criterion / Topic Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Student Project Review"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        marginTop: "2px"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Min Score
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newMin}
                      onChange={(e) => setNewMin(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        marginTop: "2px",
                        textAlign: "center"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Max Score
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newMax}
                      onChange={(e) => setNewMax(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        marginTop: "2px",
                        textAlign: "center"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      Order #
                    </label>
                    <input
                      type="number"
                      value={newOrder}
                      onChange={(e) => setNewOrder(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        marginTop: "2px",
                        textAlign: "center"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* List of Existing Parameters */}
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.6rem" }}>
            Active Scoring Parameters ({parameters.length})
          </div>

          <div
            style={{
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.75rem", width: "40px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Criterion Title</th>
                  <th style={{ padding: "0.6rem 0.75rem", width: "90px", textAlign: "center" }}>Min Pts</th>
                  <th style={{ padding: "0.6rem 0.75rem", width: "90px", textAlign: "center" }}>Max Pts</th>
                  <th style={{ padding: "0.6rem 0.75rem", width: "70px", textAlign: "center" }}>Order</th>
                  <th style={{ padding: "0.6rem 0.75rem", width: "90px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param, index) => {
                  const isEditing = editingId === param.id;

                  return (
                    <tr
                      key={param.id}
                      style={{
                        borderBottom: "1px solid var(--border-light)",
                        background: isEditing ? "#eff6ff" : index % 2 === 0 ? "#ffffff" : "#fcfcfd"
                      }}
                    >
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>
                        {index + 1}
                      </td>

                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.3rem 0.5rem",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "4px"
                            }}
                          />
                        ) : (
                          param.title
                        )}
                      </td>

                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={editForm.min_points}
                            onChange={(e) => setEditForm({ ...editForm, min_points: e.target.value })}
                            style={{
                              width: "60px",
                              padding: "0.3rem",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "4px",
                              textAlign: "center"
                            }}
                          />
                        ) : (
                          <span className="badge badge-na">{param.min_points}</span>
                        )}
                      </td>

                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={editForm.max_points}
                            onChange={(e) => setEditForm({ ...editForm, max_points: e.target.value })}
                            style={{
                              width: "60px",
                              padding: "0.3rem",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "4px",
                              textAlign: "center"
                            }}
                          />
                        ) : (
                          <span
                            className="badge"
                            style={{ background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }}
                          >
                            {param.max_points}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.display_order}
                            onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value })}
                            style={{
                              width: "50px",
                              padding: "0.3rem",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "4px",
                              textAlign: "center"
                            }}
                          />
                        ) : (
                          param.display_order
                        )}
                      </td>

                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                            <button
                              onClick={() => handleSaveEdit(param.id)}
                              disabled={loading}
                              className="btn btn-primary btn-icon"
                              title="Save"
                              style={{ padding: "3px 6px" }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-secondary btn-icon"
                              title="Cancel"
                              style={{ padding: "3px 6px" }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                            <button
                              onClick={() => handleStartEdit(param)}
                              className="btn btn-secondary btn-icon"
                              title="Edit"
                              style={{ padding: "3px 6px" }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(param.id, param.title)}
                              className="btn btn-danger btn-icon"
                              title="Delete"
                              style={{ padding: "3px 6px" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
