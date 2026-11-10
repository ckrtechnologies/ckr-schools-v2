import React, { useState, useEffect } from "react";
import { Lock, Mail, AlertCircle, Shield } from "lucide-react";
import { loginUser, getTenantSlug } from "../services/api";
import { applySchoolBranding, resolveAssetUrl, fetchSchoolProfile } from "../utils/branding";

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schoolProfile, setSchoolProfile] = useState(null);

  useEffect(() => {
    fetchSchoolProfile(getTenantSlug()).then((p) => {
      if (p) {
        setSchoolProfile(p);
        applySchoolBranding(p, "Academic Portal");
      }
    });
  }, []);

  const schoolName = schoolProfile?.name || "School Campus";
  const logoUrl = resolveAssetUrl(schoolProfile?.logoUrl);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      const user = res.user || res;
      // Authorize academic manager, principal, admin, super_admin
      const allowedRoles = ["academic_manager", "admin", "principal", "super_admin", "staff"];
      if (user.type && !allowedRoles.includes(user.type)) {
        setError(`Access restricted. Your account type (${user.type}) is not authorized for Academic Management.`);
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: "420px", textAlign: "center" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={schoolName}
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.5rem auto", display: "block" }}
            />
          ) : (
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--primary-color, #064e3b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "20px", margin: "0 auto 0.5rem auto" }}>
              {schoolName.charAt(0)}
            </div>
          )}
          <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)" }}>
            {schoolName}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            Academic Manager • Governance &amp; Grading Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--danger-light)",
              color: "var(--danger)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              textAlign: "left",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anup@gmail.com"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2.2rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2.2rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem" }}
          >
            {loading ? "Authenticating..." : "Sign In to Academic Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}

