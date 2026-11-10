import React, { useState, useEffect } from "react";
import { BookOpen, Calendar, CheckSquare, FileText, Award, LogOut } from "lucide-react";
import { resolveAssetUrl, fetchSchoolProfile } from "../utils/branding";
import { getTenantSlug } from "../services/api";

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    fetchSchoolProfile(getTenantSlug()).then((p) => {
      if (p) setProfile(p);
    });
  }, []);

  const schoolName = user?.schoolName || profile?.name || "School Campus";
  const logoUrl = resolveAssetUrl(user?.logoUrl || profile?.logoUrl);

  const tabs = [
    { id: "distributions", label: "Marks Distribution", icon: BookOpen },
    { id: "datesheets", label: "Date Sheets", icon: Calendar },
    { id: "tracker", label: "Grading Tracker", icon: CheckSquare },
    { id: "coscholastic", label: "Co-Scholastic", icon: Award },
    { id: "reportcards", label: "CBSE Report Cards", icon: FileText },
  ];

  return (
    <header className="portal-header">
      <div className="brand-wrapper">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={schoolName}
            className="brand-logo"
            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-color, #064e3b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px" }}>
            {schoolName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="brand-title">{schoolName}</h1>
          <p className="brand-subtitle">Academic Manager • Governance &amp; Grading Portal</p>
        </div>
      </div>

      <nav className="tabs-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="header-actions">
        {user ? (
          <div className="user-badge">
            <div className="user-avatar-circle">
              {user.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: "700", lineHeight: 1.1 }}>
                {user.name || "Academic Manager"}
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                {user.email || user.type || "Staff"}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-ghost"
              style={{ padding: "0.35rem", marginLeft: "0.4rem", color: "var(--danger)" }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Not logged in</span>
        )}
      </div>
    </header>
  );
}

