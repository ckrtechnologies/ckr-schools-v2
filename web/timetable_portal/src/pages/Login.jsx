import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, Calendar, Lock, Mail } from "lucide-react";
import { loginSuccess } from "../features/authSlice";
import { login, getTenantSlug } from "../services/api";
import { applySchoolBranding, resolveAssetUrl, fetchSchoolProfile } from "../utils/branding";

const Login = () => {
  const [searchParams] = useSearchParams();
  const rawSlug = searchParams.get("tenant") || searchParams.get("school") || getTenantSlug();
  const [tenantSlug, setTenantSlug] = useState(rawSlug || "");
  const [schoolProfile, setSchoolProfile] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadBranding() {
      const profile = await fetchSchoolProfile(tenantSlug);
      if (profile && isMounted) {
        setSchoolProfile(profile);
        setTenantSlug(profile.slug);
        localStorage.setItem("tenantSlug", profile.slug);
        applySchoolBranding(profile, "Timetable Portal");
      }
    }
    loadBranding();
    return () => { isMounted = false; };
  }, [tenantSlug]);

  const activeSchoolName = schoolProfile?.name || "School Campus";
  const activeLogo = resolveAssetUrl(schoolProfile?.logoUrl);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);

      if (response.data.success) {
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        );
        toast.success("Welcome to Timetable Management Portal!");
        navigate("/classes");
      } else {
        toast.error(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 20%, #e8f5e9 0%, #f8fafc 60%)",
        padding: "1.5rem",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header Branding */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {activeLogo ? (
            <img
              src={activeLogo}
              alt={activeSchoolName}
              style={{
                height: "68px",
                width: "68px",
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 4px 12px rgba(27, 139, 59, 0.15)",
                border: "3px solid white",
              }}
            />
          ) : (
            <div
              style={{
                height: "68px",
                width: "68px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-color, #064e3b)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "24px",
                boxShadow: "0 4px 12px rgba(27, 139, 59, 0.15)",
                border: "3px solid white",
              }}
            >
              {activeSchoolName.charAt(0)}
            </div>
          )}
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                marginBottom: "0.2rem",
                color: "var(--text-primary)",
              }}
            >
              {activeSchoolName}
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "var(--accent-primary)",
                fontWeight: "600",
                fontSize: "12px",
                background: "var(--accent-light)",
                padding: "2px 10px",
                borderRadius: "9999px",
              }}
            >
              <Calendar size={13} />
              Timetable Management Portal
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginTop: "0.5rem",
              }}
            >
              Sign in with your timetable credentials to manage schedules
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                className="input-glass"
                placeholder="timetable@thevisionschool.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.3rem" }}
                required
              />
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="input-glass"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.3rem" }}
                required
              />
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "0.75rem",
              fontSize: "14px",
            }}
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                <LogIn size={17} />
                Sign In to Timetable Portal
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--glass-border)",
            textAlign: "center",
            fontSize: "11px",
            color: "var(--text-secondary)",
          }}
        >
          Protected System • CKR Technologies • Greater Noida
        </div>
      </div>
    </div>
  );
};

export default Login;
