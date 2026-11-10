import React from "react";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getTenantSlug } from "../services/api.js";
import {
  GraduationCap,
  Sliders,
  FileSpreadsheet,
  LogOut,
  User,
  Calendar,
  Save,
  RefreshCw,
  Printer,
  Building2,
  UserCheck
} from "lucide-react";
import CustomDropdown from "./CustomDropdown.jsx";

const MONTHS = [
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May"
];

const ACADEMIC_YEARS = ["2026-27", "2025-26", "2027-28"];

export default function Navbar({
  activeView = "school",
  setActiveView,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onOpenParameters,
  onExportExcel,
  onExportPdf,
  onSaveScores,
  isSaving,
  hasUnsavedChanges,
  onRefresh,
  user,
  onLogout
}) {
  const [profile, setProfile] = React.useState(null);
  React.useEffect(() => {
    fetchSchoolProfile(getTenantSlug()).then((p) => {
      if (p) setProfile(p);
    });
  }, []);

  const schoolName = user?.schoolName || profile?.name || "School Campus";
  const logoUrl = resolveAssetUrl(user?.logoUrl || profile?.logoUrl);

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Left: Brand + Permanently Fixed View Tabs */}
        <div className="header-brand-group">
          <div className="brand-section">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName}
                className="brand-logo-img"
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-color, #064e3b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px" }}>
                {schoolName.charAt(0)}
              </div>
            )}
            <div className="brand-text">
              <h1>{schoolName}</h1>
              <p>Teacher Monthly Score Board &amp; Evaluation Manager</p>
            </div>
          </div>

          <div className="header-nav-divider" />

          {/* View Switcher: 1. Entire School | 2. Individual Teacher (Fixed & Static) */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-tab-btn ${activeView === "school" ? "active" : ""}`}
              onClick={() => setActiveView("school")}
              title="View school-wide monthly score matrix for all teachers"
            >
              <Building2 size={16} />
              <span>1. Entire School</span>
            </button>

            <button
              type="button"
              className={`view-tab-btn ${activeView === "teacher" ? "active" : ""}`}
              onClick={() => setActiveView("teacher")}
              title="View individual teacher historical performance and analytics"
            >
              <UserCheck size={16} />
              <span>2. Individual Teacher</span>
            </button>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="header-actions">
          {/* Custom Month Dropdown (Entire School mode) */}
          {activeView === "school" && (
            <CustomDropdown
              label="Month:"
              icon={Calendar}
              value={selectedMonth}
              options={MONTHS}
              onChange={setSelectedMonth}
              minWidth="165px"
            />
          )}

          {/* Custom Academic Year Dropdown */}
          <CustomDropdown
            label="Year:"
            value={selectedYear}
            options={ACADEMIC_YEARS}
            onChange={setSelectedYear}
            minWidth="130px"
          />

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-icon"
            title="Reload latest data"
          >
            <RefreshCw size={15} />
          </button>

          {/* School-specific actions */}
          {activeView === "school" && (
            <>
              {/* Parameters Config Button */}
              <button
                onClick={onOpenParameters}
                className="btn btn-secondary"
                title="Configure Criteria & Min/Max points"
              >
                <Sliders size={16} />
                <span>Criteria & Limits</span>
              </button>

              {/* Export to Excel */}
              <button
                onClick={onExportExcel}
                className="btn btn-secondary"
                title="Download full register as Excel (.xlsx)"
              >
                <FileSpreadsheet size={16} color="#15803d" />
                <span>Export Excel</span>
              </button>

              {/* Export to PDF */}
              <button
                onClick={onExportPdf}
                className="btn btn-secondary"
                title="Export clean, unclipped, printable PDF register"
                style={{ color: "#be123c", borderColor: "#fecdd3", background: "#fff1f2" }}
              >
                <Printer size={16} color="#be123c" />
                <span style={{ fontWeight: 700 }}>Export PDF</span>
              </button>

              {/* Save Button */}
              <button
                onClick={onSaveScores}
                disabled={isSaving || !hasUnsavedChanges}
                className="btn btn-primary"
                style={{
                  background: hasUnsavedChanges ? "#16a34a" : "var(--accent-primary)",
                  boxShadow: hasUnsavedChanges ? "0 0 10px rgba(22, 163, 74, 0.4)" : "none"
                }}
              >
                <Save size={16} />
                <span>{isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes *" : "Saved"}</span>
              </button>
            </>
          )}

          {/* User / Logout */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)"
                }}
              >
                <User size={15} />
                <span>{user.name || user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-icon"
                title="Logout"
                style={{ color: "#ef4444" }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
