import React, { useState, useMemo } from "react";
import { Eye, Sparkles, Sliders, Check, X, AlertTriangle, Save, Users, HelpCircle } from "lucide-react";
import { toast } from "react-toastify";
import { saveTeacherQuotas } from "../../services/teacherScheduleApi";

const TeacherWorkloadMatrix = ({
  matrixData = [],
  onSelectTeacher,
  weekRange,
  searchQuery = "",
  onRefresh,
}) => {
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [editingQuotas, setEditingQuotas] = useState({});
  const [batchQuotaValue, setBatchQuotaValue] = useState("");
  const [savingQuotas, setSavingQuotas] = useState(false);

  // Quick inline edit state
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineValue, setInlineValue] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);

  const filteredMatrix = useMemo(() => {
    if (!searchQuery.trim()) return matrixData;
    const q = searchQuery.toLowerCase();
    return matrixData.filter((item) => {
      const name = (item.teacher?.name || item.name || "").toLowerCase();
      const email = (item.teacher?.email || item.email || item.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [matrixData, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let configuredCount = 0;
    let fullCount = 0;
    let nearLimitCount = 0;
    let totalScheduled = 0;

    matrixData.forEach((item) => {
      const quota = item.weeklyQuota ?? item.teacher?.weeklyQuota ?? item.quota;
      const total = item.totalPeriods ?? item.weeklyTotal ?? 0;
      totalScheduled += total;

      if (quota !== null && quota !== undefined && Number(quota) > 0) {
        configuredCount++;
        const quotaNum = Number(quota);
        if (total >= quotaNum) fullCount++;
        else if (total + 1 >= quotaNum) nearLimitCount++;
      }
    });

    const unconfiguredCount = matrixData.length - configuredCount;
    return {
      totalTeachers: matrixData.length,
      configuredCount,
      unconfiguredCount,
      fullCount,
      nearLimitCount,
      totalScheduled,
    };
  }, [matrixData]);

  // Open Quotas Configuration Modal
  const handleOpenQuotasModal = () => {
    const current = {};
    matrixData.forEach((m) => {
      const tid = m.teacher?.id || m.id;
      if (tid) {
        const q = m.weeklyQuota ?? m.teacher?.weeklyQuota ?? m.quota;
        current[tid] = q !== undefined && q !== null ? q : "";
      }
    });
    setEditingQuotas(current);
    setIsQuotaModalOpen(true);
  };

  // Batch Apply Value to All Teachers in Modal
  const handleApplyBatchQuota = () => {
    if (!batchQuotaValue || isNaN(Number(batchQuotaValue)) || Number(batchQuotaValue) <= 0) {
      toast.warn("Please enter a valid positive quota number (e.g. 24)");
      return;
    }
    const val = Number(batchQuotaValue);
    setEditingQuotas((prev) => {
      const updated = { ...prev };
      matrixData.forEach((m) => {
        const tid = m.teacher?.id || m.id;
        if (tid) updated[tid] = val;
      });
      return updated;
    });
    toast.info(`Applied quota of ${val} to all teachers`);
  };

  // Save Modal Quotas
  const handleSaveModalQuotas = async () => {
    setSavingQuotas(true);
    try {
      const payload = {};
      Object.entries(editingQuotas).forEach(([tid, q]) => {
        payload[tid] = q !== "" && q !== null && !isNaN(Number(q)) ? Number(q) : null;
      });

      const res = await saveTeacherQuotas(payload);
      if (res.success) {
        toast.success(res.message || "Teacher weekly quotas saved successfully");
        setIsQuotaModalOpen(false);
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message || "Failed to save teacher quotas");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save teacher quotas");
    } finally {
      setSavingQuotas(false);
    }
  };

  // Quick inline save for a single teacher
  const handleSaveInline = async (teacherId) => {
    if (!teacherId) return;
    setInlineSaving(true);
    try {
      const num = inlineValue !== "" && !isNaN(Number(inlineValue)) ? Number(inlineValue) : null;
      const res = await saveTeacherQuotas({ teacherId, quota: num });
      if (res.success) {
        toast.success("Quota updated");
        setInlineEditingId(null);
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message || "Failed to update quota");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update quota");
    } finally {
      setInlineSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", flex: 1, overflow: "hidden" }}>
      {/* Top Controls & Metrics Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "0.5rem 0.75rem",
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={15} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
              Faculty Quotas & Capacity
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: stats.unconfiguredCount > 0 ? "#fffbeb" : "#ecfdf5",
                color: stats.unconfiguredCount > 0 ? "#b45309" : "#047857",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {stats.unconfiguredCount > 0 ? (
                <>
                  <AlertTriangle size={11} /> {stats.unconfiguredCount} Unconfigured Quotas
                </>
              ) : (
                <>
                  <Check size={11} /> 100% Faculty Configured ({stats.configuredCount})
                </>
              )}
            </span>

            {stats.fullCount > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontWeight: "700",
                }}
              >
                {stats.fullCount} at Full Capacity
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleOpenQuotasModal}
          className="btn btn-primary"
          style={{
            fontSize: "11.5px",
            padding: "4px 12px",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          <Sliders size={13} />
          Configure Faculty Quotas
        </button>
      </div>

      {/* Matrix Table */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: "10px",
          background: "#ffffff",
          border: "1px solid var(--glass-border)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                color: "#475569",
                fontWeight: "700",
                textAlign: "left",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <th style={{ padding: "0.6rem 0.85rem" }}>Teacher Name</th>
              <th style={{ padding: "0.6rem 0.85rem" }}>Email / Contact</th>
              <th style={{ padding: "0.6rem 0.85rem", width: "130px" }}>Weekly Quota</th>
              <th style={{ padding: "0.6rem 0.85rem" }}>Scheduled</th>
              <th style={{ padding: "0.6rem 0.85rem", width: "260px" }}>Capacity & Utilization</th>
              <th style={{ padding: "0.6rem 0.85rem", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatrix.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-secondary)" }}>
                  No teachers found
                </td>
              </tr>
            ) : (
              filteredMatrix.map((item, idx) => {
                const tid = item.teacher?.id || item.id;
                const teacherName = item.teacher?.name || item.name || "Faculty Member";
                const teacherEmail = item.teacher?.email || item.email || item.teacher?.phone || item.phone || "-";
                const total = item.totalPeriods ?? item.weeklyTotal ?? 0;
                const quota = item.weeklyQuota ?? item.teacher?.weeklyQuota ?? item.quota;
                const isConfigured = quota !== null && quota !== undefined && Number(quota) > 0;
                const quotaNum = isConfigured ? Number(quota) : 0;
                const remaining = isConfigured ? quotaNum - total : null;

                const percentage = isConfigured && quotaNum > 0
                  ? Math.min(Math.round((total / quotaNum) * 100), 100)
                  : 0;

                const isInline = inlineEditingId === tid;

                // Color coding based on quota status
                let barColor = "var(--accent-primary)";
                let badgeBg = "var(--accent-light)";
                let badgeColor = "var(--accent-primary)";

                if (!isConfigured) {
                  barColor = "#cbd5e1";
                  badgeBg = "#fffbeb";
                  badgeColor = "#b45309";
                } else if (remaining <= 0) {
                  barColor = "#ef4444";
                  badgeBg = "#fef2f2";
                  badgeColor = "#b91c1c";
                } else if (remaining === 1) {
                  barColor = "#f59e0b";
                  badgeBg = "#fffbeb";
                  badgeColor = "#d97706";
                } else {
                  barColor = "#10b981";
                  badgeBg = "#ecfdf5";
                  badgeColor = "#047857";
                }

                return (
                  <tr
                    key={tid || idx}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                    }}
                  >
                    <td style={{ padding: "0.55rem 0.85rem", fontWeight: "700", color: "#1e293b" }}>
                      {teacherName}
                    </td>
                    <td style={{ padding: "0.55rem 0.85rem", color: "var(--text-secondary)" }}>
                      {teacherEmail}
                    </td>

                    {/* Weekly Quota Column with Quick Inline Edit */}
                    <td style={{ padding: "0.55rem 0.85rem" }}>
                      {isInline ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveInline(tid);
                              if (e.key === "Escape") setInlineEditingId(null);
                            }}
                            autoFocus
                            placeholder="e.g. 24"
                            style={{
                              width: "55px",
                              padding: "2px 4px",
                              fontSize: "11.5px",
                              border: "1px solid var(--accent-primary)",
                              borderRadius: "4px",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                          <button
                            onClick={() => handleSaveInline(tid)}
                            disabled={inlineSaving}
                            style={{
                              padding: "2px 5px",
                              background: "var(--accent-primary)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                            title="Save Quota"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            onClick={() => setInlineEditingId(null)}
                            style={{
                              padding: "2px 5px",
                              background: "#e2e8f0",
                              color: "#475569",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                            title="Cancel"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setInlineEditingId(tid);
                            setInlineValue(isConfigured ? String(quotaNum) : "");
                          }}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: isConfigured ? "1px solid #e2e8f0" : "1px dashed #f59e0b",
                            background: isConfigured ? "#f8fafc" : "#fffbeb",
                          }}
                          title="Click to quickly edit quota"
                        >
                          <span
                            style={{
                              fontWeight: "700",
                              fontSize: "11.5px",
                              color: isConfigured ? "#1e293b" : "#b45309",
                            }}
                          >
                            {isConfigured ? `${quotaNum} periods` : "Not Set ⚠️"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Scheduled Periods Count */}
                    <td style={{ padding: "0.55rem 0.85rem", fontWeight: "700" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: badgeBg,
                          color: badgeColor,
                          fontWeight: "800",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {total > 0 ? (
                          <>
                            <Sparkles size={11} />
                            {total} / Wk
                          </>
                        ) : (
                          "0 (Free)"
                        )}
                      </span>
                    </td>

                    {/* Capacity & Headroom Gauge */}
                    <td style={{ padding: "0.55rem 0.85rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#334155" }}>
                            {isConfigured ? `${total} / ${quotaNum} booked` : `${total} booked (No Limit)`}
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: "600", color: badgeColor }}>
                            {isConfigured
                              ? remaining <= 0
                                ? "Quota Full ⚠️"
                                : `${remaining} left`
                              : "No Quota ⚠️"}
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            background: "#e2e8f0",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${isConfigured ? percentage : Math.min(total * 4, 100)}%`,
                              height: "100%",
                              background: barColor,
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "0.55rem 0.85rem", textAlign: "right" }}>
                      <button
                        onClick={() => onSelectTeacher(tid)}
                        className="btn btn-ghost"
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--accent-primary)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={12} /> Inspect Routine
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Configure Faculty Quotas Modal */}
      {isQuotaModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setIsQuotaModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  Faculty Weekly Period Quotas
                </h3>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                  Strict Validation Rule: Teachers cannot be scheduled beyond their weekly quota
                </p>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="btn-ghost"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Batch Set Bar */}
            <div
              style={{
                padding: "0.75rem 1.25rem",
                background: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#334155" }}>
                  Set All Faculty To:
                </span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={batchQuotaValue}
                  onChange={(e) => setBatchQuotaValue(e.target.value)}
                  placeholder="e.g. 24"
                  style={{
                    width: "70px",
                    padding: "3px 6px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    textAlign: "center",
                  }}
                />
                <button
                  onClick={handleApplyBatchQuota}
                  style={{
                    fontSize: "11px",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    background: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Apply to All
                </button>
              </div>

              <input
                type="text"
                placeholder="Search teacher..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                style={{
                  padding: "3px 8px",
                  fontSize: "11.5px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  width: "140px",
                }}
              />
            </div>

            {/* Teacher List Table */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 1.25rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "0.5rem 0", fontWeight: "600" }}>Faculty Member</th>
                    <th style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: "600", width: "120px" }}>
                      Max Periods / Week
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData
                    .filter((m) => {
                      if (!modalSearch.trim()) return true;
                      const q = modalSearch.toLowerCase();
                      const mName = (m.teacher?.name || m.name || "").toLowerCase();
                      const mEmail = (m.teacher?.email || m.email || m.teacher?.phone || m.phone || "").toLowerCase();
                      return mName.includes(q) || mEmail.includes(q);
                    })
                    .map((m) => {
                      const tid = m.teacher?.id || m.id;
                      const mName = m.teacher?.name || m.name || "Faculty Member";
                      const mEmail = m.teacher?.email || m.email || m.teacher?.phone || m.phone || "-";
                      const val = editingQuotas[tid] ?? "";

                      return (
                        <tr key={tid} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.45rem 0" }}>
                            <div style={{ fontWeight: "600", color: "#1e293b" }}>{mName}</div>
                            <div style={{ fontSize: "10.5px", color: "#94a3b8" }}>{mEmail}</div>
                          </td>
                          <td style={{ padding: "0.45rem 0", textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={val}
                              onChange={(e) => {
                                const v = e.target.value;
                                setEditingQuotas((prev) => ({ ...prev, [tid]: v }));
                              }}
                              placeholder="Not set"
                              style={{
                                width: "80px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                textAlign: "center",
                                fontWeight: "700",
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "0.85rem 1.25rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#64748b" }}>
                <HelpCircle size={12} />
                <span>Persisted in DB user table & local cache</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="btn btn-ghost"
                  style={{
                    fontSize: "12px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalQuotas}
                  disabled={savingQuotas}
                  className="btn btn-primary"
                  style={{
                    fontSize: "12px",
                    padding: "5px 14px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <Save size={13} />
                  {savingQuotas ? "Saving..." : "Save Faculty Quotas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWorkloadMatrix;
