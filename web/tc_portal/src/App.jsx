import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Printer,
  History,
  CheckCircle,
  GraduationCap,
  Sparkles,
  School,
  Lock,
  LogOut,
  User,
  PlusCircle
} from "lucide-react";
import StudentSelector from "./components/StudentSelector.jsx";
import TCForm from "./components/TCForm.jsx";
import CertificatePreview from "./components/CertificatePreview.jsx";
import AcademicCertificatePreview from "./components/AcademicCertificatePreview.jsx";
import AttendanceCertificatePreview from "./components/AttendanceCertificatePreview.jsx";
import FeePaymentCertificatePreview from "./components/FeePaymentCertificatePreview.jsx";
import FeeStructureCertificatePreview from "./components/FeeStructureCertificatePreview.jsx";
import BonafideCertificatePreview from "./components/BonafideCertificatePreview.jsx";
import CharacterCertificatePreview from "./components/CharacterCertificatePreview.jsx";
import CertificateTypeTabs from "./components/CertificateTypeTabs.jsx";
import TCHistoryPage from "./pages/TCHistoryPage.jsx";
import UserAvatar from "./components/UserAvatar.jsx";
import { fetchStudentPrefill, saveCertificate } from "./services/tcApi.js";
import { loginUser, getCurrentUser, logoutUser, getTenantSlug } from "./services/api.js";
import { applySchoolBranding, resolveAssetUrl, fetchSchoolProfile } from "./utils/branding.js";

const SAMPLE_CERTIFICATE_DATA = {
  sr_no: "TC/2026-27/001",
  tc_number: "TC/2026-27/001",
  gr_no: "101",
  admission_number: "101",
  pen_no: "",
  udise_no: "",
  aadhar_no: "",
  aadhar_card_no: "",
  pupil_name: "Sample Pupil",
  student_name: "Sample Pupil",
  father_name: "Father / Guardian Name",
  mother_name: "Mother Name",
  religion_caste: "General",
  category: "General",
  nationality: "Indian",
  mother_tongue: "Hindi",
  birth_place: "",
  dob: "2012-05-15",
  dob_words: "Fifteen May Two Thousand Twelve",
  first_admission_date: "2020-04-10",
  first_admission_class: "Class - I",
  admission_date_class: "10/04/2020 and Class - I",
  last_studied_class_figure: "VIII",
  last_studied_class_words: "Eighth",
  annual_exam_result: "March-2026 / Passed",
  failed_status: "NA",
  subjects_studied: "English, Hindi, Mathematics, Science, Social Science & IT",
  qualified_for_promotion: "Yes",
  promotion_class_figure: "IX",
  promotion_class_words: "Ninth",
  dues_paid_month: "Up to date",
  fee_concession: "NA",
  total_working_days: 210,
  days_present: 195,
  ncc_scout: "NA",
  extra_curricular: "Annual Day, Sports Day & Cultural Events",
  general_conduct: "Good",
  conduct: "Good",
  application_date: new Date().toISOString().split("T")[0],
  issue_date: new Date().toISOString().split("T")[0],
  reason_for_leaving: "Parents Request / Relocation",
  remarks: "Best wishes for future studies",
  class_name: "VIII",
  section: "A",
  academic_year: "2025–2026",
  academic_cert_no: "APC/2026/101",
  attendance_cert_no: "ATC/2026/101",
  bonafide_cert_no: "BON/2026/101",
  character_cert_no: "CC/2026/101",
  fee_cert_no: "FPC/2026/101",
  structure_cert_no: "FSC/2026/101",
  gender_prefix: "Master",
  relation_prefix: "son",
  pronoun_possessive: "his",
  pronoun_objective: "him",
  parent_name: "Father / Guardian Name",
  parent_salutation: "Shri",
  bonafide_purpose: "Official verification and educational admission",
  character_conduct: "Good and Satisfactory",
  academic_result: "Passed with First Class / Distinction",
  exam_assessment: "Annual Examination March 2026",
  marks_grade: "Grade A1 (91.4%)",
  academic_purpose: "Higher secondary admission and official verification",
  attendance_purpose: "Official administrative verification and academic records",
  fee_total_paid: "45,000",
  fee_as_of_date: new Date().toISOString().split("T")[0],
  fee_period_covered: "Annual Comprehensive Fees (Tuition, Development & Term Charges)",
  fee_purpose: "Income tax rebate (Section 10/80C) and employer education allowance claim",
  fee_tuition_amount: "36,000",
  fee_other_amount: "9,000",
  fee_total_structure: "45,000",
  fee_payment_notes: "Payable in four equal quarterly installments on or before the 10th of April, July, October, and January.",
  structure_purpose: "Education Loan Sanctioning and Documentation"
};

export default function App() {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [formData, setFormData] = useState(null);
  const [selectedCertType, setSelectedCertType] = useState("tc"); // 'tc' | 'academic' | 'attendance' | 'fee_payment' | 'fee_structure'
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("split"); // 'split' | 'certificate_only' | 'form_only'
  const [currentView, setCurrentView] = useState("editor"); // 'editor' | 'history'

  // Teacher / Staff Auth State
  const [user, setUser] = useState(getCurrentUser());
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [schoolProfile, setSchoolProfile] = useState(null);
  useEffect(() => {
    fetchSchoolProfile(getTenantSlug()).then((p) => {
      if (p) {
        setSchoolProfile(p);
        applySchoolBranding(p, "TC Portal");
      }
    });
  }, []);

  const schoolName = user?.schoolName || schoolProfile?.name || "School Campus";
  const logoUrl = resolveAssetUrl(user?.logoUrl || schoolProfile?.logoUrl);

  const certRef = useRef(null);

  // Handle student selection & prefill
  const handleStudentSelect = async (studentId) => {
    setSelectedStudentId(studentId);
    setLoadingStudent(true);
    setSaveSuccess(false);

    try {
      const data = await fetchStudentPrefill(studentId);
      setFormData(data);
    } catch (err) {
      console.error("Error prefilling student data:", err);
    } finally {
      setLoadingStudent(false);
    }
  };

  // Save certificate
  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await saveCertificate(formData);
      if (res.success) {
        setSaveSuccess(true);
        if (res.data?.id) {
          setFormData((prev) => ({ ...prev, id: res.data.id }));
        }
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Trigger A4 Print
  const handlePrint = () => {
    window.print();
  };

  // Load a record from history
  const handleSelectRecord = (rec, targetTab = "split") => {
    setFormData(rec);
    if (rec.student_id) setSelectedStudentId(rec.student_id);
    if (rec.class_id) setSelectedClassId(rec.class_id);
    setActiveTab(targetTab);
    setCurrentView("editor");
  };

  // Quick Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await loginUser(loginEmail, loginPassword);
      if (res.user) {
        setUser(res.user);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setFormData(null);
    setSelectedClassId("");
    setSelectedStudentId("");
    window.location.reload();
  };

  const isAuthenticated = !!(user && localStorage.getItem("tc_auth_token"));

  // Calculate clean display name & role
  const isSuperOrAdmin = user?.type === "admin" || user?.type === "super_admin";
  const userDisplayName =
    user?.name && !user.name.toLowerCase().includes("attendance manager")
      ? user.name
      : isSuperOrAdmin
      ? "Administrator"
      : "TC Incharge";
  const userRoleBadge = isSuperOrAdmin ? "Administrator" : "TC Incharge";

  // Helper to render the active certificate preview
  const renderActiveCertificate = () => {
    switch (selectedCertType) {
      case "bonafide":
        return <BonafideCertificatePreview data={formData} forwardRef={certRef} />;
      case "character":
        return <CharacterCertificatePreview data={formData} forwardRef={certRef} />;
      case "academic":
        return <AcademicCertificatePreview data={formData} forwardRef={certRef} />;
      case "attendance":
        return <AttendanceCertificatePreview data={formData} forwardRef={certRef} />;
      case "fee_payment":
        return <FeePaymentCertificatePreview data={formData} forwardRef={certRef} />;
      case "fee_structure":
        return <FeeStructureCertificatePreview data={formData} forwardRef={certRef} />;
      default:
        return <CertificatePreview data={formData} forwardRef={certRef} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Top Solid Navbar */}
      <header className="navbar no-print">
        <div className="navbar-left">
          <div className="brand-section">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName}
                className="school-logo-img"
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-color, #064e3b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px" }}>
                {schoolName.charAt(0)}
              </div>
            )}
            <div className="brand-text">
              <h1>{schoolName}</h1>
              <span className="brand-subtext">Transfer Certificate &amp; Certificate Suite</span>
            </div>
          </div>

          {isAuthenticated && (
            <nav className="header-nav-tabs">
              <button
                type="button"
                className={`nav-tab-btn ${currentView === "editor" ? "active" : ""}`}
                onClick={() => setCurrentView("editor")}
              >
                <FileText size={16} />
                <span>Issue Certificate</span>
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${currentView === "history" ? "active" : ""}`}
                onClick={() => setCurrentView("history")}
              >
                <History size={16} />
                <span>Records &amp; History</span>
              </button>
            </nav>
          )}
        </div>

        <div className="navbar-right">
          {isAuthenticated && currentView === "editor" && formData && (
            <button
              type="button"
              className="btn-accent"
              onClick={handlePrint}
              title="Print A4 Certificate"
            >
              <Printer size={16} />
              <span>Print A4</span>
            </button>
          )}

          {isAuthenticated && (
            <div className="user-profile-badge">
              <UserAvatar src={user?.avatar_url} name={userDisplayName} size={30} />
              <div className="user-meta">
                <span className="user-name-text">{userDisplayName}</span>
                <span className="user-role-badge">{userRoleBadge}</span>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <button
              type="button"
              className="btn-logout"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main App Container */}
      <main className="main-content">
        {!isAuthenticated ? (
          <div className="auth-card-wrapper">
            <div className="auth-card card-glass">
              <div className="auth-header">
                {logoUrl ? (
                  <img src={logoUrl} alt={schoolName} style={{ height: "60px", width: "60px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.75rem", display: "block" }} />
                ) : (
                  <div className="auth-logo-badge">
                    <School className="icon-gold" size={32} />
                  </div>
                )}
                <h2>{schoolName}</h2>
                <p>Enter your staff credentials to issue &amp; print official school certificates.</p>
              </div>

              {loginError && <div className="auth-error-banner">{loginError}</div>}

              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="form-group">
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. staff@visioninternationalschool.edu.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary auth-submit" disabled={loginLoading}>
                  {loginLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Sign In to Portal</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : currentView === "history" ? (
          <TCHistoryPage onSelectRecord={handleSelectRecord} />
        ) : (
          <>
            {/* Top Certificate Type Selector Tabs */}
            <CertificateTypeTabs
              activeType={selectedCertType}
              onChange={setSelectedCertType}
            />

            {/* Student & Class Selector Bar */}
            <div className="no-print">
              <StudentSelector
                selectedClassId={selectedClassId}
                onClassChange={(clsId) => {
                  setSelectedClassId(clsId);
                  setSelectedStudentId("");
                  setFormData(null);
                }}
                onClassSelect={(clsId) => {
                  setSelectedClassId(clsId);
                  setSelectedStudentId("");
                  setFormData(null);
                }}
                selectedStudentId={selectedStudentId}
                onStudentSelect={handleStudentSelect}
                onOpenHistory={() => setCurrentView("history")}
                loadingStudent={loadingStudent}
                onAuthError={handleLogout}
              />
            </div>

            {/* View Layout Tabs */}
            {formData && (
              <div className="view-tabs-bar no-print">
                <div className="tab-buttons">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "split" ? "active" : ""}`}
                    onClick={() => setActiveTab("split")}
                  >
                    <span>Split View (Editor + Live A4)</span>
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "certificate_only" ? "active" : ""}`}
                    onClick={() => setActiveTab("certificate_only")}
                  >
                    <span>Certificate Full Preview</span>
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === "form_only" ? "active" : ""}`}
                    onClick={() => setActiveTab("form_only")}
                  >
                    <span>Form Editor Only</span>
                  </button>
                </div>

                <div className="current-student-tag">
                  <span>Pupil: </span>
                  <strong>{formData.pupil_name || formData.student_name}</strong>
                  {formData.class_name && (
                    <span className="birthplace-tag">
                      • Grade: <strong>{formData.class_name}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Workspace Display */}
            {loadingStudent ? (
              <div className="loading-card card-glass text-center p-8">
                <Sparkles className="spin icon-gold" size={28} />
                <p className="mt-4">Fetching student records &amp; calculating pre-filled values...</p>
              </div>
            ) : !formData ? (
              <div className="empty-selection-card card-glass text-center p-12">
                <GraduationCap className="icon-gold mx-auto" size={48} />
                <h3 className="text-xl font-bold mt-4">Select a Student to Begin</h3>
                <p className="text-muted mt-2 max-w-md mx-auto">
                  Choose your assigned class from the selector above, then click on any student card.
                  All existing data (parents, DOB, place of birth, admission info, attendance, fee records) will automatically fill into the selected certificate.
                </p>
                <div style={{ marginTop: "18px" }}>
                  <button
                    type="button"
                    className="btn-accent"
                    onClick={() => setFormData({ ...SAMPLE_CERTIFICATE_DATA })}
                    style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <Sparkles size={16} />
                    <span>Preview Sample Certificate</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`workspace-content ${activeTab}`}>
                {activeTab === "split" && (
                  <div className="split-workspace">
                    <div className="form-column no-print">
                      <TCForm
                        formData={formData}
                        onChange={setFormData}
                        onSave={handleSave}
                        onPrint={handlePrint}
                        saving={saving}
                        saveSuccess={saveSuccess}
                        certificateType={selectedCertType}
                      />
                    </div>
                    <div className="preview-column">
                      {renderActiveCertificate()}
                    </div>
                  </div>
                )}

                {activeTab === "certificate_only" && (
                  <div className="single-preview-workspace">
                    {renderActiveCertificate()}
                  </div>
                )}

                {activeTab === "form_only" && (
                  <div className="single-form-workspace no-print">
                    <TCForm
                      formData={formData}
                      onChange={setFormData}
                      onSave={handleSave}
                      onPrint={handlePrint}
                      saving={saving}
                      saveSuccess={saveSuccess}
                      certificateType={selectedCertType}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
