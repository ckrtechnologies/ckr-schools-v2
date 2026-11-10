import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, Sparkles, Globe } from "lucide-react";
import { loginSuccess } from "../features/authSlice";
import api, { getTenantSlug } from "../services/api";
import { applySchoolBranding, fetchSchoolProfile, resolveAssetUrl } from "../utils/branding";

const Login = () => {
  const [searchParams] = useSearchParams();
  const rawSlug = searchParams.get("tenant") || searchParams.get("school") || getTenantSlug();
  const [tenantSlug, setTenantSlug] = useState(rawSlug || "");
  const [schoolProfile, setSchoolProfile] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [spocBlocked, setSpocBlocked] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Dynamically load school branding (Logo, Tagline, Title & Favicon)
  useEffect(() => {
    let isMounted = true;
    async function loadBranding() {
      const profile = await fetchSchoolProfile(tenantSlug);
      if (profile && isMounted) {
        setSchoolProfile(profile);
        setTenantSlug(profile.slug);
        localStorage.setItem("tenantSlug", profile.slug);
        applySchoolBranding(profile, "Admin Login");
        if (!email) {
          if (profile.slug === "vision") {
            setEmail("visiona1@gmail.com");
            setPassword("Admin@123");
          } else if (profile.slug === "arc") {
            setEmail("a1@gmail.com");
            setPassword("Admin@123");
          }
        }
      }
    }
    loadBranding();
    return () => { isMounted = false; };
  }, [tenantSlug]);

  const activeSchoolName = schoolProfile?.name || "School Campus";
  const activeMotto = schoolProfile?.motto || "Inspiring Excellence, Empowering Minds";
  const activeLogo = resolveAssetUrl(schoolProfile?.logoUrl) || null;
  const activeColor = schoolProfile?.themeColor || "#064e3b";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");

    setLoading(true);
    if (tenantSlug) {
      localStorage.setItem("tenantSlug", tenantSlug);
    }

    try {
      const response = await api.post("/user/loginUser", {
        data: { email, password },
      }, {
        headers: {
          ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {})
        }
      });

      if (response.data.success) {
        const user = response.data.user;

        if (user?.type === 'spoc') {
          setSpocBlocked(true);
          toast.error('SPOC accounts sign in at the School SPOC Portal, not here.');
          return;
        }

        if (user?.schoolSlug) {
          localStorage.setItem("tenantSlug", user.schoolSlug);
        }
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        );
        applySchoolBranding(user, "Admin Portal");
        toast.success(`Welcome to ${user.schoolName || activeSchoolName}!`);
        navigate("/dashboard");
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || "Invalid email or password for this school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "1.5rem" }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "440px",
        padding: "2.5rem",
        boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
        border: `1px solid rgba(255, 255, 255, 0.12)`,
        borderRadius: "16px"
      }}>
        {/* Dynamic School Branding (Logo + Name + Tagline) */}
        <div style={{ textAlign: "center", marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem" }}>
          {activeLogo ? (
            <div style={{
              position: "relative",
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              padding: "3px",
              background: `linear-gradient(135deg, ${activeColor}, #3b82f6)`,
              boxShadow: `0 8px 18px ${activeColor}44`
            }}>
              <img 
                src={activeLogo} 
                alt={activeSchoolName} 
                style={{
                  height: "100%",
                  width: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  backgroundColor: "#ffffff"
                }} 
              />
            </div>
          ) : (
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: activeColor,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "26px",
              boxShadow: `0 8px 18px ${activeColor}44`
            }}>
              {activeSchoolName.charAt(0)}
            </div>
          )}

          <div>
            <h2 style={{ fontSize: "1.65rem", fontWeight: "800", marginBottom: "0.35rem", lineHeight: 1.2, color: "var(--text-primary)" }}>
              {activeSchoolName}
            </h2>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: "var(--accent-primary)",
              fontWeight: "600",
              fontSize: "12px",
              background: "var(--accent-light)",
              padding: "2px 10px",
              borderRadius: "12px",
              marginBottom: "0.4rem"
            }}>
              <Sparkles size={12} />
              <span>{activeMotto}</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
              Sign in to manage your school campus
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Admin Email Address
            </label>
            <input
              type="email"
              className="input-glass"
              placeholder="admin@school.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.75rem 0.9rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              type="password"
              className="input-glass"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.75rem 0.9rem" }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ 
              width: "100%", 
              marginTop: "0.75rem", 
              padding: "0.85rem",
              fontSize: "0.95rem",
              fontWeight: "700",
              backgroundColor: activeColor,
              borderColor: activeColor
            }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : (
              <>
                <LogIn size={18} /> Sign In to {activeSchoolName}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
