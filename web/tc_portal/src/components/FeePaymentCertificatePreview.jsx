import React, { useState, useEffect } from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";
import { formatDateHyphen } from "../utils/numberToWords.js";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getCurrentUser, getTenantSlug } from "../services/api.js";

export default function FeePaymentCertificatePreview({ data, forwardRef, schoolInfo }) {
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

  const certNo = data.fee_cert_no || "";
  const issueDate = data.issue_date
    ? formatDateHyphen(data.issue_date)
    : formatDateHyphen(new Date());

  const studentName = data.pupil_name || data.student_name || "";
  const admissionNo = data.admission_number || data.gr_no || "";
  const grade = data.class_name || data.last_studied_class_figure || "";
  const academicYear = data.academic_year || defaultAcademicYear;

  const feeAmount = data.fee_total_paid || data.total_paid_fees || "";
  const asOfDate =
    data.fee_as_of_date || formatDateHyphen(new Date());
  const feePeriodCovered =
    data.fee_period_covered ||
    "Comprehensive Academic Fees (Tuition, Development & Term Charges)";
  const purpose =
    data.fee_purpose ||
    data.cert_purpose ||
    "income tax rebate (Section 10/80C) and employer education allowance claim";

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
          <OfficialLetterheadHeader certificateTitle="FEE PAYMENT CERTIFICATE / FEE STATEMENT" schoolInfo={profile} />

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
              This is to certify that the school fee account of Master / Miss{" "}
              <strong className="fill-val underline-strong">{studentName || "—"}</strong>
              {admissionNo ? (
                <span>, Admission No. <strong className="fill-val underline-strong">{admissionNo}</strong></span>
              ) : null}
              {grade ? (
                <span>, Grade <strong className="fill-val underline-strong">{grade}</strong></span>
              ) : null}, for the academic year{" "}
              <strong className="fill-val underline-strong">{academicYear}</strong> at{" "}
              <strong className="fill-val underline-strong">{schoolName}</strong>, reflects payments totalling{" "}
              <strong className="fill-val underline-strong">₹{feeAmount || "0"}</strong> as of{" "}
              <strong className="fill-val underline-strong">{asOfDate}</strong>.
            </p>

            <p className="cert-body-p">
              Fee details / period covered:{" "}
              <span className="fill-val underline-dotted">{feePeriodCovered}</span>.
            </p>

            <p className="cert-body-p">
              This statement is based on the school&apos;s verified fee records and is issued
              upon request for{" "}
              <span className="fill-val underline-dotted">{purpose}</span>.
            </p>
          </div>

          {/* Seal & Signatures */}
          <OfficialCertificateFooter showPlace={true} place={data.place || city} schoolInfo={profile} />
        </div>
      </div>
    </div>
  );
}
