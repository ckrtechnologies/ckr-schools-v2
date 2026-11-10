import React from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";

export default function AdmissionEnquiryPrintout({ data, counsellorName, className }) {
  if (!data) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day} / ${month} / ${year}`;
    } catch {
      return dateStr;
    }
  };

  const enquiryDate = data.created_at || data.admission_date || new Date().toISOString();
  const academicYear = data.academic_year || "2026 – 2027";
  const regId = data.id ? `#${String(data.id).slice(0, 8).toUpperCase()}` : "";

  const isChecked = (fieldVal, optionVal) => {
    if (!fieldVal) return false;
    return String(fieldVal).trim().toLowerCase() === String(optionVal).trim().toLowerCase();
  };

  return (
    <div className="admission-printout-wrapper" id="admission-enquiry-print-area">
      <div className="cbse-certificate enquiry-print-sheet">
        {/* Approved School Letterhead with Logo, School details, 2px Solid Line and Title with underline */}
        <OfficialLetterheadHeader certificateTitle="ADMISSION ENQUIRY FORM" />

        {/* Header Meta Row: Academic Year, Enquiry No, Date */}
        <div className="enquiry-print-meta-row">
          <div className="meta-cell">
            <span className="meta-label">Academic Year:</span>
            <span className="single-line-val bold-val">{academicYear}</span>
          </div>
          <div className="meta-cell">
            <span className="meta-label">Enquiry No.:</span>
            <span className="single-line-val bold-val">{regId}</span>
          </div>
          <div className="meta-cell">
            <span className="meta-label">Date:</span>
            <span className="single-line-val bold-val">{formatDate(enquiryDate)}</span>
          </div>
        </div>

        {/* 1. STUDENT DETAILS */}
        <div className="enquiry-form-section">
          <div className="section-heading">1. STUDENT DETAILS</div>

          <div className="form-line full-line">
            <span className="line-label">Student&apos;s Full Name:</span>
            <span className="single-line-val bold-val">{data.name || ""}</span>
          </div>

          <div className="form-line-grid-2">
            <div className="form-line">
              <span className="line-label">Date of Birth:</span>
              <span className="single-line-val bold-val">{formatDate(data.dob)}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Gender:</span>
              <span className="checkbox-group">
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.gender, "Male") ? "☑" : "☐"}</span> Male
                </span>
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.gender, "Female") ? "☑" : "☐"}</span> Female
                </span>
              </span>
            </div>
          </div>

          <div className="form-line-grid-2">
            <div className="form-line">
              <span className="line-label">Class for Which Admission Is Sought:</span>
              <span className="single-line-val bold-val">{className || data.class_id || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Board:</span>
              <span className="checkbox-group">
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.prev_board, "CBSE") ? "☑" : "☐"}</span> CBSE
                </span>
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.prev_board, "State Board") ? "☑" : "☐"}</span> State Board
                </span>
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.prev_board, "Other") ? "☑" : "☐"}</span> Other
                </span>
              </span>
            </div>
          </div>

          <div className="form-line full-line">
            <span className="line-label">Previous School Name:</span>
            <span className="single-line-val bold-val">{data.prev_school || ""}</span>
          </div>

          <div className="form-line full-line">
            <span className="line-label">Residential Address:</span>
            <span className="single-line-val bold-val">{data.address || ""}</span>
          </div>
        </div>

        {/* 2. PARENT / GUARDIAN DETAILS */}
        <div className="enquiry-form-section">
          <div className="section-heading">2. PARENT / GUARDIAN DETAILS</div>

          <div className="form-line-grid-3">
            <div className="form-line">
              <span className="line-label">Father&apos;s Name:</span>
              <span className="single-line-val bold-val">{data.father_name || data.parent || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Occupation:</span>
              <span className="single-line-val bold-val">{data.father_occupation || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Mobile Number:</span>
              <span className="single-line-val bold-val">{data.father_mobile || data.phone || ""}</span>
            </div>
          </div>

          <div className="form-line-grid-3">
            <div className="form-line">
              <span className="line-label">Mother&apos;s Name:</span>
              <span className="single-line-val bold-val">{data.mother_name || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Occupation:</span>
              <span className="single-line-val bold-val">{data.mother_occupation || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Mobile Number:</span>
              <span className="single-line-val bold-val">{data.mother_mobile || ""}</span>
            </div>
          </div>

          <div className="form-line-grid-2">
            <div className="form-line">
              <span className="line-label">Alternate Contact Number:</span>
              <span className="single-line-val bold-val">{data.alternate_phone || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Email ID:</span>
              <span className="single-line-val bold-val">{data.email || data.parentEmail || ""}</span>
            </div>
          </div>
        </div>

        {/* 3. ADMISSION REQUIREMENTS */}
        <div className="enquiry-form-section">
          <div className="section-heading">3. ADMISSION REQUIREMENTS</div>

          <div className="form-line full-line">
            <span className="line-label">How did you hear about our school?</span>
            <span className="checkbox-group" style={{ marginLeft: "14px" }}>
              <span className="checkbox-item">
                <span className="box-sq">{isChecked(data.referral_source, "Friends / Relatives") ? "☑" : "☐"}</span> Friends / Relatives
              </span>
              <span className="checkbox-item">
                <span className="box-sq">{isChecked(data.referral_source, "Social Media") ? "☑" : "☐"}</span> Social Media
              </span>
              <span className="checkbox-item">
                <span className="box-sq">
                  {isChecked(data.referral_source, "Advertisement") || isChecked(data.referral_source, "Newspaper / Advertisement") ? "☑" : "☐"}
                </span>{" "}
                Advertisement
              </span>
              <span className="checkbox-item">
                <span className="box-sq">{isChecked(data.referral_source, "Other") ? "☑" : "☐"}</span> Other
              </span>
            </span>
          </div>

          <div className="form-line-grid-2">
            <div className="form-line">
              <span className="line-label">Preferred Date for School Visit:</span>
              <span className="single-line-val bold-val">{formatDate(data.preferred_visit_date)}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Any Questions / Remarks:</span>
              <span className="single-line-val bold-val">{data.enquiry_remarks || ""}</span>
            </div>
          </div>
        </div>

        {/* 4. FOR OFFICE USE ONLY */}
        <div className="enquiry-form-section office-box">
          <div className="section-heading office-head">4. FOR OFFICE USE ONLY</div>

          <div className="form-line-grid-2">
            <div className="form-line">
              <span className="line-label">Enquiry Handled By:</span>
              <span className="single-line-val bold-val">{counsellorName || ""}</span>
            </div>
            <div className="form-line">
              <span className="line-label">Follow-up Date:</span>
              <span className="single-line-val bold-val">{formatDate(data.follow_up_date)}</span>
            </div>
          </div>

          <div className="form-line-grid-2">
            <div className="form-line">
              <span className="line-label">School Tour:</span>
              <span className="checkbox-group">
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.school_tour_status, "Completed") ? "☑" : "☐"}</span> Completed
                </span>
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.school_tour_status, "Pending") ? "☑" : "☐"}</span> Pending
                </span>
              </span>
            </div>

            <div className="form-line">
              <span className="line-label">Principal Meet:</span>
              <span className="checkbox-group">
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.principal_meet_status, "Completed") ? "☑" : "☐"}</span> Completed
                </span>
                <span className="checkbox-item">
                  <span className="box-sq">{isChecked(data.principal_meet_status, "Pending") ? "☑" : "☐"}</span> Pending
                </span>
              </span>
            </div>
          </div>

          <div className="form-line full-line">
            <span className="line-label">Admission Status:</span>
            <span className="checkbox-group">
              <span className="checkbox-item">
                <span className="box-sq">{isChecked(data.status, "Interested") ? "☑" : "☐"}</span> Interested
              </span>
              <span className="checkbox-item">
                <span className="box-sq">{isChecked(data.status, "Follow-up Required") || isChecked(data.status, "Pending") ? "☑" : "☐"}</span> Follow-up Required
              </span>
              <span className="checkbox-item">
                <span className="box-sq">{isChecked(data.status, "Admitted") || isChecked(data.status, "Approved") ? "☑" : "☐"}</span> Admitted
              </span>
            </span>
          </div>

          <div className="form-line full-line">
            <span className="line-label">Remarks:</span>
            <span className="single-line-val bold-val">{data.office_remarks || ""}</span>
          </div>
        </div>

        {/* Parent & Counsellor Signature Lines */}
        <div className="enquiry-dual-signatures">
          <div className="dual-sig-item">
            <span className="sig-label">Parent&apos;s Signature:</span>
            <span className="sig-single-line"></span>
          </div>
          <div className="dual-sig-item">
            <span className="sig-label">Admission Counsellor&apos;s Signature:</span>
            <span className="sig-single-line"></span>
          </div>
        </div>

        {/* Approved Official Certificate Footer (Place, School Seal, Principal Signature block) */}
        <OfficialCertificateFooter showPlace={true} place="Shirur" />
      </div>
    </div>
  );
}
