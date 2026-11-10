import React from "react";
import { getCurrentUser } from "../services/api.js";

export default function OfficialCertificateFooter({ showPlace = true, place, schoolInfo }) {
  let profile = schoolInfo || null;
  if (!profile) {
    try {
      const cached = localStorage.getItem("activeSchoolProfile");
      if (cached) profile = JSON.parse(cached);
      if (!profile) {
        const u = getCurrentUser() || JSON.parse(localStorage.getItem("tc_auth_user") || "{}");
        if (u) {
          profile = {
            name: u.schoolName || u.name,
            city: u.schoolCity || u.city,
            state: u.schoolState || u.state
          };
        }
      }
    } catch {}
  }

  const schoolName = profile?.name || profile?.schoolName || "School Campus";
  const location = [profile?.city || profile?.schoolCity, profile?.state || profile?.schoolState]
    .filter(Boolean)
    .join(", ");
  const displayPlace = place || profile?.city || profile?.schoolCity || "";

  return (
    <div className="official-cert-footer">
      {/* (1) Left Column: Place */}
      <div className="footer-place-col">
        {showPlace && displayPlace && (
          <div className="footer-place-line">
            Place: <span className="place-val">{displayPlace}</span>
          </div>
        )}
      </div>

      {/* (2) Center Column: School Seal Area (Reserved empty for physical ink stamp) */}
      <div className="footer-seal-col">
        <div className="seal-empty-space" style={{ height: "65px", width: "80px" }}></div>
      </div>

      {/* (3) Right Column: Principal Signature */}
      <div className="footer-principal-col">
        <div className="principal-sig-line"></div>
        <div className="principal-title">Principal</div>
        <div className="principal-school">{schoolName}</div>
        {location && <div className="principal-location">{location}</div>}
      </div>
    </div>
  );
}
