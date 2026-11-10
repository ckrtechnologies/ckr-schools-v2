import React, { useState, useEffect } from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";
import { formatDateHyphen } from "../utils/numberToWords.js";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getCurrentUser, getTenantSlug } from "../services/api.js";

export default function FeeStructureCertificatePreview({ data, forwardRef, schoolInfo }) {
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
  const nextYear = currentYear + 1;
  const defaultAcademicYear = `${currentYear}–${nextYear}`;

  const certNo = data.structure_cert_no || "";
  const issueDate = data.issue_date
    ? formatDateHyphen(data.issue_date)
    : formatDateHyphen(new Date());

  const studentName = data.pupil_name || data.student_name || "";

  const isMale = data.gender?.toLowerCase() === "male" || data.gender?.toLowerCase() === "m";
  const isFemale = data.gender?.toLowerCase() === "female" || data.gender?.toLowerCase() === "f";
  const genderPrefix =
    data.gender_prefix ||
    (isMale ? "Master" : isFemale ? "Miss" : "Master / Miss");

  const admissionNo = data.admission_number || data.gr_no || "";

  const grade = data.class_name || data.last_studied_class_figure || "";
  const academicYear = data.academic_year || defaultAcademicYear;

  const tuitionFee = data.fee_tuition_amount || "";
  const otherFees = data.fee_other_amount || "";
  const totalFees = data.fee_total_structure || "";

  const paymentNotes =
    data.fee_payment_notes ||
    "";

  const purpose =
    data.structure_purpose ||
    data.cert_purpose ||
    "Education Loan Sanctioning";

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
          <OfficialLetterheadHeader certificateTitle="FEE STRUCTURE CERTIFICATE" schoolInfo={profile} />

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
              This is to certify that the approved / applicable school fee structure for {genderPrefix}{" "}
              <strong className="fill-val underline-strong bold-val">{studentName || "—"}</strong>
              {admissionNo ? (
                <span>
                  , Admission No.{" "}
                  <strong className="fill-val underline-strong bold-val">{admissionNo}</strong>
                </span>
              ) : null}
              {grade ? (
                <span>
                  , studying in Grade <strong className="fill-val underline-strong bold-val">{grade}</strong>
                </span>
              ) : null} for the academic year{" "}
              <strong className="fill-val underline-strong bold-val">{academicYear}</strong> at{" "}
              <strong className="fill-val underline-strong bold-val">{schoolName}</strong>, is as follows:
            </p>

            {/* Fee Breakdown Box / Row */}
            <div className="fee-breakdown-card">
              <div className="fee-item">
                <span className="fee-label">Tuition fee:</span>
                <span className="fee-val">₹{tuitionFee || "0"}</span>
              </div>
              <span className="fee-pipe">|</span>
              <div className="fee-item">
                <span className="fee-label">Other approved fee(s):</span>
                <span className="fee-val">₹{otherFees || "0"}</span>
              </div>
              <span className="fee-pipe">|</span>
              <div className="fee-item fee-item-total">
                <span className="fee-label">Total:</span>
                <span className="fee-val">₹{totalFees || "0"}</span>
              </div>
            </div>

            {paymentNotes && (
              <p className="cert-body-p">
                Payment frequency / notes:{" "}
                <strong className="fill-val underline-field bold-val">{paymentNotes}</strong>.
              </p>
            )}

            <p className="cert-body-p">
              This certificate is issued upon request for{" "}
              <strong className="fill-val underline-field bold-val">{purpose}</strong>.
            </p>
          </div>

          {/* Seal & Signatures */}
          <OfficialCertificateFooter showPlace={true} place={data.place || city} schoolInfo={profile} />
        </div>
      </div>
    </div>
  );
}
