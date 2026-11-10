import React, { useState, useEffect } from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import { formatDateDisplay } from "../utils/numberToWords.js";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getCurrentUser, getTenantSlug } from "../services/api.js";

export default function CertificatePreview({ data, forwardRef, schoolInfo }) {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState(schoolInfo || null);

  useEffect(() => {
    if (schoolInfo) {
      setProfile(schoolInfo);
      return;
    }
    const slug = currentUser?.schoolSlug || getTenantSlug();
    fetchSchoolProfile(slug).then((p) => {
      if (p) setProfile(p);
    });
  }, [schoolInfo, currentUser?.schoolSlug]);

  const school = profile || currentUser || {};
  const schoolName = (school.name || school.schoolName || "School Campus").toUpperCase();
  const trustName = school.trustName || school.trust_name || school.schoolMotto || school.motto || "";

  const rawLogo = school.logoUrl || school.logo_url;
  const logoSrc = rawLogo ? resolveAssetUrl(rawLogo) : null;

  const addressParts = [
    school.schoolAddress || school.address,
    school.schoolCity || school.city,
    school.schoolState || school.state,
    (school.schoolPincode || school.pincode) ? `Pin: ${String(school.schoolPincode || school.pincode).trim()}` : null,
  ].filter(Boolean);

  const addressLine = addressParts.join(", ");

  const affiliationBoard = school.affiliationBoard || school.affiliation_board || "CBSE";
  const affilNumber = school.boardAffiliationNumber || school.board_affiliation_number || "";
  const schoolCode = school.schoolCode || school.school_code || "";
  const udiseCode = data.udise_no || school.udiseCode || school.udise_code || "";

  const contactNo = school.officialPhone || school.schoolPhone || school.phone || "";
  const email = school.officialEmail || school.schoolEmail || school.email || "";
  const website = school.website || school.schoolWebsite || "";
  if (!data) return null;

  // Metadata identifiers (Zero mock fallbacks - clean blanks if not recorded in database)
  const srNo = data.sr_no || data.tc_number || "";
  const grNo = data.gr_no || data.admission_number || "";
  const penNo = data.pen_no || "";
  const udiseNo = data.udise_no || udiseCode || "";
  const aadharNo = data.aadhar_no || data.aadhar_card_no || "";
  const issueDateFormatted = data.issue_date
    ? formatDateDisplay(data.issue_date)
    : formatDateDisplay(new Date());
  const applicationDateFormatted = data.application_date
    ? formatDateDisplay(data.application_date)
    : formatDateDisplay(new Date());

  // 23 CBSE standard fields
  const pupilName = data.pupil_name || data.student_name || "";
  const motherName = data.mother_name || "";
  const fatherName = data.father_name || "";
  const dobFigures = data.dob ? formatDateDisplay(data.dob) : "";
  const dobWords = data.dob_words || "";
  const birthPlace = data.birth_place || data.place_of_birth || "";
  const nationality = data.nationality || "Indian";
  const categoryCaste = data.religion_caste || data.category || "";
  
  const firstAdmissionDate = data.first_admission_date ? formatDateDisplay(data.first_admission_date) : "";
  const firstAdmissionClass = data.first_admission_class || "";
  const firstAdmissionCombined = data.admission_date_class || (firstAdmissionDate && firstAdmissionClass ? `${firstAdmissionDate} and ${firstAdmissionClass}` : firstAdmissionDate || firstAdmissionClass || "");

  const lastClassFigure = data.last_studied_class_figure || "";
  const lastClassWords = data.last_studied_class_words || "";

  const annualExamResult = data.annual_exam_result || "";
  const failedStatus = data.failed_status || "NA";
  const subjectsStudied = data.subjects_studied || "";
  
  const qualifiedPromotion = data.qualified_for_promotion || "Yes";
  const promotionFigure = data.promotion_class_figure || "";
  const promotionWords = data.promotion_class_words || "";

  const duesPaidMonth = data.dues_paid_month || "";
  const feeConcession = data.fee_concession || "NA";
  const totalWorkingDays = data.total_working_days !== undefined && data.total_working_days !== null ? data.total_working_days : "";
  const daysPresent = data.days_present !== undefined && data.days_present !== null ? data.days_present : "";
  const nccScout = data.ncc_scout || "NA";
  const extraCurricular = data.extra_curricular || "";
  const generalConduct = data.general_conduct || data.conduct || "Good";
  const reasonForLeaving = data.reason_for_leaving || "";
  const remarks = data.remarks || "—";

  return (
    <div className="certificate-page-wrapper">
      <div className="cbse-certificate tc-23-certificate" ref={forwardRef} id="printable-certificate">
        
        {/* Background Watermark */}
        {logoSrc && (
          <div className="cert-watermark-container" aria-hidden="true">
            <img
              src={logoSrc}
              alt=""
              className="cert-watermark-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}

        {/* Certificate Outer Border Frame */}
        <div className="cbse-border-outer">

          {/* Centralised Common Official Letterhead Header Component */}
          <OfficialLetterheadHeader certificateTitle="LEAVING CERTIFICATE" schoolInfo={profile} />

          {/* Header Metadata Bar */}
          <div className="tc23-meta-grid">
            <div className="tc23-meta-row">
              <div className="tc23-meta-col">
                <span className="meta-lbl">G.R. No. :</span>
                <span className="meta-val underline-meta bold-val">{grNo}</span>
              </div>
              <div className="tc23-meta-col">
                <span className="meta-lbl">Sr. No. :</span>
                <span className="meta-val underline-meta bold-val">{srNo}</span>
              </div>
              <div className="tc23-meta-col">
                <span className="meta-lbl">Date :</span>
                <span className="meta-val underline-meta bold-val">{issueDateFormatted}</span>
              </div>
            </div>

            <div className="tc23-meta-row">
              <div className="tc23-meta-col">
                <span className="meta-lbl">PEN NO :</span>
                <span className="meta-val underline-meta bold-val">{penNo}</span>
              </div>
              <div className="tc23-meta-col">
                <span className="meta-lbl">Aadhaar Card No :</span>
                <span className="meta-val underline-meta bold-val">{aadharNo}</span>
              </div>
            </div>
          </div>

          {/* Clean 2-Column Table for the 24 CBSE Items */}
          <table className="tc-two-col-table">
            <tbody>
              {/* 01 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">01.</span> Name of Pupil
                </td>
                <td className="tc-tbl-val bold-val">{pupilName}</td>
              </tr>

              {/* 02 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">02.</span> Mother&apos;s Name
                </td>
                <td className="tc-tbl-val bold-val">{motherName}</td>
              </tr>

              {/* 03 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">03.</span> Father&apos;s Name / Guardian&apos;s Name
                </td>
                <td className="tc-tbl-val bold-val">{fatherName}</td>
              </tr>

              {/* 04 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">04.</span> Date of birth (in Christian Era) according to Admission &amp; Withdrawal Register
                </td>
                <td className="tc-tbl-val bold-val">
                  <div className="dob-cell-grid">
                    <div>
                      <span className="dob-tag">(in figures)</span>{" "}
                      <strong className="bold-val">{dobFigures}</strong>
                    </div>
                    <div>
                      <span className="dob-tag">(in words)</span>{" "}
                      <strong className="bold-val">{dobWords}</strong>
                    </div>
                  </div>
                </td>
              </tr>

              {/* 05 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">05.</span> Place of Birth
                </td>
                <td className="tc-tbl-val bold-val">{birthPlace}</td>
              </tr>

              {/* 06 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">06.</span> Nationality
                </td>
                <td className="tc-tbl-val bold-val">{nationality}</td>
              </tr>

              {/* 07 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">07.</span> Whether candidate belongs to SC / ST / OBC *
                </td>
                <td className="tc-tbl-val bold-val">{categoryCaste}</td>
              </tr>

              {/* 08 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">08.</span> Date of first Admission in the School with class
                </td>
                <td className="tc-tbl-val bold-val">{firstAdmissionCombined}</td>
              </tr>

              {/* 09 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">09.</span> Class in which the pupil last studied
                </td>
                <td className="tc-tbl-val bold-val">
                  <span className="dob-tag">(in figures)</span>{" "}
                  <strong className="bold-val">{lastClassFigure}</strong>
                  <span className="dob-tag" style={{ marginLeft: "14px" }}>(in words)</span>{" "}
                  <strong className="bold-val">{lastClassWords}</strong>
                </td>
              </tr>

              {/* 10 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">10.</span> School/Board Annual Examination last taken with result
                </td>
                <td className="tc-tbl-val bold-val">{annualExamResult}</td>
              </tr>

              {/* 11 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">11.</span> Whether failed once/twice in same class
                </td>
                <td className="tc-tbl-val bold-val">{failedStatus}</td>
              </tr>

              {/* 12 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">12.</span> Subjects Studied
                </td>
                <td className="tc-tbl-val bold-val">{subjectsStudied}</td>
              </tr>

              {/* 13 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">13.</span> Whether qualified for promotion to higher class
                </td>
                <td className="tc-tbl-val bold-val">
                  <strong className="bold-val">{qualifiedPromotion}</strong>
                  {qualifiedPromotion?.toLowerCase() === "yes" && (
                    <span style={{ marginLeft: "12px" }}>
                      <span className="dob-tag">(to class in fig.)</span>{" "}
                      <strong className="bold-val">{promotionFigure}</strong>
                      <span className="dob-tag" style={{ marginLeft: "10px" }}>(in words)</span>{" "}
                      <strong className="bold-val">{promotionWords}</strong>
                    </span>
                  )}
                </td>
              </tr>

              {/* 14 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">14.</span> Month upto which the pupil has paid school dues
                </td>
                <td className="tc-tbl-val bold-val">{duesPaidMonth}</td>
              </tr>

              {/* 15 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">15.</span> Any fee concession availed of (nature of concession)
                </td>
                <td className="tc-tbl-val bold-val">{feeConcession}</td>
              </tr>

              {/* 16 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">16.</span> Total No. of working days in academic session
                </td>
                <td className="tc-tbl-val bold-val">{totalWorkingDays}</td>
              </tr>

              {/* 17 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">17.</span> Total No. of working days pupil present in school
                </td>
                <td className="tc-tbl-val bold-val">{daysPresent}</td>
              </tr>

              {/* 18 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">18.</span> Whether NCC Cadet/Boy Scout/Girl Guide
                </td>
                <td className="tc-tbl-val bold-val">{nccScout}</td>
              </tr>

              {/* 19 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">19.</span> Games played / extra-curricular activities
                </td>
                <td className="tc-tbl-val bold-val">{extraCurricular}</td>
              </tr>

              {/* 20 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">20.</span> General Conduct
                </td>
                <td className="tc-tbl-val bold-val">{generalConduct}</td>
              </tr>

              {/* 21 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">21.</span> Date of application for certificate
                </td>
                <td className="tc-tbl-val bold-val">{applicationDateFormatted}</td>
              </tr>

              {/* 22 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">22.</span> Date of issue of certificate
                </td>
                <td className="tc-tbl-val bold-val">{issueDateFormatted}</td>
              </tr>

              {/* 23 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">23.</span> Reasons for leaving the school
                </td>
                <td className="tc-tbl-val bold-val">{reasonForLeaving}</td>
              </tr>

              {/* 24 */}
              <tr>
                <td className="tc-tbl-label">
                  <span className="tc-tbl-num">24.</span> Any Other Remark
                </td>
                <td className="tc-tbl-val bold-val">{remarks}</td>
              </tr>
            </tbody>
          </table>

          {/* Statutory Note Section */}
          <div className="statutory-note-section">
            <div className="statutory-certify">
              Certified that above information is in accordance with the School General Register
            </div>
            <div className="statutory-note">
              {school.statutoryRecognitionNote || school.statutory_recognition_note || (
                'Note: No change in any entry in this certificate shall be made except by the authority issuing it, and any infringement of this rule will be dealt with under applicable Board regulations.'
              )}
            </div>
          </div>

          {/* Signatures & Seal Section: Clerk (left), Stamp (center), Principal (right) */}
          <div className="cert-signatures-section">
            {/* Clerk Column (Bottom Left) */}
            <div className="sig-column clerk-column">
              <div className="sig-space"></div>
              <div className="sig-designation">CLERK / PREPARED BY</div>
              <div className="sig-school-name">{schoolName}</div>
              <div className="sig-address">{addressLine || ""}</div>
            </div>

            {/* School Seal Center (Empty for physical ink stamp) */}
            <div className="sig-column seal-column">
              <div className="seal-empty-space" style={{ height: "65px" }}></div>
            </div>

            {/* Principal Column (Bottom Right) */}
            <div className="sig-column principal-column">
              <div className="sig-space"></div>
              <div className="sig-designation">PRINCIPAL / HEAD OF SCHOOL</div>
              <div className="sig-school-name">{schoolName}</div>
              <div className="sig-address">{addressLine || ""}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
