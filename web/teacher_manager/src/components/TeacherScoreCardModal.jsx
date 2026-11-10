import React, { useRef } from "react";
import { X, Printer, User } from "lucide-react";

export default function TeacherScoreCardModal({
  isOpen,
  onClose,
  scorecardData,
  loading
}) {
  const printRef = useRef(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const { teacher, header, topics = [], summary } = scorecardData || {};

  return (
    <div className="scorecard-modal-backdrop print-active">
      <div className="scorecard-container">
        {/* Top Control Bar (Hidden on print) */}
        <div className="scorecard-actions-bar no-print">
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
            Teacher Monthly Score Board Preview
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handlePrint}
              disabled={loading || !scorecardData}
              className="btn btn-primary"
            >
              <Printer size={16} />
              <span>Print Score Board</span>
            </button>
            <button onClick={onClose} className="btn btn-secondary btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="scorecard-scroll-area">
          {loading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              Loading teacher scorecard...
            </div>
          ) : !scorecardData ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#ef4444" }}>
              Unable to load scorecard details.
            </div>
          ) : (
            <div ref={printRef} className="scorecard-wrapper" id="printable-scorecard">
              {/* Single Unified Excel Grid Table matching Screenshot 2 */}
              <table className="excel-scorecard-table">
                <colgroup>
                  <col style={{ width: "75px" }} />
                  <col style={{ width: "auto" }} />
                  <col style={{ width: "95px" }} />
                </colgroup>

                <thead>
                  {/* Row 1: School Name + Logo */}
                  <tr className="row-school-title">
                    <th colSpan={3}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                        <img
                          src="/thearcschoollogo.jpeg"
                          alt="Vision International School"
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid #14532d",
                            background: "#ffffff"
                          }}
                          onError={(e) => {
                            e.target.src = "/school_logo.png";
                          }}
                        />
                        <span>{header?.school_name || "VISION INTERNATIONAL SCHOOL, SHIRUR"}</span>
                      </div>
                    </th>
                  </tr>

                  {/* Row 2: Subtitle */}
                  <tr className="row-school-subtitle">
                    <th colSpan={3}>
                      {header?.sub_title || "Monthly Score Board (2026-27)"}
                    </th>
                  </tr>

                  {/* Row 3: Teacher Name + Photo */}
                  <tr className="row-teacher-info">
                    <td className="cell-meta-label">Teacher Name:</td>
                    <td className="cell-teacher-name">
                      {teacher?.name || "-"}
                    </td>
                    <td rowSpan={2} className="cell-teacher-photo">
                      {teacher?.avatar_url ? (
                        <img
                          src={teacher.avatar_url}
                          alt={teacher.name}
                          className="photo-img"
                        />
                      ) : (
                        <div className="photo-placeholder">
                          <User size={22} style={{ margin: "0 auto 2px auto", display: "block" }} />
                          <span>Photo</span>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Row 4: Month (Roll number permanently removed as requested) */}
                  <tr className="row-month-info">
                    <td className="cell-meta-label">Month:</td>
                    <td className="cell-month-val">
                      {header?.month || "August"}
                    </td>
                  </tr>

                  {/* Row 5: Column Headers */}
                  <tr className="row-table-headers">
                    <th className="th-sr-no">Sr. No.</th>
                    <th className="th-topic">Topic</th>
                    <th className="th-points">Points</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Topics rows (with pale olive/sage-green background like Excel) */}
                  {topics.map((t, idx) => (
                    <tr key={t.parameter_id || idx} className="row-topic-item">
                      <td className="td-sr-no">{t.sr_no || idx + 1}</td>
                      <td className="td-topic-title">{t.topic}</td>
                      <td className="td-points-val">
                        {t.points !== null && t.points !== undefined && t.points !== ""
                          ? t.points
                          : "-"}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Row 1: Total */}
                  <tr className="row-summary row-sum-total">
                    <td colSpan={2} className="cell-summary-label">
                      Total
                    </td>
                    <td className="cell-summary-val">{summary?.total ?? 0}</td>
                  </tr>

                  {/* Summary Row 2: Out of */}
                  <tr className="row-summary row-sum-out-of">
                    <td colSpan={2} className="cell-summary-label">
                      Out of
                    </td>
                    <td className="cell-summary-val">{summary?.out_of ?? 0}</td>
                  </tr>

                  {/* Summary Row 3: Percentage */}
                  <tr className="row-summary row-sum-pct">
                    <td colSpan={2} className="cell-summary-label">
                      Percentage
                    </td>
                    <td className="cell-summary-val">
                      {summary?.percentage !== undefined ? `${summary.percentage}` : "-"}
                    </td>
                  </tr>

                  {/* Summary Row 4: Rank */}
                  <tr className="row-summary row-sum-rank">
                    <td colSpan={2} className="cell-summary-label">
                      Rank
                    </td>
                    <td className="cell-summary-val">{summary?.rank ?? "-"}</td>
                  </tr>

                  {/* Signature Box Row */}
                  <tr className="row-signatures">
                    <td colSpan={3}>
                      <div className="signatures-inner">
                        <div className="sig-item sig-candidate">Candidate Sign</div>
                        <div className="sig-item sig-principal">Principal Sign</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
