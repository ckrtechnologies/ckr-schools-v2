import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LogOut,
  Calendar,
  Clock,
  Users,
  MapPin,
  ExternalLink,
  BookOpen,
  GraduationCap,
  ChevronDown,
  Grid,
  Sliders,
  UserCheck,
  Sparkles,
  Bell,
} from "lucide-react";
import BellScheduleModal from "../components/BellScheduleModal";
import { logout } from "../features/authSlice";
import { getTenantSlug } from "../services/api";
import { applySchoolBranding, resolveAssetUrl, fetchSchoolProfile } from "../utils/branding";

const NavItem = ({ to, href, icon: Icon, color, bg, children, badge }) => {
  const content = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", pointerEvents: "none" }}>
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "5px",
          background: bg,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 1px 2px ${bg}`
        }}
      >
        <Icon size={12.5} strokeWidth={2.4} />
      </div>
      <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: "600", lineHeight: 1.2 }}>{children}</span>
      {badge}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.18rem 0.5rem",
          borderRadius: "6px",
          color: "var(--text-secondary)",
          textDecoration: "none",
          transition: "all 0.2s ease"
        }}
        className="table-row-hover"
      >
        {content}
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.18rem 0.5rem",
        borderRadius: "6px",
        color: isActive ? "var(--accent-primary)" : "var(--text-primary)",
        background: isActive ? "var(--accent-light)" : "transparent",
        textDecoration: "none",
        transition: "all 0.2s ease",
        borderLeft: isActive ? "3px solid var(--accent-primary)" : "3px solid transparent"
      })}
    >
      {content}
    </NavLink>
  );
};

const PortalLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useSelector((state) => state.auth.user);
  const [isBellModalOpen, setIsBellModalOpen] = useState(false);
  const user = authUser || (() => {
    try {
      return JSON.parse(localStorage.getItem("ttPortalUser")) || null;
    } catch (e) {
      return null;
    }
  })();

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    fetchSchoolProfile(getTenantSlug()).then((p) => {
      if (p) {
        setProfile(p);
        applySchoolBranding(p, "Timetable Portal");
      }
    });
  }, []);

  const schoolName = user?.schoolName || profile?.name || "School Campus";
  const logoUrl = resolveAssetUrl(user?.logoUrl || profile?.logoUrl);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (id) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const NavSection = ({ id, title, routes = [], children }) => {
    const isCollapsed = !!collapsedSections[id];
    const hasActiveChild = routes.some((r) => location.pathname === r);

    return (
      <div style={{ marginBottom: "0.35rem" }}>
        <div
          onClick={() => toggleSection(id)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.15rem 0.5rem",
            cursor: "pointer",
            userSelect: "none",
            borderRadius: "4px",
          }}
          className="table-row-hover"
        >
          <span
            style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--accent-primary)",
              fontWeight: "800",
              lineHeight: 1.1,
            }}
          >
            {title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {isCollapsed && hasActiveChild && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-primary)",
                }}
              />
            )}
            <ChevronDown
              size={12}
              strokeWidth={2.4}
              style={{
                color: "var(--text-secondary)",
                transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </div>
        {!isCollapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  const currentSlug = getTenantSlug() || "";
  const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const adminUrl = import.meta.env.VITE_ADMIN_URL || (isLocalHost ? `http://localhost:5174/login?tenant=${encodeURIComponent(currentSlug)}` : `https://admin.ckrschools.online/login?tenant=${encodeURIComponent(currentSlug)}`);
  const financeUrl = import.meta.env.VITE_FINANCE_URL || (isLocalHost ? `http://localhost:5177/login?tenant=${encodeURIComponent(currentSlug)}` : `https://finance.ckrschools.online/login?tenant=${encodeURIComponent(currentSlug)}`);
  const admissionsUrl = import.meta.env.VITE_ADMISSIONS_URL || (isLocalHost ? `http://localhost:5176/login?tenant=${encodeURIComponent(currentSlug)}` : `https://admissions.ckrschools.online/login?tenant=${encodeURIComponent(currentSlug)}`);

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      <style>
        {`
          .sidebar-nav::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Sidebar */}
      <aside
        className="glass-panel"
        style={{
          width: "235px",
          padding: "0.55rem 0.6rem",
          display: "flex",
          flexDirection: "column",
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Brand Header */}
        <div style={{ marginBottom: "0.55rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName}
                style={{
                  height: "34px",
                  width: "34px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                }}
              />
            ) : (
              <div
                style={{
                  height: "34px",
                  width: "34px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-color, #064e3b)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                }}
              >
                {schoolName.charAt(0)}
              </div>
            )}
            <div>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  lineHeight: 1.15,
                }}
              >
                {schoolName}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  lineHeight: 1.1,
                }}
              >
                Timetable Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="sidebar-nav"
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            paddingRight: "0.1rem",
            paddingTop: "0.5rem",
          }}
        >
          <NavItem
            to="/timetable"
            icon={Clock}
            color="#1b8b3b"
            bg="rgba(27, 139, 59, 0.15)"
          >
            Timetables
          </NavItem>

          <NavItem
            to="/proxies"
            icon={UserCheck}
            color="#d97706"
            bg="rgba(217, 119, 6, 0.15)"
            badge={
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "800",
                  padding: "1px 5px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(217, 119, 6, 0.15)",
                  color: "#d97706",
                  letterSpacing: "0.03em",
                }}
              >
                DAILY
              </span>
            }
          >
            Proxies
          </NavItem>

          <NavItem
            to="/teachers"
            icon={GraduationCap}
            color="#2563eb"
            bg="rgba(37, 99, 235, 0.15)"
          >
            Teachers
          </NavItem>

          <NavItem
            to="/quotas"
            icon={Sliders}
            color="#7c3aed"
            bg="rgba(124, 58, 237, 0.15)"
          >
            Quotas
          </NavItem>

          <NavItem
            to="/generator"
            icon={Sparkles}
            color="#059669"
            bg="rgba(5, 150, 105, 0.15)"
            badge={
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "800",
                  padding: "1px 5px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(5, 150, 105, 0.15)",
                  color: "#059669",
                  letterSpacing: "0.03em",
                }}
              >
                AUTO
              </span>
            }
          >
            Generator
          </NavItem>

          <NavItem
            to="/subjects"
            icon={BookOpen}
            color="#ea580c"
            bg="rgba(234, 88, 12, 0.15)"
          >
            Subjects
          </NavItem>

          <NavItem
            to="/rooms"
            icon={MapPin}
            color="#0284c7"
            bg="rgba(2, 132, 199, 0.15)"
          >
            Rooms
          </NavItem>

          <div style={{ marginTop: "0.8rem", marginBottom: "0.25rem", padding: "0 0.35rem" }}>
            <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-primary)", fontWeight: "800" }}>
              Portals
            </span>
          </div>

          <NavItem
            href={adminUrl}
            icon={ExternalLink}
            color="#475569"
            bg="rgba(71, 85, 105, 0.12)"
          >
            Admin
          </NavItem>

          <NavItem
            href={admissionsUrl}
            icon={ExternalLink}
            color="#475569"
            bg="rgba(71, 85, 105, 0.12)"
          >
            Admissions
          </NavItem>

          <NavItem
            href={financeUrl}
            icon={ExternalLink}
            color="#475569"
            bg="rgba(71, 85, 105, 0.12)"
          >
            Finance
          </NavItem>
        </nav>

        {/* Bell Schedule Settings Trigger */}
        <div style={{ marginTop: "auto", paddingBottom: "0.45rem" }}>
          <button
            onClick={() => setIsBellModalOpen(true)}
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: "0.5rem",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              padding: "0.3rem 0.5rem",
              borderRadius: "6px",
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              cursor: "pointer",
            }}
            title="Configure school lecture duration, assembly, and recess/lunch intervals"
          >
            <Bell size={13} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontWeight: "600" }}>Bell Timings</span>
          </button>
        </div>

        {/* User profile & Logout */}
        <div
          style={{
            borderTop: "1px solid var(--glass-border)",
            paddingTop: "0.45rem",
          }}
        >
          <div
            style={{
              marginBottom: "0.35rem",
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(27, 139, 59, 0.15)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {user?.name || "Attendance Manager"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              gap: "0.4rem",
              color: "#dc2626",
              backgroundColor: "rgba(220, 38, 38, 0.06)",
              border: "1px solid rgba(220, 38, 38, 0.15)",
              fontSize: "0.8rem",
              padding: "0.22rem 0.5rem",
              borderRadius: "6px",
            }}
          >
            <LogOut size={14} strokeWidth={2.4} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content - 100% full height of canvas without outer page scroll */}
      <main
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>

      {/* Bell Schedule Configuration Modal */}
      <BellScheduleModal
        isOpen={isBellModalOpen}
        onClose={() => setIsBellModalOpen(false)}
        onSaved={(savedSettings) => {
          window.dispatchEvent(new window.CustomEvent("timetable-settings-updated", { detail: savedSettings }));
        }}
      />
    </div>
  );
};

export default PortalLayout;
