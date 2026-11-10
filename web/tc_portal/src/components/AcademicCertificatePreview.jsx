import React, { useState, useEffect } from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";
import { formatDateHyphen } from "../utils/numberToWords.js";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getCurrentUser, getTenantSlug } from "../services/api.js";

export default function AcademicCertificatePreview({ data, forwardRef, schoolInfo }) {
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

  if (!data) return null;

  const school = profile || currentUser || {};
  const schoolName = (school.name || school.schoolName || "this Institution");
  const rawLogo = school.logoUrl || school.logo_url;
  const logoSrc = rawLogo ? resolveAssetUrl(rawLogo) : null;
  const city = school.city || school.schoolCity || "";

  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear - 1}–${currentYear}`;

  const certNo = data.academic_cert_no || "";
  const issueDate = data.issue_date
    ? formatDateHyphen(data.issue_date)
    : formatDateHyphen(new Date());

  const studentName = data.pupil_name || data.student_name || "";
  const admissionNo = data.admission_number || data.gr_no || "";
  const grade = data.class_name || data.last_studied_class_figure || "";
  const academicYear = data.academic_year || defaultAcademicYear;

  const academicResult =
    data.academic_result ||
    data.annual_exam_result ||
    "";
  const examAssessment =
    data.exam_assessment || "";
  const marksGrade =
    data.marks_grade || "";

  const purpose =
    data.academic_purpose ||
    data.cert_purpose ||
    "higher admission and official verification purposes";

  return (
    <div className="certificate-page-wrapper">
      <div
        className="cbse-certificate letterhead-certificate"
        ref={forwardRef}
        id="printable-certificate"
      >
        {/* Background Watermark */}
        {logoSrc && (
          <div className="cert-watermark-container" aria-hidden="true">
            <img
              src={logoSrc}
              alt=""
              className="cert-watermark-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="letterhead-cert-border">
          {/* Header */}
          <OfficialLetterheadHeader certificateTitle="ACADEMIC PERFORMANCE CERTIFICATE" schoolInfo={profile} />

          {/* Certificate Number & Date Bar */}
          <div className="cert-doc-meta-bar">
            <div className="meta-bar-item">
              <span className="meta-bar-label">Certificate No.:</span>
              <span className="meta-bar-val underline-field">{certNo || "—"}</span>
            </div>
            <div className="meta-bar-item">
              <span className="meta-bar-label">Date:</span>
              <span className="meta-bar-val underline-field">{issueDate}</span>
            </div>
          </div>

          {/* Certificate Body Paragraphs */}
          <div className="cert-letter-body">
            <p className="cert-body-p">
              This is to certify that Master / Miss{" "}
              <strong className="fill-val underline-strong">{studentName || "—"}</strong>
              {admissionNo ? (
                <span>, Admission No. <strong className="fill-val underline-strong">{admissionNo}</strong></span>
              ) : null}
              {grade ? (
                <span>, studied in Grade <strong className="fill-val underline-strong">{grade}</strong></span>
              ) : null} during the academic year{" "}
              <strong className="fill-val underline-strong">{academicYear}</strong> at{" "}
              <strong className="fill-val underline-strong">{schoolName}</strong>.
            </p>

            <p className="cert-body-p">
              According to the school&apos;s verified records, the student&apos;s academic
              result was:{" "}
              <strong className="fill-val underline-strong">{academicResult || "Passed / Promoted"}</strong>
              {examAssessment ? (
                <span> (examination / assessment: <span className="fill-val underline-dotted">{examAssessment}</span>)</span>
              ) : null}
              {marksGrade ? (
                <span>; marks / grade: <strong className="fill-val underline-strong">{marksGrade}</strong></span>
              ) : null}.
            </p>

            <p className="cert-body-p">
              This certificate records the information stated above and is issued upon
              request for <span className="fill-val underline-dotted">{purpose}</span>.
            </p>
          </div>

          {/* Seal & Signatures */}
          <OfficialCertificateFooter showPlace={true} place={data.place || city} schoolInfo={profile} />
        </div>
      </div>
    </div>
  );
}
