import React from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";
import { formatDateHyphen } from "../utils/numberToWords.js";
import { resolveAssetUrl } from "../utils/branding.js";
import { getCurrentUser } from "../services/api.js";

export default function BonafideCertificatePreview({ data, forwardRef, schoolInfo }) {
  if (!data) return null;

  let school = schoolInfo || null;
  if (!school) {
    try {
      const cached = localStorage.getItem("activeSchoolProfile");
      if (cached) school = JSON.parse(cached);
      if (!school) {
        const u = getCurrentUser() || JSON.parse(localStorage.getItem("tc_auth_user") || "{}");
        if (u) {
          school = {
            name: u.schoolName || u.name,
            logoUrl: u.logoUrl,
            city: u.schoolCity || u.city
          };
        }
      }
    } catch {}
  }

  const schoolName = school?.name || school?.schoolName || "this Institution";
  const rawLogo = school?.logoUrl || school?.logo_url;
  const logoSrc = rawLogo ? resolveAssetUrl(rawLogo) : null;

  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear - 1}–${currentYear}`;

  const certNo = data.bonafide_cert_no || "";
  const issueDate = data.issue_date
    ? formatDateHyphen(data.issue_date)
    : formatDateHyphen(new Date());

  const studentName = data.pupil_name || data.student_name || "";

  // Title prefix: Master / Miss
  const genderPrefix =
    data.gender_prefix ||
    (data.gender?.toLowerCase() === "male" || data.gender?.toLowerCase() === "m"
      ? "Master"
      : data.gender?.toLowerCase() === "female" || data.gender?.toLowerCase() === "f"
      ? "Miss"
      : "");

  // Relation prefix: son / daughter
  const relationPrefix =
    data.relation_prefix ||
    (genderPrefix === "Master"
      ? "son"
      : genderPrefix === "Miss"
      ? "daughter"
      : "ward");

  // Parent name
  const parentName =
    data.parent_name ||
    data.father_name ||
    data.mother_name ||
    "";

  const parentSalutation = parentName ? (data.parent_salutation || "Shri / Smt") : "";

  const grade = data.class_name || data.last_studied_class_figure || "";
  const section = data.section || "";
  const academicYear = data.academic_year || defaultAcademicYear;

  const dobDisplay = data.dob
    ? formatDateHyphen(data.dob)
    : "";

  const admissionNo = data.admission_number || data.gr_no || "";

  const purpose =
    data.bonafide_purpose ||
    data.cert_purpose ||
    "Educational and Administrative Verification";

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
          {/* Official School Header */}
          <OfficialLetterheadHeader certificateTitle="BONAFIDE CERTIFICATE" schoolInfo={school} />

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
              This is to certify that {genderPrefix}{" "}
              <strong className="fill-val underline-strong bold-val">{studentName}</strong>
              {parentName ? (
                <>
                  , {relationPrefix} of {parentSalutation}{" "}
                  <strong className="fill-val underline-strong bold-val">{parentName}</strong>
                </>
              ) : ""}
              , is a bonafide student of {schoolName}
              {grade ? (
                <>
                  , studying in Grade{" "}
                  <strong className="fill-val underline-strong bold-val">{grade}</strong>
                  {section ? (
                    <>
                      , Section <strong className="fill-val underline-strong bold-val">{section}</strong>
                    </>
                  ) : ""}
                </>
              ) : ""}
              {academicYear ? (
                <>
                  , during the academic year{" "}
                  <strong className="fill-val underline-strong bold-val">{academicYear}</strong>
                </>
              ) : ""}
              .
            </p>

            <p className="cert-body-p">
              As per the school records
              {dobDisplay ? (
                <>
                  , the student&apos;s Date of Birth is{" "}
                  <strong className="fill-val underline-strong bold-val">{dobDisplay}</strong>
                </>
              ) : ""}
              {admissionNo ? (
                <>
                  . The Admission No. is{" "}
                  <strong className="fill-val underline-strong bold-val">{admissionNo}</strong>
                </>
              ) : ""}
              .
            </p>

            <p className="cert-body-p">
              This certificate is issued upon the request of the parent / guardian for the purpose of{" "}
              <strong className="fill-val underline-field bold-val">{purpose}</strong>.
            </p>
          </div>

          {/* Place, School Seal & Principal Signature */}
          <OfficialCertificateFooter showPlace={true} schoolInfo={school} />
        </div>
      </div>
    </div>
  );
}
