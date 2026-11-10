import React, { useState, useEffect } from "react";
import { Lock, Mail, AlertCircle, School } from "lucide-react";
import { loginUser, getTenantSlug } from "../services/api.js";
import { applySchoolBranding, resolveAssetUrl, fetchSchoolProfile } from "../utils/branding.js";

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState(null);

  useEffect(() => {
    fetchSchoolProfile(getTenantSlug()).then((p) => {
      if (p) {
        setSchoolProfile(p);
        applySchoolBranding(p, "Teacher Manager");
      }
    });
  }, []);

  const schoolName = schoolProfile?.name || "School Campus";
  const logoUrl = resolveAssetUrl(schoolProfile?.logoUrl);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      if (res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg("Invalid email or password");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "420px" }}>
        <div style={{ padding: "2rem", textAlign: "center", background: "#ffffff" }}>
          {logoUrl ? (
            <img src={logoUrl} alt={schoolName} style={{ height: "60px", width: "60px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 1rem auto", display: "block" }} />
          ) : (
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "var(--accent-light)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
                color: "var(--accent-primary)"
              }}
            >
              <School size={28} />
            </div>
          )}

          <h2 style={{ fontFamily: "var(--heading-font)", fontSize: "1.25rem", fontWeight: 800 }}>
            {schoolName}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Teacher Monthly Score Board & Evaluation Manager
          </p>

          {errorMsg && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                textAlign: "left"
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem", textAlign: "left" }}>
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                Staff Email
              </label>
              <div style={{ position: "relative", marginTop: "4px" }}>
                <Mail
                  size={15}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@vis.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem"
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                Password
              </label>
              <div style={{ position: "relative", marginTop: "4px" }}>
                <Lock
                  size={15}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem"
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.65rem" }}
            >
              {loading ? "Signing in..." : "Sign In to Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
