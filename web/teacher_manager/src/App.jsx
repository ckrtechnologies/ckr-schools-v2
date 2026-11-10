import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import Navbar from "./components/Navbar.jsx";
import ScoreMatrixTable from "./components/ScoreMatrixTable.jsx";
import TeacherAnalyticsView from "./components/TeacherAnalyticsView.jsx";
import ParameterConfigModal from "./components/ParameterConfigModal.jsx";
import TeacherScoreCardModal from "./components/TeacherScoreCardModal.jsx";
import LoginModal from "./components/LoginModal.jsx";
import {
  fetchMatrix,
  fetchParameters,
  saveBatchEvaluations,
  fetchScorecard,
  getCurrentUser,
  logoutUser
} from "./services/api.js";
import { exportEntireSchoolToPdf } from "./utils/printPdf.js";

import "./styles/app.css";
import "./styles/matrix.css";
import "./styles/scorecard.css";

export default function App() {
  // Auth state
  const [user, setUser] = useState(getCurrentUser());
  const [isLoginOpen, setIsLoginOpen] = useState(!user);

  // View state: 'school' (Entire School) | 'teacher' (Individual Teacher)
  const [activeView, setActiveView] = useState("school");
  const [selectedAnalyticsTeacherId, setSelectedAnalyticsTeacherId] = useState(null);

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState("August");
  const [selectedYear, setSelectedYear] = useState("2026-27");


  // Data state
  const [parameters, setParameters] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals state
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [scorecardData, setScorecardData] = useState(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [loadingScorecard, setLoadingScorecard] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Matrix Data
  const loadMatrixData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMatrix(selectedMonth, selectedYear);
      if (data) {
        setParameters(data.parameters || []);
        setRows(data.rows || []);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Error loading matrix:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUser(null);
        setIsLoginOpen(true);
      } else {
        showToast(err.response?.data?.message || "Failed to load evaluation matrix", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Load parameters
  const loadParametersOnly = async () => {
    try {
      const params = await fetchParameters(selectedYear);
      setParameters(params);
      loadMatrixData();
    } catch (err) {
      console.error("Error refreshing parameters:", err);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadMatrixData();
    }
  }, [user, loadMatrixData]);

  // Handle Score Change with real-time recalculation of Out of, Total, %, Rank
  const handleScoreChange = (teacherId, paramId, rawValue) => {
    setRows((prevRows) => {
      // 1. Update the cell in the matching row
      const updatedRows = prevRows.map((row) => {
        if (row.teacher_id !== teacherId) return row;

        const currentScores = { ...(row.scores || {}) };

        if (rawValue === null || rawValue === undefined || rawValue === "") {
          delete currentScores[paramId];
        } else if (rawValue === "NA") {
          currentScores[paramId] = { score: null, is_na: true };
        } else {
          // Clamp score to param limits
          const param = parameters.find((p) => p.id === paramId);
          const min = param ? param.min_points : 0;
          const max = param ? param.max_points : 3;
          const clamped = Math.max(min, Math.min(max, Number(rawValue)));
          currentScores[paramId] = { score: clamped, is_na: false };
        }

        // Compute local total and out_of for this row
        let total = 0;
        let outOf = 0;

        parameters.forEach((param) => {
          const cell = currentScores[param.id];
          if (cell !== undefined && cell !== null) {
            if (cell === "NA" || cell.is_na === true || cell.score === "NA") {
              // NA does not add to outOf
            } else {
              const num = typeof cell === "object" ? cell.score : Number(cell);
              if (num !== null && !isNaN(num)) {
                total += num;
                outOf += Number(param.max_points);
              }
            }
          }
        });

        const percentage = outOf > 0 ? Number(((total / outOf) * 100).toFixed(2)) : 0;

        return {
          ...row,
          scores: currentScores,
          total: Number(total.toFixed(2)),
          out_of: Number(outOf.toFixed(2)),
          percentage
        };
      });

      // 2. Re-compute Dense Ranks across evaluated teachers (identical % gets identical rank)
      const evaluatedRows = updatedRows.filter((r) => r.out_of > 0);
      evaluatedRows.sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return b.total - a.total;
      });

      const rankMap = {};
      let currentDenseRank = 0;
      let prevPercentage = null;
      evaluatedRows.forEach((r) => {
        if (prevPercentage === null || r.percentage !== prevPercentage) {
          currentDenseRank += 1;
          prevPercentage = r.percentage;
        }
        rankMap[r.teacher_id] = currentDenseRank;
      });

      return updatedRows.map((r) => ({
        ...r,
        rank: rankMap[r.teacher_id] || null
      }));
    });

    setHasUnsavedChanges(true);
  };

  // Batch Save Scores
  const handleSaveScores = async () => {
    setIsSaving(true);
    try {
      const evaluations = rows.map((r) => ({
        teacher_id: r.teacher_id,
        scores: r.scores || {},
        remarks: r.remarks || ""
      }));

      await saveBatchEvaluations({
        month: selectedMonth,
        academic_year: selectedYear,
        evaluations
      });

      setHasUnsavedChanges(false);
      showToast("Evaluation scores & rankings saved successfully!");
      // Reload to ensure perfect server sync
      loadMatrixData();
    } catch (err) {
      console.error("Error saving scores:", err);
      showToast(err.response?.data?.message || "Failed to save evaluation scores", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // View Scorecard (supports viewing from either school matrix or teacher analytics)
  const handleViewScorecard = async (teacherId, targetMonth = selectedMonth) => {
    setIsScorecardOpen(true);
    setLoadingScorecard(true);
    setScorecardData(null);

    try {
      const data = await fetchScorecard(teacherId, targetMonth, selectedYear);
      setScorecardData(data);
    } catch (err) {
      console.error("Error loading scorecard:", err);
      showToast(err.response?.data?.message || "Failed to load scorecard", "error");
    } finally {
      setLoadingScorecard(false);
    }
  };

  // Export Entire School Register to PDF
  const handleExportPdf = () => {
    try {
      exportEntireSchoolToPdf({
        month: selectedMonth,
        academicYear: selectedYear,
        parameters,
        rows
      });
      showToast(`Generated ${selectedMonth} PDF register!`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      showToast("Failed to generate PDF file", "error");
    }
  };

  // Export to Excel (.xlsx) matching Screenshot 1
  const handleExportExcel = () => {
    try {
      // 1. Prepare header row 1 (Numbers)
      const headerRow1 = ["Sr.no", "TEACHERS NAME"];
      parameters.forEach((_, idx) => headerRow1.push(idx + 1));
      const pCount = parameters.length;
      headerRow1.push(pCount + 1, pCount + 2, pCount + 3, pCount + 4);

      // 2. Prepare header row 2 (Criteria Titles)
      const headerRow2 = ["Sr.no", "TEACHERS NAME"];
      parameters.forEach((param) => headerRow2.push(param.title));
      headerRow2.push("Out of", "Total", "Percentage", "Rank");

      // 3. Prepare data rows
      const dataRows = rows.map((r, index) => {
        const rowData = [index + 1, r.teacher_name];

        parameters.forEach((param) => {
          const cell = r.scores ? r.scores[param.id] : null;
          if (cell === "NA" || cell?.is_na) {
            rowData.push("NA");
          } else if (cell?.score !== undefined && cell?.score !== null) {
            rowData.push(cell.score);
          } else if (typeof cell === "number") {
            rowData.push(cell);
          } else {
            rowData.push("-");
          }
        });

        rowData.push(r.out_of > 0 ? r.out_of : "-");
        rowData.push(r.out_of > 0 ? r.total : "-");
        rowData.push(r.out_of > 0 ? `${r.percentage}%` : "-");
        rowData.push(r.rank || "-");

        return rowData;
      });

      // Combine into sheet
      const worksheetData = [
        [`VISION INTERNATIONAL SCHOOL, SHIRUR - Month-${selectedMonth} (${selectedYear})`],
        [],
        headerRow1,
        headerRow2,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `ScoreBoard-${selectedMonth}`);

      XLSX.writeFile(wb, `Vision_Teacher_ScoreBoard_${selectedMonth}_${selectedYear}.xlsx`);
      showToast(`Exported ${selectedMonth} Score Board to Excel!`);
    } catch (err) {
      console.error("Error exporting excel:", err);
      showToast("Failed to generate Excel file", "error");
    }
  };

  // Logout handler
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsLoginOpen(true);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notice ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Solid School Header with month/year filters, save, and actions */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onOpenParameters={() => setIsParamModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onSaveScores={handleSaveScores}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onRefresh={loadMatrixData}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeView === "school" ? (
          loading ? (
            <div
              style={{
                padding: "5rem",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontWeight: 600
              }}
            >
              Loading evaluation register for {selectedMonth} {selectedYear}...
            </div>
          ) : (
            <ScoreMatrixTable
              parameters={parameters}
              rows={rows}
              onScoreChange={handleScoreChange}
              onViewScorecard={handleViewScorecard}
              onSelectTeacherAnalytics={(teacherId) => {
                setSelectedAnalyticsTeacherId(teacherId);
                setActiveView("teacher");
              }}
              selectedMonth={selectedMonth}
            />
          )
        ) : (
          <TeacherAnalyticsView
            academicYear={selectedYear}
            onViewScorecard={(teacherId, month) => handleViewScorecard(teacherId, month)}
            initialTeacherId={selectedAnalyticsTeacherId}
          />
        )}
      </main>

      {/* Parameters Configuration Modal (Criteria, Min, Max) */}
      <ParameterConfigModal
        isOpen={isParamModalOpen}
        onClose={() => setIsParamModalOpen(false)}
        parameters={parameters}
        academicYear={selectedYear}
        onParametersUpdated={loadParametersOnly}
      />

      {/* Printable Individual Score Card Modal */}
      <TeacherScoreCardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        scorecardData={scorecardData}
        loading={loadingScorecard}
      />

      {/* Staff / Teacher Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={(userData) => {
          setUser(userData);
          setIsLoginOpen(false);
          loadMatrixData();
        }}
      />
    </div>
  );
}
