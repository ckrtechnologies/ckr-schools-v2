import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  FileCheck,
  Calendar,
  RotateCcw,
  Eye,
  FileEdit,
  Download,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  User,
  Hash
} from "lucide-react";
import { fetchRecords, fetchClasses, fetchTCById } from "../services/tcApi.js";
import { formatDateDisplay } from "../utils/numberToWords.js";
import CustomDropdown from "../components/CustomDropdown.jsx";
import UserAvatar from "../components/UserAvatar.jsx";

export default function TCHistoryPage({ onSelectRecord, onBackToEditor }) {
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadClasses();
    loadRecords();
  }, []);

  async function loadClasses() {
    try {
      const data = await fetchClasses();
      setClasses(data);
    } catch (err) {
      console.warn("Failed to load classes:", err);
    }
  }

  async function loadRecords(customParams = null) {
    setLoading(true);
    try {
      const params = customParams || {
        search: search.trim() || undefined,
        classId: selectedClassId || undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 150
      };

      const data = await fetchRecords(params);
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to load TC records:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    loadRecords();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedClassId("");
    setSelectedStatus("ALL");
    setFromDate("");
    setToDate("");
    loadRecords({ limit: 150 });
  };

  // Export records to CSV
  const handleExportCSV = () => {
    if (records.length === 0) return alert("No records available to export.");

    const headers = [
      "S.No",
      "TC Number",
      "Admission No",
      "Pupil Name",
      "Class",
      "Father Name",
      "Mother Name",
      "Birth Place",
      "Issue Date",
      "Status",
      "Reason for Leaving"
    ];

    const rows = records.map((r, i) => [
      i + 1,
      r.tc_number || "",
      r.admission_no || r.student?.admission_number || "",
      `"${(r.pupil_name || "").replace(/"/g, '""')}"`,
      r.class ? `${r.class.name} - ${r.class.section}` : r.last_studied_class_figure || "",
      `"${(r.father_name || "").replace(/"/g, '""')}"`,
      `"${(r.mother_name || "").replace(/"/g, '""')}"`,
      `"${(r.birth_place || "").replace(/"/g, '""')}"`,
      r.issue_date || "",
      r.status || "ISSUED",
      `"${(r.reason_leaving || r.reason_for_leaving || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `TC_Register_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tc-history-page">
      {/* Page Title & Stats Header */}
      <div className="page-header-card card-glass">
        <div className="header-left">
          <div className="header-icon-badge">
            <FileCheck size={24} className="icon-brand" />
          </div>
          <div>
            <div className="breadcrumbs">
              <span onClick={onBackToEditor} className="breadcrumb-link">
                Issue Certificate
              </span>
              <ChevronRight size={14} className="breadcrumb-arrow" />
              <span className="breadcrumb-active">TC History & Records</span>
            </div>
            <h2 className="page-title">Transfer Certificate Register & History</h2>
            <p className="page-subtitle">
              Comprehensive official register of all issued, generated, and archived Transfer Certificates
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Export filtered records as CSV"
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadRecords()}
            title="Refresh records list"
          >
            <RotateCcw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onBackToEditor}
          >
            <span>+ Issue New Certificate</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="filter-panel-card card-glass">
        <div className="filter-panel-title">
          <Filter size={16} className="icon-brand" />
          <span>Filter & Search Register</span>
        </div>

        <form onSubmit={handleApplyFilters} className="filter-grid">
          {/* Search Query */}
          <div className="filter-item search-filter">
            <label className="filter-label">Search Query</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by student name, TC serial no, adm no, father name..."
                className="input-field filter-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Class Dropdown */}
          <div className="filter-item">
            <label className="filter-label">Class / Grade</label>
            <CustomDropdown
              value={selectedClassId}
              options={[
                { value: "", label: "All Classes" },
                ...classes.map((cls) => ({
                  value: cls.id,
                  label: `${cls.name}${cls.section ? ` — ${cls.section}` : ""}`
                }))
              ]}
              onChange={(val) => setSelectedClassId(val)}
              placeholder="All Classes"
            />
          </div>

          {/* Status Dropdown */}
          <div className="filter-item">
            <label className="filter-label">Status</label>
            <CustomDropdown
              value={selectedStatus}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ISSUED", label: "ISSUED" },
                { value: "DRAFT", label: "DRAFT" },
                { value: "CANCELLED", label: "CANCELLED" }
              ]}
              onChange={(val) => setSelectedStatus(val)}
              placeholder="All Statuses"
            />
          </div>

          {/* Date From */}
          <div className="filter-item date-filter">
            <label className="filter-label">From Issue Date</label>
            <input
              type="date"
              className="input-field"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="filter-item date-filter">
            <label className="filter-label">To Issue Date</label>
            <input
              type="date"
              className="input-field"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Filter Action Buttons */}
          <div className="filter-actions-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              <Search size={15} />
              <span>Apply Filters</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* Records Table Section */}
      <div className="table-card card-glass">
        <div className="table-header-bar">
          <div className="table-count-info">
            <span className="count-label">Certificates Found:</span>
            <span className="count-badge">{records.length}</span>
            {(selectedClassId || selectedStatus !== "ALL" || search || fromDate || toDate) && (
              <span className="filter-active-pill">Filters Active</span>
            )}
          </div>
        </div>

        <div className="table-responsive-wrapper">
          {loading ? (
            <div className="table-loading-state">
              <RotateCcw size={24} className="spin icon-brand mb-2" />
              <p>Loading certificate records from database...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="table-empty-state">
              <FileCheck size={48} className="icon-brand-muted" />
              <h3>No Transfer Certificates Found</h3>
              <p>
                No records matched your search filters. Try adjusting your search query, class, or date range.
              </p>
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={handleResetFilters}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <table className="history-full-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>S.No</th>
                  <th>TC Number</th>
                  <th>Admission No</th>
                  <th>Student Name (Pupil)</th>
                  <th>Class</th>
                  <th>Father's Name</th>
                  <th>Place of Birth</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => (
                  <tr key={rec.id} className="history-row">
                    <td className="serial-col">{idx + 1}</td>
                    <td>
                      <span className="tc-badge-mono">{rec.tc_number}</span>
                    </td>
                    <td>
                      <span className="adm-badge">{rec.admission_no || rec.student?.admission_number || "—"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <UserAvatar src={rec.student?.avatar_url} name={rec.pupil_name} size={28} />
                        <strong className="pupil-name-text">{rec.pupil_name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="class-pill">
                        {rec.class
                          ? `${rec.class.name} ${rec.class.section ? "- " + rec.class.section : ""}`
                          : rec.last_studied_class_figure || "—"}
                      </span>
                    </td>
                    <td>{rec.father_name || "—"}</td>
                    <td>
                      <span className="birthplace-cell">
                        {rec.birth_place || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="date-cell">
                        {formatDateDisplay(rec.issue_date)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          rec.status === "DRAFT" ? "status-draft" : "status-issued"
                        }`}
                      >
                        {rec.status || "ISSUED"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row-actions-group">
                        <button
                          type="button"
                          className="btn-action-primary"
                          onClick={() => onSelectRecord(rec, "certificate_only")}
                          title="Open full A4 certificate view ready for printing"
                        >
                          <Eye size={14} />
                          <span>View & Print</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-secondary"
                          onClick={() => onSelectRecord(rec, "split")}
                          title="Open in form editor to modify remarks or details"
                        >
                          <FileEdit size={14} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
