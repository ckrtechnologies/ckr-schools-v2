import React, { useState, useEffect } from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";
import { formatDateHyphen } from "../utils/numberToWords.js";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getCurrentUser, getTenantSlug } from "../services/api.js";

export default function AttendanceCertificatePreview({ data, forwardRef, schoolInfo }) {
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

  const certNo = data.attendance_cert_no || "";
  const issueDate = data.issue_date
    ? formatDateHyphen(data.issue_date)
    : formatDateHyphen(new Date());

  const studentName = data.pupil_name || data.student_name || "";
  const admissionNo = data.admission_number || data.gr_no || "";
  const grade = data.class_name || data.last_studied_class_figure || "";
  const section = data.section || "";
  const academicYear = data.academic_year || defaultAcademicYear;

  const daysPresent = data.days_present !== undefined && data.days_present !== null ? data.days_present : "";
  const totalWorkingDays = data.total_working_days !== undefined && data.total_working_days !== null ? data.total_working_days : "";

  const attendancePercentage =
    totalWorkingDays && Number(totalWorkingDays) > 0
      ? ((Number(daysPresent || 0) / Number(totalWorkingDays)) * 100).toFixed(1)
      : "";

  const purpose =
    data.attendance_purpose ||
    data.cert_purpose ||
    "official records and administrative verification";

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
          <OfficialLetterheadHeader certificateTitle="ATTENDANCE CERTIFICATE" schoolInfo={profile} />

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
                <span>, studying in Grade <strong className="fill-val underline-strong">{grade}</strong></span>
              ) : null}
              {section ? (
                <span>, Section <strong className="fill-val underline-strong">{section}</strong></span>
              ) : null}, during the academic year{" "}
              <strong className="fill-val underline-strong">{academicYear}</strong> at{" "}
              <strong className="fill-val underline-strong">{schoolName}</strong>, was
              present for{" "}
              <strong className="fill-val underline-strong">{daysPresent || "—"}</strong> days
              out of{" "}
              <strong className="fill-val underline-strong">{totalWorkingDays || "—"}</strong>{" "}
              working days.
            </p>

            {attendancePercentage && (
              <p className="cert-body-p cert-body-highlight">
                Attendance percentage, if required and verified:{" "}
                <strong className="fill-val underline-strong">
                  {attendancePercentage}%
                </strong>
                .
              </p>
            )}

            <p className="cert-body-p">
              This certificate is issued upon request for{" "}
              <span className="fill-val underline-dotted">{purpose}</span>.
            </p>
          </div>

          {/* (1) Place (left), (2) School Seal (center), (3) Principal (right) */}
          <OfficialCertificateFooter showPlace={true} place={data.place || city} schoolInfo={profile} />
        </div>
      </div>
    </div>
  );
}
