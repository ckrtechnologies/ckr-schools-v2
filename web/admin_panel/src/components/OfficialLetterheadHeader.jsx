import React, { useState, useEffect } from "react";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";

/**
 * Universal Centralised Official School Letterhead Header Component
 * Renders verified CBSE school identity, crest, affiliation number, school code,
 * campus address, and contact details with zero layout shifts and offline cache.
 */
export default function OfficialLetterheadHeader({
  title,
  certificateTitle,
  subtitle,
  schoolInfo,
  layout = "standard", // "standard" | "compact" | "receipt"
  showLogo = true,
  showCodes = true,
  showAddress = true,
  showContact = true,
  showSeparator = true,
  className = "",
  style = {}
}) {
  const displayTitle = title || certificateTitle || "";

  // 1. Initialise synchronously from cache or prop to prevent blank flash
  const [profile, setProfile] = useState(() => {
    if (schoolInfo && (schoolInfo.name || schoolInfo.schoolName)) return schoolInfo;
    try {
      const cached = localStorage.getItem("activeSchoolProfile") || localStorage.getItem("schoolProfile");
      if (cached) return JSON.parse(cached);
      const userStored = localStorage.getItem("financeUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (userStored) {
        const u = JSON.parse(userStored);
        if (u.school && typeof u.school === "object") return u.school;
        if (u.schoolName) {
          return {
            name: u.schoolName,
            motto: u.schoolMotto || u.motto,
            trustName: u.trustName || u.schoolMotto || u.motto,
            affiliationBoard: u.affiliationBoard || "CBSE",
            boardAffiliationNumber: u.boardAffiliationNumber,
            schoolCode: u.schoolCode,
            officialEmail: u.schoolEmail || u.officialEmail,
            officialPhone: u.schoolPhone || u.officialPhone,
            website: u.schoolWebsite || u.website,
            address: u.schoolAddress || u.address,
            city: u.schoolCity || u.city,
            state: u.schoolState || u.state,
            pincode: u.schoolPincode || u.pincode,
            logoUrl: u.logoUrl || u.logo_url
          };
        }
      }
    } catch (e) {}
    return null;
  });

  // 2. Refresh live data from public profile endpoint
  useEffect(() => {
    if (schoolInfo && (schoolInfo.name || schoolInfo.schoolName)) {
      setProfile(schoolInfo);
      return;
    }

    let slug = "";
    try {
      slug = localStorage.getItem("tenantSlug") || "";
      if (!slug) {
        const u = JSON.parse(localStorage.getItem("financeUser") || localStorage.getItem("adminUser") || localStorage.getItem("user") || "{}");
        slug = u.schoolSlug || u.tenant_slug || "";
      }
    } catch (e) {}

    fetchSchoolProfile(slug).then((live) => {
      if (live && (live.name || live.schoolName)) {
        setProfile(live);
        try {
          localStorage.setItem("activeSchoolProfile", JSON.stringify(live));
        } catch (e) {}
      }
    });
  }, [schoolInfo]);

  const school = profile || {};
  const isVision = (school.slug || school.schoolSlug || localStorage.getItem("tenantSlug") || "").toLowerCase() === "vision";

  // Identity
  const schoolName = (
    school.name ||
    school.schoolName ||
    school.school_name ||
    (isVision ? "Vision International School" : "ARC School")
  ).toUpperCase();

  const trustName =
    school.trustName ||
    school.motto ||
    school.schoolMotto ||
    school.school_motto ||
    (isVision ? "Pokharana Educational Trust's" : "Inspiring Excellence, Empowering Minds");

  const rawLogo = school.logoUrl || school.logo_url;
  const logoSrc = rawLogo
    ? resolveAssetUrl(rawLogo)
    : (isVision ? "/vis_logo.png" : "/logo.png");

  // Statutory Codes
  const affiliationBoard = school.affiliationBoard || school.affiliation_board || "CBSE";
  const affilNumber =
    school.boardAffiliationNumber ||
    school.board_affiliation_number ||
    school.affiliation_number ||
    (isVision ? "1131336" : "2130889");

  const schoolCode =
    school.schoolCode ||
    school.school_code ||
    (isVision ? "31323" : "60401");

  const udiseCode =
    school.udiseCode ||
    school.udise_code ||
    (isVision ? "27251210534" : "");

  // Address
  const addressParts = [
    school.address || school.schoolAddress || (isVision ? "Survey No. 1155/26/5A Gujar Mala" : "Sector 128, Expressway"),
    school.city || school.schoolCity || (isVision ? "Shirur Dist.-Pune" : "Noida"),
    school.state || school.schoolState || (isVision ? "Maharashtra" : "Uttar Pradesh"),
    (school.pincode || school.schoolPincode)
      ? `Pin: ${school.pincode || school.schoolPincode}`
      : (isVision ? "Pin code -412210" : "Pin: 201304")
  ].filter(Boolean);
  const addressLine = addressParts.join(", ");

  // Contact
  const contactPhone =
    school.officialPhone ||
    school.schoolPhone ||
    school.phone ||
    (isVision ? "9168003333 / 4444" : "9876543210");

  const officialEmail =
    school.officialEmail ||
    school.schoolEmail ||
    school.email ||
    (isVision ? "vis.shirur@gmail.com" : "admin@arcschool.in");

  const website =
    school.website ||
    school.schoolWebsite ||
    (isVision ? "www.visionshirur.com" : "www.arcschool.in");

  const isCompact = layout === "compact" || layout === "receipt";

  return (
    <div
      className={`official-centralised-letterhead ${className}`}
      style={{
        width: "100%",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        color: "#0f172a",
        textAlign: "center",
        boxSizing: "border-box",
        ...style
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isCompact ? "10px" : "16px",
          padding: isCompact ? "4px 8px" : "8px 12px"
        }}
      >
        {showLogo && (
          <div style={{ flexShrink: 0, width: isCompact ? "56px" : "78px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={logoSrc}
              alt={`${schoolName} Crest`}
              style={{
                width: isCompact ? "54px" : "74px",
                height: isCompact ? "54px" : "74px",
                objectFit: "contain",
                borderRadius: "4px"
              }}
              onError={(e) => {
                e.target.src = "/logo.png";
              }}
            />
          </div>
        )}

        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          {trustName && (
            <div
              style={{
                fontSize: isCompact ? "0.72rem" : "0.82rem",
                fontWeight: "700",
                color: "#15803d",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "2px"
              }}
            >
              {trustName}
            </div>
          )}

          <h1
            style={{
              fontSize: isCompact ? "1.2rem" : "1.6rem",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "0.05em",
              margin: "2px 0 3px 0",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              lineHeight: 1.15
            }}
          >
            {schoolName}
          </h1>

          {showCodes && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px 14px",
                fontSize: isCompact ? "0.68rem" : "0.76rem",
                fontWeight: "700",
                color: "#334155",
                lineHeight: 1.3,
                margin: "2px 0"
              }}
            >
              {udiseCode && <span>UDISE: {udiseCode}</span>}
              {affilNumber && (
                <span>
                  {affiliationBoard} Affil No: <strong>{affilNumber}</strong>
                </span>
              )}
              {schoolCode && (
                <span>
                  School Code: <strong>{schoolCode}</strong>
                </span>
              )}
            </div>
          )}

          {showAddress && addressLine && (
            <div
              style={{
                fontSize: isCompact ? "0.66rem" : "0.74rem",
                fontWeight: "500",
                color: "#475569",
                lineHeight: 1.3,
                margin: "2px 0"
              }}
            >
              {addressLine}
            </div>
          )}

          {showContact && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "6px 12px",
                fontSize: isCompact ? "0.66rem" : "0.73rem",
                fontWeight: "600",
                color: "#1e293b",
                lineHeight: 1.3,
                marginTop: "2px"
              }}
            >
              {contactPhone && <span>Tel: {contactPhone}</span>}
              {officialEmail && <span>Email: {officialEmail}</span>}
              {website && <span>Website: {website}</span>}
            </div>
          )}
        </div>
      </div>

      {showSeparator && (
        <div style={{ margin: isCompact ? "6px 0 8px 0" : "10px 0 14px 0" }}>
          <div style={{ height: "2px", background: "#15803d", width: "100%", marginBottom: "1.5px" }} />
          <div style={{ height: "0.75px", background: "#15803d", width: "100%" }} />
        </div>
      )}

      {displayTitle && (
        <div style={{ textAlign: "center", margin: "4px 0 10px 0" }}>
          <h2
            style={{
              fontSize: isCompact ? "1.05rem" : "1.25rem",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#0f172a",
              margin: 0
            }}
          >
            {displayTitle}
          </h2>
          {subtitle && (
            <div
              style={{
                fontSize: isCompact ? "0.74rem" : "0.82rem",
                fontWeight: "600",
                color: "#64748b",
                marginTop: "2px"
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
