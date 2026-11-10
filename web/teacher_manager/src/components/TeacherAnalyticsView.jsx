import React, { useState, useEffect } from "react";
import {
  User,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  FileText,
  Printer,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Search
} from "lucide-react";
import { fetchTeacherAnalytics, fetchTeachersList } from "../services/api.js";
import { exportTeacherAnalyticsToPdf } from "../utils/printPdf.js";
import CustomDropdown from "./CustomDropdown.jsx";
import "../styles/analytics.css";

export default function TeacherAnalyticsView({
  academicYear,
  onViewScorecard,
  initialTeacherId = null
}) {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Load teacher list
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await fetchTeachersList();
        setTeachers(list);
        if (!selectedTeacherId && list.length > 0) {
          setSelectedTeacherId(list[0].id);
        }
      } catch (err) {
        console.error("Error fetching teachers list:", err);
      }
    };
    loadTeachers();
  }, []);

  // Load analytics when teacher or year changes
  useEffect(() => {
    if (!selectedTeacherId) return;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTeacherAnalytics(selectedTeacherId, academicYear);
        setAnalytics(data);
      } catch (err) {
        console.error("Error fetching teacher analytics:", err);
        setError(err.response?.data?.message || "Failed to load teacher analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedTeacherId, academicYear]);

  // Filter teachers for selector
  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const teacherOptions = filteredTeachers.map((t) => ({
    value: t.id,
    label: t.name
  }));

  const handleExportPdf = () => {
    if (!analytics) return;
    exportTeacherAnalyticsToPdf({ analytics });
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="analytics-container">
      {/* Top Controls Bar */}
      <div className="analytics-controls-card">
        <div className="teacher-picker-wrap">
          <div className="picker-label">
            <User size={16} color="var(--accent-primary)" />
            <span>Select Teacher:</span>
          </div>

          <div style={{ flex: 1, maxWidth: "380px" }}>
            <CustomDropdown
              value={selectedTeacherId}
              options={teachers.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(val) => setSelectedTeacherId(val)}
              minWidth="280px"
            />
          </div>
        </div>

        <div className="analytics-actions">
          <button
            onClick={handleExportPdf}
            disabled={!analytics || loading}
            className="btn btn-secondary btn-pdf-export"
            title="Export clean, unclipped, printable PDF report"
          >
            <Printer size={16} color="#be123c" />
            <span>Export Analytics PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="analytics-loading-box">
          <div className="spinner"></div>
          <p>Loading historical records & performance metrics for {selectedTeacher?.name || "teacher"}...</p>
        </div>
      ) : error ? (
        <div className="analytics-error-box">
          <AlertCircle size={28} color="#ef4444" />
          <p>{error}</p>
        </div>
      ) : !analytics ? (
        <div className="analytics-empty-box">Please select a teacher to view historical records.</div>
      ) : (
        <div className="analytics-content">
          {/* Teacher Profile Card */}
          <div className="analytics-profile-card">
            <div className="profile-left">
              <div className="profile-avatar">
                {analytics.teacher.avatar_url ? (
                  <img src={analytics.teacher.avatar_url} alt={analytics.teacher.name} />
                ) : (
                  analytics.teacher.name.charAt(0)
                )}
              </div>
              <div className="profile-details">
                {/* Full, clearly visible teacher name */}
                <h2 className="profile-name">{analytics.teacher.name}</h2>
                <div className="profile-meta">
                  <span>{analytics.teacher.email || "No email"}</span>
                  <span className="dot-divider">•</span>
                  <span>{analytics.teacher.phone || "+91 Mobile"}</span>
                  <span className="dot-divider">•</span>
                  <span className="profile-id-badge">
                    Staff ID: {analytics.teacher.roll_no !== "-" ? analytics.teacher.roll_no : analytics.teacher.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-right">
              <div className="session-tag">Academic Session {analytics.academic_year}</div>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-emerald">
              <div className="kpi-icon-wrap">
                <TrendingUp size={20} />
              </div>
              <div className="kpi-body">
                <span className="kpi-number">{analytics.summary.avg_percentage}%</span>
                <span className="kpi-title">Annual Avg Percentage</span>
              </div>
            </div>

            <div className="kpi-card kpi-indigo">
              <div className="kpi-icon-wrap">
                <BarChart3 size={20} />
              </div>
              <div className="kpi-body">
                <span className="kpi-number">{analytics.summary.avg_score}</span>
                <span className="kpi-title">Annual Avg Score</span>
              </div>
            </div>

            <div className="kpi-card kpi-amber">
              <div className="kpi-icon-wrap">
                <Award size={20} />
              </div>
              <div className="kpi-body">
                <span className="kpi-number">
                  {analytics.summary.best_rank !== "-" ? `#${analytics.summary.best_rank}` : "-"}
                </span>
                <span className="kpi-title">Best School Rank</span>
              </div>
            </div>

            <div className="kpi-card kpi-slate">
              <div className="kpi-icon-wrap">
                <CheckCircle size={20} />
              </div>
              <div className="kpi-body">
                <span className="kpi-number">
                  {analytics.summary.evaluated_months_count} / {analytics.summary.total_months}
                </span>
                <span className="kpi-title">Months Evaluated</span>
              </div>
            </div>
          </div>

          {/* Historical Month-by-Month Records */}
          <div className="analytics-section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <Calendar size={18} color="var(--accent-primary)" />
                <h3>Month-by-Month Evaluation History</h3>
              </div>
              <span className="section-caption">
                Full chronological score record across the academic year
              </span>
            </div>

            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th style={{ width: "45px" }}>#</th>
                    <th>Month</th>
                    <th>Evaluation Status</th>
                    <th>Out of</th>
                    <th>Total Score</th>
                    <th>Percentage</th>
                    <th>School Rank</th>
                    <th style={{ textAlign: "right" }}>Score Card</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthly_history.map((m, idx) => {
                    const isEvaluated = m.has_data;
                    const pctTone =
                      m.percentage >= 80
                        ? "tone-high"
                        : m.percentage >= 60
                        ? "tone-mid"
                        : "tone-low";

                    return (
                      <tr key={m.month} className={isEvaluated ? "row-evaluated" : "row-pending"}>
                        <td className="cell-num">{idx + 1}</td>
                        <td className="cell-month font-bold">{m.month}</td>
                        <td>
                          {isEvaluated ? (
                            <span className="status-badge status-evaluated">
                              <CheckCircle size={12} /> Evaluated
                            </span>
                          ) : (
                            <span className="status-badge status-pending">Pending</span>
                          )}
                        </td>
                        <td className="cell-num font-bold text-rose">
                          {isEvaluated ? m.max_possible : "-"}
                        </td>
                        <td className="cell-num font-bold text-indigo">
                          {isEvaluated ? m.total_score : "-"}
                        </td>
                        <td>
                          {isEvaluated ? (
                            <span className={`pct-badge ${pctTone}`}>{m.percentage}%</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {isEvaluated && m.rank ? (
                            <span className="rank-pill">#{m.rank}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEvaluated ? (
                            <button
                              onClick={() => onViewScorecard(analytics.teacher.id, m.month)}
                              className="btn btn-secondary btn-sm"
                              title={`View ${m.month} Score Card`}
                            >
                              <FileText size={14} color="var(--accent-primary)" />
                              <span>View Card</span>
                              <ChevronRight size={13} />
                            </button>
                          ) : (
                            <span className="text-muted text-xs">No Data</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Criteria Breakdown Across Months */}
          <div className="analytics-section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <BarChart3 size={18} color="var(--accent-primary)" />
                <h3>Criteria Performance Summary</h3>
              </div>
              <span className="section-caption">
                Average points obtained per evaluation parameter
              </span>
            </div>

            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th style={{ width: "45px" }}>#</th>
                    <th>Evaluation Criteria / Topic</th>
                    <th style={{ width: "90px" }}>Score Limit</th>
                    <th style={{ width: "110px" }}>Average Points</th>
                    <th>Performance Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.parameter_performance.map((p, idx) => {
                    const perfPct = p.performance_pct;
                    const barColor =
                      perfPct >= 80 ? "#16a34a" : perfPct >= 60 ? "#d97706" : "#dc2626";

                    return (
                      <tr key={p.parameter_id}>
                        <td className="cell-num">{idx + 1}</td>
                        <td className="font-semibold">{p.title}</td>
                        <td className="cell-num text-muted">
                          [{p.min_points}-{p.max_points}]
                        </td>
                        <td className="cell-num font-bold">{p.avg_points}</td>
                        <td>
                          <div className="perf-bar-wrap">
                            <div className="perf-bar-bg">
                              <div
                                className="perf-bar-fill"
                                style={{
                                  width: `${perfPct}%`,
                                  backgroundColor: barColor
                                }}
                              />
                            </div>
                            <span className="perf-bar-txt" style={{ color: barColor }}>
                              {perfPct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
