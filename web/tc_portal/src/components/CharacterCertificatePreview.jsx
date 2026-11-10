import React, { useState, useEffect } from "react";
import OfficialLetterheadHeader from "./OfficialLetterheadHeader.jsx";
import OfficialCertificateFooter from "./OfficialCertificateFooter.jsx";
import { formatDateHyphen } from "../utils/numberToWords.js";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";
import { getCurrentUser, getTenantSlug } from "../services/api.js";

export default function CharacterCertificatePreview({ data, forwardRef, schoolInfo }) {
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

  const certNo = data.character_cert_no || "";
  const issueDate = data.issue_date
    ? formatDateHyphen(data.issue_date)
    : formatDateHyphen(new Date());

  const studentName = data.pupil_name || data.student_name || "";

  // Gender prefix: Master / Miss
  const isFemale = data.gender?.toLowerCase() === "female" || data.gender?.toLowerCase() === "f";
  const genderPrefix =
    data.gender_prefix ||
    (data.gender ? (isFemale ? "Miss" : "Master") : "");

  // Relation prefix: son / daughter / ward
  const relationPrefix =
    data.relation_prefix ||
    (genderPrefix === "Miss" ? "daughter" : genderPrefix === "Master" ? "son" : "ward");

  // Pronoun: his / her
  const pronounPossessive =
    data.pronoun_possessive || (genderPrefix === "Miss" ? "her" : "his");

  const pronounObjective =
    data.pronoun_objective || (genderPrefix === "Miss" ? "her" : "him");

  // Parent name
  const parentName =
    data.parent_name ||
    data.father_name ||
    data.mother_name ||
    "";

  const parentSalutation = parentName ? (data.parent_salutation || "Shri / Smt") : "";

  const grade = data.class_name || data.last_studied_class_figure || "";
  const academicYear = data.academic_year || defaultAcademicYear;

  const conductAssessment =
    data.character_conduct ||
    data.general_conduct ||
    "satisfactory";

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
          <OfficialLetterheadHeader certificateTitle="CHARACTER CERTIFICATE" schoolInfo={profile} />

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
              <strong className="fill-val underline-strong bold-val">{studentName || "—"}</strong>
              {parentName && (
                <span>
                  , {relationPrefix} of {parentSalutation}{" "}
                  <strong className="fill-val underline-strong bold-val">{parentName}</strong>
                </span>
              )}, was a student of <strong className="fill-val underline-strong bold-val">{schoolName}</strong>
              {grade && (
                <span>
                  , studying in Grade <strong className="fill-val underline-strong bold-val">{grade}</strong>
                </span>
              )} during the academic year{" "}
              <strong className="fill-val underline-strong bold-val">{academicYear}</strong>.
            </p>

            <p className="cert-body-p">
              As per the school records and observations, the student has demonstrated good conduct and behaviour during{" "}
              {pronounPossessive} tenure at the school.
            </p>

            <p className="cert-body-p">
              To the best of our knowledge, the student&apos;s conduct and character have been{" "}
              <strong className="fill-val underline-strong bold-val">{conductAssessment}</strong>.
            </p>

            <p className="cert-body-p">
              We wish {pronounObjective} success in all future endeavours.
            </p>
          </div>

          {/* Place, School Seal & Principal Signature */}
          <OfficialCertificateFooter showPlace={true} place={data.place || city} schoolInfo={profile} />
        </div>
      </div>
    </div>
  );
}
