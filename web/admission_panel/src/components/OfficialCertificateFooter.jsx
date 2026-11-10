import React from "react";

export default function OfficialCertificateFooter({ showPlace = true, place = "Shirur" }) {
  return (
    <div className="official-cert-footer">
      {/* (1) Left Column: Place */}
      <div className="footer-place-col">
        {showPlace && (
          <div className="footer-place-line">
            Place: <span className="place-val">{place}</span>
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
        <div className="principal-school">Vision International School</div>
        <div className="principal-location">Shirur, Pune</div>
      </div>
    </div>
  );
}
