import React, { useState } from "react";
import { Search, Eye, AlertCircle, Award } from "lucide-react";

export default function ScoreMatrixTable({
  parameters = [],
  rows = [],
  onScoreChange,
  onViewScorecard,
  onSelectTeacherAnalytics,
  selectedMonth
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter rows based on search
  const filteredRows = rows.filter((row) =>
    (row.teacher_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper for dynamic score styling
  const getScoreInputClass = (cellVal, isNa) => {
    if (isNa) return "score-val-na";
    if (cellVal === null || cellVal === undefined || cellVal === "") return "score-val-empty";
    const num = Number(cellVal);
    if (num >= 3) return "score-val-3";
    if (num === 2) return "score-val-2";
    if (num === 1) return "score-val-1";
    if (num === 0) return "score-val-0";
    return "";
  };

  return (
    <div className="matrix-container">
      {/* Matrix Toolbar */}
      <div className="matrix-toolbar">
        {/* Search Input */}
        <div className="search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search teacher by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="toolbar-stats">
          <div>
            Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> Teachers
          </div>
          <div>
            Active Criteria: <strong>{parameters.length}</strong>
          </div>
          <div>
            Month: <strong style={{ color: "var(--accent-primary)" }}>{selectedMonth}</strong>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table Scroll Container */}
      <div className="table-scroll-wrapper">
        <table className="matrix-table">
          <thead>
            {/* Top row with column numbers matching Screenshot 1 */}
            <tr className="row-thead-numbers">
              <th className="sticky-col-1 th-num">Sr.no</th>
              <th className="sticky-col-2 th-num">TEACHERS NAME</th>
              {parameters.map((param, index) => (
                <th key={param.id} className="th-num" title={param.title}>
                  {index + 1}
                </th>
              ))}
              {/* Pinned Right Summary Columns */}
              <th className="col-sticky-out-of th-num">{parameters.length + 1}</th>
              <th className="col-sticky-total th-num">{parameters.length + 2}</th>
              <th className="col-sticky-pct th-num">{parameters.length + 3}</th>
              <th className="col-sticky-rank th-num">{parameters.length + 4}</th>
              <th className="col-sticky-actions th-num">Action</th>
            </tr>

            {/* Criteria Title Row */}
            <tr className="row-thead-titles">
              <th className="sticky-col-1">#</th>
              <th className="sticky-col-2">Teacher Details</th>
              {parameters.map((param) => (
                <th
                  key={param.id}
                  className="th-criteria"
                  title={`${param.title} (Min: ${param.min_points}, Max: ${param.max_points})`}
                >
                  <div className="criteria-header-title">{param.title}</div>
                  <div className="criteria-header-limit">
                    [{param.min_points}-{param.max_points}]
                  </div>
                </th>
              ))}
              {/* Pinned Right Summary Headers */}
              <th className="col-sticky-out-of">Out of</th>
              <th className="col-sticky-total">Total</th>
              <th className="col-sticky-pct">Percentage</th>
              <th className="col-sticky-rank">Rank</th>
              <th className="col-sticky-actions">Score Card</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={parameters.length + 7}
                  style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}
                >
                  <AlertCircle size={28} style={{ margin: "0 auto 0.5rem auto", display: "block" }} />
                  No teachers found matching your search.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const isRank1 = row.rank === 1;
                const isRank2 = row.rank === 2;
                const isRank3 = row.rank === 3;

                return (
                  <tr key={row.teacher_id}>
                    {/* Col 1: Sr. No (Sticky Left) */}
                    <td className="sticky-col-1" style={{ fontWeight: 800, color: "var(--text-secondary)" }}>
                      {index + 1}
                    </td>

                    {/* Col 2: Teacher Name (Sticky Left) */}
                    <td className="sticky-col-2">
                      <div className="teacher-col-info">
                        <div className="teacher-avatar-sm">
                          {row.avatar_url ? (
                            <img src={row.avatar_url} alt={row.teacher_name} />
                          ) : (
                            row.teacher_name.charAt(0)
                          )}
                        </div>
                        <span
                          className="teacher-name-txt teacher-name-clickable"
                          title={`Click to view historical analytics for ${row.teacher_name}`}
                          onClick={() => onSelectTeacherAnalytics && onSelectTeacherAnalytics(row.teacher_id)}
                        >
                          {row.teacher_name}
                        </span>
                      </div>
                    </td>

                    {/* Middle Scrollable Criteria Columns */}
                    {parameters.map((param) => {
                      const cell = row.scores ? row.scores[param.id] : null;
                      const isNa = cell && (cell.is_na === true || cell === "NA");
                      const rawScore =
                        cell && typeof cell === "object"
                          ? isNa
                            ? "NA"
                            : cell.score !== null && cell.score !== undefined
                            ? cell.score
                            : ""
                          : cell !== null && cell !== undefined
                          ? String(cell)
                          : "";

                      const scoreClass = getScoreInputClass(rawScore, isNa);

                      return (
                        <td key={param.id}>
                          <div className="score-cell">
                            <input
                              type="text"
                              className={`score-input ${scoreClass}`}
                              value={rawScore}
                              placeholder="-"
                              title={`Max: ${param.max_points}, Min: ${param.min_points} | Type number or NA`}
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                if (val.toUpperCase() === "NA") {
                                  onScoreChange(row.teacher_id, param.id, "NA");
                                } else if (val === "" || val === "-") {
                                  onScoreChange(row.teacher_id, param.id, null);
                                } else {
                                  const num = Number(val);
                                  if (!isNaN(num)) {
                                    onScoreChange(row.teacher_id, param.id, num);
                                  }
                                }
                              }}
                            />
                            {/* Quick NA toggle badge on hover */}
                            <button
                              type="button"
                              className="na-toggle-btn"
                              title="Toggle NA (Not Applicable)"
                              onClick={() => {
                                onScoreChange(row.teacher_id, param.id, isNa ? null : "NA");
                              }}
                            >
                              NA
                            </button>
                          </div>
                        </td>
                      );
                    })}

                    {/* Col 25: Out of (Pinned Right) */}
                    <td className="col-sticky-out-of">
                      {row.out_of > 0 ? row.out_of : "-"}
                    </td>

                    {/* Col 26: Total (Pinned Right) */}
                    <td className="col-sticky-total">
                      {row.out_of > 0 ? row.total : "-"}
                    </td>

                    {/* Col 27: Percentage (Pinned Right) */}
                    <td className="col-sticky-pct">
                      {row.out_of > 0 ? `${row.percentage}%` : "-"}
                    </td>

                    {/* Col 28: Rank (Pinned Right) */}
                    <td className="col-sticky-rank">
                      {row.rank ? (
                        <span
                          className={`rank-badge ${
                            isRank1
                              ? "rank-gold"
                              : isRank2
                              ? "rank-silver"
                              : isRank3
                              ? "rank-bronze"
                              : "rank-other"
                          }`}
                        >
                          {isRank1 && <Award size={12} />}
                          <span>{row.rank}</span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Actions: View Scorecard (Pinned Right) */}
                    <td className="col-sticky-actions">
                      <button
                        onClick={() => onViewScorecard(row.teacher_id)}
                        className="btn btn-secondary btn-icon"
                        title="View / Print Score Card"
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                          margin: "0 auto",
                          borderRadius: "4px"
                        }}
                      >
                        <Eye size={13} color="var(--accent-primary)" />
                        <span>Card</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
