import React from "react";
import {
  FileText,
  User,
  Calendar,
  Award,
  Clock,
  Save,
  Printer,
  CheckCircle2,
  MapPin,
  BookOpen,
  Receipt,
  CalendarCheck,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { formatDateToWords, formatClassToWords } from "../utils/numberToWords.js";
import CustomDropdown from "./CustomDropdown.jsx";

export default function TCForm({
  formData,
  onChange,
  onSave,
  onPrint,
  saving,
  saveSuccess,
  certificateType = "tc"
}) {
  if (!formData) return null;

  const handleFieldChange = (key, value) => {
    const updated = { ...formData, [key]: value };

    // Auto-update words if DOB changes
    if (key === "dob") {
      updated.dob_words = formatDateToWords(value);
    }
    // Auto-update class in words if last_studied_class_figure changes
    if (key === "last_studied_class_figure") {
      updated.last_studied_class_words = formatClassToWords(value);
    }
    // Auto-update promotion class in words
    if (key === "promotion_class_figure") {
      updated.promotion_class_words = formatClassToWords(value);
    }
    // Auto-compute total fee if tuition or other fee changes
    if (key === "fee_tuition_amount" || key === "fee_other_amount") {
      const tuition = parseFloat(String(key === "fee_tuition_amount" ? value : updated.fee_tuition_amount || 0).replace(/,/g, "")) || 0;
      const other = parseFloat(String(key === "fee_other_amount" ? value : updated.fee_other_amount || 0).replace(/,/g, "")) || 0;
      updated.fee_total_structure = (tuition + other).toLocaleString("en-IN");
    }

    onChange(updated);
  };

  const getFormTitle = () => {
    switch (certificateType) {
      case "academic":
        return "Academic Performance Certificate Form";
      case "attendance":
        return "Attendance Certificate Form";
      case "fee_payment":
        return "Fee Payment Statement Form";
      case "fee_structure":
        return "Fee Structure Certificate Form";
      default:
        return "Leaving Certificate (TC) Form";
    }
  };

  return (
    <div className="tc-form-card card-glass">
      <div className="form-title-bar">
        <div className="title-left">
          <FileText className="icon-gold" size={20} />
          <div>
            <h3>{getFormTitle()}</h3>
            <p className="subtitle">
              Verify pre-filled student information and edit details for the official certificate.
            </p>
          </div>
        </div>
        <div className="form-action-buttons">
          <button
            type="button"
            className="btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save size={16} />
                <span>Save Record</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-accent"
            onClick={onPrint}
            title="Open printable A4 Certificate"
          >
            <Printer size={16} />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="success-banner">
          <CheckCircle2 size={16} />
          <span>Certificate details successfully saved to records!</span>
        </div>
      )}

      <form className="tc-form-body" onSubmit={(e) => { e.preventDefault(); onSave(); }}>

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: 1. LEAVING CERTIFICATE (TC - 23 FIELDS)       */}
        {/* ============================================================== */}
        {certificateType === "tc" && (
          <>
            {/* Metadata & Identifiers */}
            <div className="form-section">
              <div className="section-heading">
                <Clock size={16} />
                <span>Certificate Identifiers &amp; Registration</span>
              </div>
              <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                <div className="form-group">
                  <label className="field-label">Sr. No. / TC No.</label>
                  <input
                    type="text"
                    className="input-field highlight-field"
                    value={formData.tc_number || formData.sr_no || ""}
                    onChange={(e) => {
                      handleFieldChange("tc_number", e.target.value);
                      handleFieldChange("sr_no", e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">GR. No / Admission No</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.gr_no || formData.admission_number || ""}
                    onChange={(e) => {
                      handleFieldChange("gr_no", e.target.value);
                      handleFieldChange("admission_number", e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">UDISE No</label>
                  <input
                    type="text"
                    placeholder="e.g. 11-digit UDISE+ code"
                    className="input-field"
                    value={formData.udise_no || ""}
                    onChange={(e) => handleFieldChange("udise_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">PEN NO</label>
                  <input
                    type="text"
                    placeholder="e.g. Permanent Education Number"
                    className="input-field"
                    value={formData.pen_no || ""}
                    onChange={(e) => handleFieldChange("pen_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Aadhar Card No</label>
                  <input
                    type="text"
                    placeholder="e.g. 12-digit Aadhaar number"
                    className="input-field"
                    value={formData.aadhar_no || formData.aadhar_card_no || ""}
                    onChange={(e) => {
                      handleFieldChange("aadhar_no", e.target.value);
                      handleFieldChange("aadhar_card_no", e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Fields 01 - 03: Pupil & Parents */}
            <div className="form-section">
              <div className="section-heading">
                <User size={16} />
                <span>Pupil &amp; Parent Particulars (01 - 03)</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">01. Name of Pupil</label>
                  <input
                    type="text"
                    className="input-field highlight-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => {
                      handleFieldChange("pupil_name", e.target.value);
                      handleFieldChange("student_name", e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">02. Mother&apos;s Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.mother_name || ""}
                    onChange={(e) => handleFieldChange("mother_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">03. Father&apos;s Name / Guardian&apos;s Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.father_name || ""}
                    onChange={(e) => handleFieldChange("father_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fields 04 - 08: DOB, Place of Birth, Nationality, Category, First Admission */}
            <div className="form-section">
              <div className="section-heading">
                <Calendar size={16} />
                <span>Birth Record, Category &amp; First Admission (04 - 08)</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">04. Date of Birth (in figures)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.dob || ""}
                    onChange={(e) => handleFieldChange("dob", e.target.value)}
                  />
                </div>
                <div className="form-group span-2">
                  <label className="field-label">04. Date of Birth (in words)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.dob_words || ""}
                    onChange={(e) => handleFieldChange("dob_words", e.target.value)}
                  />
                </div>
              </div>

              {/* 05. Place of Birth */}
              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="field-label">05. Place of Birth</label>
                <input
                  type="text"
                  placeholder="e.g. Birth City / District"
                  className="input-field"
                  value={formData.birth_place || formData.place_of_birth || ""}
                  onChange={(e) => {
                    handleFieldChange("birth_place", e.target.value);
                    handleFieldChange("place_of_birth", e.target.value);
                  }}
                />
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">06. Nationality</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.nationality || "Indian"}
                    onChange={(e) => handleFieldChange("nationality", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">07. Belongs to SC / ST / OBC *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hindu - Chambhar or General"
                    className="input-field"
                    value={formData.religion_caste || formData.category || ""}
                    onChange={(e) => {
                      handleFieldChange("religion_caste", e.target.value);
                      handleFieldChange("category", e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">08. Date of 1st Admission with Class</label>
                  <input
                    type="text"
                    placeholder="e.g. 16/06/2022 and Class - VII"
                    className="input-field"
                    value={formData.admission_date_class || ""}
                    onChange={(e) => handleFieldChange("admission_date_class", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fields 09 - 13: Academic Record & Promotion */}
            <div className="form-section">
              <div className="section-heading">
                <BookOpen size={16} />
                <span>Academic Record, Examination &amp; Promotion (09 - 13)</span>
              </div>
              <div className="grid-4">
                <div className="form-group">
                  <label className="field-label">09. Class Last Studied (Figures)</label>
                  <input
                    type="text"
                    placeholder="e.g. X"
                    className="input-field"
                    value={formData.last_studied_class_figure || ""}
                    onChange={(e) => handleFieldChange("last_studied_class_figure", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">09. Class Last Studied (Words)</label>
                  <input
                    type="text"
                    placeholder="e.g. Tenth"
                    className="input-field"
                    value={formData.last_studied_class_words || ""}
                    onChange={(e) => handleFieldChange("last_studied_class_words", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">10. Exam Last Taken with Result</label>
                  <input
                    type="text"
                    placeholder="e.g. March-2026 / Passed"
                    className="input-field"
                    value={formData.annual_exam_result || ""}
                    onChange={(e) => handleFieldChange("annual_exam_result", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">11. Failed Once / Twice in Same Class</label>
                  <input
                    type="text"
                    placeholder="NA"
                    className="input-field"
                    value={formData.failed_status || "NA"}
                    onChange={(e) => handleFieldChange("failed_status", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="field-label">12. Subjects Studied</label>
                <input
                  type="text"
                  placeholder="e.g. English, Hindi, Mathematics, Science, Social Science & IT"
                  className="input-field"
                  value={formData.subjects_studied || ""}
                  onChange={(e) => handleFieldChange("subjects_studied", e.target.value)}
                />
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">13. Qualified for Promotion?</label>
                  <CustomDropdown
                    value={formData.qualified_for_promotion || "Yes"}
                    options={["Yes", "No", "Refer Result"]}
                    onChange={(val) => handleFieldChange("qualified_for_promotion", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Promotion Class (Figures)</label>
                  <input
                    type="text"
                    placeholder="e.g. XI"
                    className="input-field"
                    value={formData.promotion_class_figure || ""}
                    onChange={(e) => handleFieldChange("promotion_class_figure", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Promotion Class (Words)</label>
                  <input
                    type="text"
                    placeholder="e.g. Eleventh"
                    className="input-field"
                    value={formData.promotion_class_words || ""}
                    onChange={(e) => handleFieldChange("promotion_class_words", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fields 14 - 19: Dues, Attendance, Activities */}
            <div className="form-section">
              <div className="section-heading">
                <Receipt size={16} />
                <span>Dues, Attendance &amp; Activities (14 - 19)</span>
              </div>
              <div className="grid-4">
                <div className="form-group">
                  <label className="field-label">14. Month Paid Dues</label>
                  <input
                    type="text"
                    placeholder="e.g. Up to date (March 2026)"
                    className="input-field"
                    value={formData.dues_paid_month || ""}
                    onChange={(e) => handleFieldChange("dues_paid_month", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">15. Fee Concession</label>
                  <input
                    type="text"
                    placeholder="NA"
                    className="input-field"
                    value={formData.fee_concession || "NA"}
                    onChange={(e) => handleFieldChange("fee_concession", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">16. Total Working Days</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 210"
                    value={formData.total_working_days !== undefined && formData.total_working_days !== null ? formData.total_working_days : ""}
                    onChange={(e) => handleFieldChange("total_working_days", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">17. Days Present</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 185"
                    value={formData.days_present !== undefined && formData.days_present !== null ? formData.days_present : ""}
                    onChange={(e) => handleFieldChange("days_present", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">18. NCC Cadet / Boy Scout / Girl Guide</label>
                  <input
                    type="text"
                    placeholder="NA"
                    className="input-field"
                    value={formData.ncc_scout || "NA"}
                    onChange={(e) => handleFieldChange("ncc_scout", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">19. Games Played / Extra-Curricular Activities</label>
                  <input
                    type="text"
                    placeholder="e.g. Sports Day, Cultural Activities"
                    className="input-field"
                    value={formData.extra_curricular || ""}
                    onChange={(e) => handleFieldChange("extra_curricular", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fields 20 - 24: Conduct, Dates, Reason & Remarks */}
            <div className="form-section">
              <div className="section-heading">
                <Award size={16} />
                <span>Conduct, Dates, Reason &amp; Remarks (20 - 24)</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">20. General Conduct</label>
                  <CustomDropdown
                    value={formData.general_conduct || formData.conduct || "Good"}
                    options={["Good", "Very Good", "Excellent", "Satisfactory"]}
                    onChange={(val) => {
                      handleFieldChange("general_conduct", val);
                      handleFieldChange("conduct", val);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">21. Date of Application</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.application_date || ""}
                    onChange={(e) => handleFieldChange("application_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">22. Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">23. Reasons for Leaving School</label>
                  <input
                    type="text"
                    placeholder="e.g. Parents Request / Relocation"
                    className="input-field"
                    value={formData.reason_for_leaving || ""}
                    onChange={(e) => handleFieldChange("reason_for_leaving", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">24. Any Other Remark</label>
                  <input
                    type="text"
                    placeholder="e.g. Best wishes for future studies"
                    className="input-field"
                    value={formData.remarks || ""}
                    onChange={(e) => handleFieldChange("remarks", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: BONAFIDE CERTIFICATE                         */}
        {/* ============================================================== */}
        {certificateType === "bonafide" && (
          <>
            <div className="form-section">
              <div className="section-heading">
                <ShieldCheck size={16} />
                <span>Certificate Reference &amp; Issue Details</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Certificate No.</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. BON/2026/001"
                    value={formData.bonafide_cert_no || ""}
                    onChange={(e) => handleFieldChange("bonafide_cert_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Place of Issue</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.place || ""}
                    onChange={(e) => handleFieldChange("place", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-heading">
                <User size={16} />
                <span>Student &amp; Parent Identity</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Student Salutation</label>
                  <CustomDropdown
                    value={formData.gender_prefix || "Miss"}
                    options={["Master", "Miss", "Master / Miss"]}
                    onChange={(val) => {
                      handleFieldChange("gender_prefix", val);
                      if (val === "Master") {
                        handleFieldChange("relation_prefix", "son");
                        handleFieldChange("pronoun_possessive", "his");
                        handleFieldChange("pronoun_objective", "him");
                      } else if (val === "Miss") {
                        handleFieldChange("relation_prefix", "daughter");
                        handleFieldChange("pronoun_possessive", "her");
                        handleFieldChange("pronoun_objective", "her");
                      }
                    }}
                  />
                </div>
                <div className="form-group span-2">
                  <label className="field-label">Student Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => {
                      handleFieldChange("pupil_name", e.target.value);
                      handleFieldChange("student_name", e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Relationship</label>
                  <CustomDropdown
                    value={formData.relation_prefix || "daughter"}
                    options={["son", "daughter", "ward", "son / daughter"]}
                    onChange={(val) => handleFieldChange("relation_prefix", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Parent Salutation</label>
                  <CustomDropdown
                    value={formData.parent_salutation || "Shri"}
                    options={["Shri", "Smt.", "Shri / Smt."]}
                    onChange={(val) => handleFieldChange("parent_salutation", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Parent / Guardian Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.parent_name || formData.father_name || ""}
                    onChange={(e) => {
                      handleFieldChange("parent_name", e.target.value);
                      handleFieldChange("father_name", e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-heading">
                <BookOpen size={16} />
                <span>Enrollment &amp; Academic Details</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Grade / Class</label>
                  <input
                    type="text"
                    placeholder="e.g. X"
                    className="input-field"
                    value={formData.class_name || formData.last_studied_class_figure || ""}
                    onChange={(e) => {
                      handleFieldChange("class_name", e.target.value);
                      handleFieldChange("last_studied_class_figure", e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    className="input-field"
                    value={formData.section || "A"}
                    onChange={(e) => handleFieldChange("section", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025–2026"
                    className="input-field"
                    value={formData.academic_year || "2025–2026"}
                    onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Date of Birth</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.dob || ""}
                    onChange={(e) => handleFieldChange("dob", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Admission No. / G.R. No.</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.admission_number || formData.gr_no || ""}
                    onChange={(e) => {
                      handleFieldChange("admission_number", e.target.value);
                      handleFieldChange("gr_no", e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "14px" }}>
                <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Purpose of Issue</span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>Choose preset or type custom</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "6px 0 10px 0" }}>
                  {[
                    "Official Use",
                    "Caste Certificate",
                    "Aadhaar Card",
                    "Passport"
                  ].map((preset) => {
                    const isSelected = formData.bonafide_purpose === preset;
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleFieldChange("bonafide_purpose", preset)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          border: isSelected ? "1.5px solid #1e40af" : "1px solid #cbd5e1",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          color: isSelected ? "#1e40af" : "#334155",
                          fontWeight: isSelected ? "700" : "500",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {isSelected && <span style={{ color: "#1e40af", fontSize: "14px", lineHeight: 1 }}>✓</span>}
                        {preset}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Select one of the 4 options above or enter custom purpose"
                  className="input-field"
                  value={formData.bonafide_purpose || ""}
                  onChange={(e) => handleFieldChange("bonafide_purpose", e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: CHARACTER CERTIFICATE                        */}
        {/* ============================================================== */}
        {certificateType === "character" && (
          <>
            <div className="form-section">
              <div className="section-heading">
                <UserCheck size={16} />
                <span>Certificate Reference &amp; Issue Details</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Certificate No.</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. CC/2026/001"
                    value={formData.character_cert_no || ""}
                    onChange={(e) => handleFieldChange("character_cert_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Place of Issue</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.place || ""}
                    onChange={(e) => handleFieldChange("place", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-heading">
                <User size={16} />
                <span>Student &amp; Parent Identity</span>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Student Salutation</label>
                  <CustomDropdown
                    value={formData.gender_prefix || "Miss"}
                    options={["Master", "Miss", "Master / Miss"]}
                    onChange={(val) => {
                      handleFieldChange("gender_prefix", val);
                      if (val === "Master") {
                        handleFieldChange("relation_prefix", "son");
                        handleFieldChange("pronoun_possessive", "his");
                        handleFieldChange("pronoun_objective", "him");
                      } else if (val === "Miss") {
                        handleFieldChange("relation_prefix", "daughter");
                        handleFieldChange("pronoun_possessive", "her");
                        handleFieldChange("pronoun_objective", "her");
                      }
                    }}
                  />
                </div>
                <div className="form-group span-2">
                  <label className="field-label">Student Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => {
                      handleFieldChange("pupil_name", e.target.value);
                      handleFieldChange("student_name", e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Relationship</label>
                  <CustomDropdown
                    value={formData.relation_prefix || "daughter"}
                    options={["son", "daughter", "ward", "son / daughter"]}
                    onChange={(val) => handleFieldChange("relation_prefix", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Parent Salutation</label>
                  <CustomDropdown
                    value={formData.parent_salutation || "Shri"}
                    options={["Shri", "Smt.", "Shri / Smt."]}
                    onChange={(val) => handleFieldChange("parent_salutation", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Parent / Guardian Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.parent_name || formData.father_name || ""}
                    onChange={(e) => {
                      handleFieldChange("parent_name", e.target.value);
                      handleFieldChange("father_name", e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-heading">
                <Award size={16} />
                <span>Academic Record &amp; Conduct Evaluation</span>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="field-label">Grade / Class Studied</label>
                  <input
                    type="text"
                    placeholder="e.g. X"
                    className="input-field"
                    value={formData.class_name || formData.last_studied_class_figure || ""}
                    onChange={(e) => {
                      handleFieldChange("class_name", e.target.value);
                      handleFieldChange("last_studied_class_figure", e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025–2026"
                    className="input-field"
                    value={formData.academic_year || "2025–2026"}
                    onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Possessive Pronoun</label>
                  <CustomDropdown
                    value={formData.pronoun_possessive || "her"}
                    options={["his", "her", "their", "his / her"]}
                    onChange={(val) => handleFieldChange("pronoun_possessive", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Objective Pronoun</label>
                  <CustomDropdown
                    value={formData.pronoun_objective || "her"}
                    options={["him", "her", "them", "him / her"]}
                    onChange={(val) => handleFieldChange("pronoun_objective", val)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Conduct &amp; Character Assessment</label>
                  <CustomDropdown
                    value={formData.character_conduct || "satisfactory"}
                    options={["satisfactory", "good", "very good", "exemplary"]}
                    onChange={(val) => handleFieldChange("character_conduct", val)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: 3. ACADEMIC PERFORMANCE CERTIFICATE           */}
        {/* ============================================================== */}
        {certificateType === "academic" && (
          <>
            <div className="form-section">
              <div className="section-heading">
                <Award size={16} />
                <span>Academic Record &amp; Examination Results</span>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Certificate No.</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. APC/2026/001"
                    value={formData.academic_cert_no || ""}
                    onChange={(e) => handleFieldChange("academic_cert_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025–2026"
                    className="input-field"
                    value={formData.academic_year || ""}
                    onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Student Name</label>
                  <input
                    type="text"
                    className="input-field highlight-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => handleFieldChange("pupil_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Admission No.</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.admission_number || formData.gr_no || ""}
                    onChange={(e) => handleFieldChange("admission_number", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Studied in Grade</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.class_name || formData.last_studied_class_figure || ""}
                    onChange={(e) => handleFieldChange("class_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Academic Result Statement</label>
                  <input
                    type="text"
                    placeholder="e.g. Passed with First Class / Distinction"
                    className="input-field"
                    value={formData.academic_result || formData.annual_exam_result || ""}
                    onChange={(e) => handleFieldChange("academic_result", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Examination / Assessment</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Examination March 2026"
                    className="input-field"
                    value={formData.exam_assessment || ""}
                    onChange={(e) => handleFieldChange("exam_assessment", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Marks / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade A1 (91.4%)"
                    className="input-field"
                    value={formData.marks_grade || ""}
                    onChange={(e) => handleFieldChange("marks_grade", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Issued Upon Request For (Purpose)</label>
                  <input
                    type="text"
                    placeholder="e.g. Higher Admission &amp; School Verification"
                    className="input-field"
                    value={formData.academic_purpose || formData.cert_purpose || ""}
                    onChange={(e) => {
                      handleFieldChange("academic_purpose", e.target.value);
                      handleFieldChange("cert_purpose", e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: 3. ATTENDANCE CERTIFICATE                     */}
        {/* ============================================================== */}
        {certificateType === "attendance" && (
          <>
            <div className="form-section">
              <div className="section-heading">
                <CalendarCheck size={16} />
                <span>Student Attendance Details</span>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Certificate No.</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. ATC/2026/001"
                    value={formData.attendance_cert_no || ""}
                    onChange={(e) => handleFieldChange("attendance_cert_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025–2026"
                    className="input-field"
                    value={formData.academic_year || ""}
                    onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-4" style={{ marginTop: "12px" }}>
                <div className="form-group span-2">
                  <label className="field-label">Student Name</label>
                  <input
                    type="text"
                    className="input-field highlight-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => handleFieldChange("pupil_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Grade</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.class_name || formData.last_studied_class_figure || ""}
                    onChange={(e) => handleFieldChange("class_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Section</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.section || ""}
                    onChange={(e) => handleFieldChange("section", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Days Present</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 185"
                    value={formData.days_present !== undefined && formData.days_present !== null ? formData.days_present : ""}
                    onChange={(e) => handleFieldChange("days_present", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Total Working Days</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 210"
                    value={formData.total_working_days !== undefined && formData.total_working_days !== null ? formData.total_working_days : ""}
                    onChange={(e) => handleFieldChange("total_working_days", e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Attendance Percentage</label>
                  <input
                    type="text"
                    className="input-field"
                    readOnly
                    value={
                      formData.total_working_days && Number(formData.total_working_days) > 0
                        ? `${((Number(formData.days_present || 0) / Number(formData.total_working_days)) * 100).toFixed(1)}%`
                        : "—"
                    }
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="field-label">Issued Upon Request For (Purpose)</label>
                <input
                  type="text"
                  placeholder="e.g. Visa Processing / Bus Concession / Official Verification"
                  className="input-field"
                  value={formData.attendance_purpose || formData.cert_purpose || "official administrative verification and records"}
                  onChange={(e) => {
                    handleFieldChange("attendance_purpose", e.target.value);
                    handleFieldChange("cert_purpose", e.target.value);
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: 4. FEE PAYMENT CERTIFICATE / STATEMENT        */}
        {/* ============================================================== */}
        {certificateType === "fee_payment" && (
          <>
            <div className="form-section">
              <div className="section-heading">
                <Receipt size={16} />
                <span>Fee Payment Account Statement</span>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="field-label">Certificate No.</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. FPC/2026/001"
                    value={formData.fee_cert_no || ""}
                    onChange={(e) => handleFieldChange("fee_cert_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025–2026"
                    className="input-field"
                    value={formData.academic_year || ""}
                    onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Student Name</label>
                  <input
                    type="text"
                    className="input-field highlight-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => handleFieldChange("pupil_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Admission No.</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.admission_number || formData.gr_no || ""}
                    onChange={(e) => handleFieldChange("admission_number", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Grade</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.class_name || formData.last_studied_class_figure || ""}
                    onChange={(e) => handleFieldChange("class_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Payments Totalling (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 45,000"
                    className="input-field input-prominent"
                    value={formData.fee_total_paid || ""}
                    onChange={(e) => handleFieldChange("fee_total_paid", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">As of Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 28-10-2026"
                    className="input-field"
                    value={formData.fee_as_of_date || ""}
                    onChange={(e) => handleFieldChange("fee_as_of_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="field-label">Fee Details / Period Covered</label>
                <input
                  type="text"
                  placeholder="e.g. Term I &amp; Term II Comprehensive Fees (Tuition, Development &amp; Term Charges)"
                  className="input-field"
                  value={formData.fee_period_covered || ""}
                  onChange={(e) => handleFieldChange("fee_period_covered", e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="field-label">Issued Upon Request For (Purpose)</label>
                <input
                  type="text"
                  placeholder="e.g. Income tax rebate (Section 10/80C) and employer education allowance claim"
                  className="input-field"
                  value={formData.fee_purpose || formData.cert_purpose || ""}
                  onChange={(e) => {
                    handleFieldChange("fee_purpose", e.target.value);
                    handleFieldChange("cert_purpose", e.target.value);
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* CERTIFICATE TYPE: 5. FEE STRUCTURE CERTIFICATE                 */}
        {/* ============================================================== */}
        {certificateType === "fee_structure" && (
          <>
            <div className="form-section">
              <div className="section-heading">
                <BookOpen size={16} />
                <span>Applicable Fee Structure Breakdown</span>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="field-label">Student Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AUTI ADVIKA ROHIT"
                    className="input-field"
                    value={formData.pupil_name || formData.student_name || ""}
                    onChange={(e) => {
                      handleFieldChange("pupil_name", e.target.value);
                      handleFieldChange("student_name", e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Salutation</label>
                  <select
                    className="input-field select-field"
                    value={formData.gender_prefix || "Master"}
                    onChange={(e) => handleFieldChange("gender_prefix", e.target.value)}
                  >
                    <option value="Master">Master</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>
              </div>

              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Certificate No.</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.structure_cert_no || ""}
                    onChange={(e) => handleFieldChange("structure_cert_no", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Admission / GR No.</label>
                  <input
                    type="text"
                    placeholder="e.g. Admission number"
                    className="input-field"
                    value={formData.admission_number || ""}
                    onChange={(e) => handleFieldChange("admission_number", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Date of Issue</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.issue_date || ""}
                    onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026–2027"
                    className="input-field"
                    value={formData.academic_year || ""}
                    onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Applicable Grade</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.class_name || formData.last_studied_class_figure || ""}
                    onChange={(e) => handleFieldChange("class_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid-3" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="field-label">Tuition Fee (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 36,000"
                    className="input-field"
                    value={formData.fee_tuition_amount || ""}
                    onChange={(e) => handleFieldChange("fee_tuition_amount", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Other Fee(s) (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9,000"
                    className="input-field"
                    value={formData.fee_other_amount || ""}
                    onChange={(e) => handleFieldChange("fee_other_amount", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Total Fee (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 45,000"
                    className="input-field highlight-field"
                    value={formData.fee_total_structure || ""}
                    onChange={(e) => handleFieldChange("fee_total_structure", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="field-label">Payment Frequency / Terms / Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Payable in four equal quarterly installments on or before the 10th of April, July, October, and January."
                  className="input-field textarea-field"
                  value={formData.fee_payment_notes || ""}
                  onChange={(e) => handleFieldChange("fee_payment_notes", e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: "14px" }}>
                <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Issued Upon Request For (Purpose)</span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>Choose preset or type custom</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "6px 0 10px 0" }}>
                  {[
                    "Education Loan Sanctioning",
                    "Parent Bank Processing",
                    "Employer Verification",
                    "Official Administrative Purpose"
                  ].map((preset) => {
                    const currentVal = formData.structure_purpose || formData.cert_purpose || "";
                    const isSelected = currentVal.toLowerCase() === preset.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => {
                          handleFieldChange("structure_purpose", preset);
                          handleFieldChange("cert_purpose", preset);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          border: isSelected ? "1.5px solid #1e40af" : "1px solid #cbd5e1",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          color: isSelected ? "#1e40af" : "#334155",
                          fontWeight: isSelected ? "700" : "500",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {isSelected && <span style={{ color: "#1e40af", fontSize: "14px", lineHeight: 1 }}>✓</span>}
                        {preset}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Select one of the preset options above or enter custom purpose"
                  className="input-field"
                  value={formData.structure_purpose || formData.cert_purpose || ""}
                  onChange={(e) => {
                    handleFieldChange("structure_purpose", e.target.value);
                    handleFieldChange("cert_purpose", e.target.value);
                  }}
                />
              </div>
            </div>
          </>
        )}

      </form>
    </div>
  );
}
