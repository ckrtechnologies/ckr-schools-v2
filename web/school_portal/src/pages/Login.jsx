import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, Sparkles } from "lucide-react";
import { loginSuccess } from "../features/authSlice";
import api, { getTenantSlug } from "../services/api";
import { applySchoolBranding, fetchSchoolProfile, resolveAssetUrl } from "../utils/branding";

const Login = () => {
  const [searchParams] = useSearchParams();
  const rawSlug = searchParams.get("tenant") || searchParams.get("school") || getTenantSlug();
  const [tenantSlug, setTenantSlug] = useState(rawSlug || "");
  
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Dynamically load school branding (Logo, Tagline, Title & Favicon)
  useEffect(() => {
    let isMounted = true;
    async function loadBranding() {
      setLoadingProfile(true);
      const profile = await fetchSchoolProfile(tenantSlug || "");
      if (profile && isMounted) {
        setSchoolProfile(profile);
        setTenantSlug(profile.slug);
        localStorage.setItem("tenantSlug", profile.slug);
        applySchoolBranding(profile, "Admin Login");
      }
      if (isMounted) setLoadingProfile(false);
    }
    loadBranding();
    return () => { isMounted = false; };
  }, [tenantSlug]);

  const activeSchoolName = schoolProfile?.name || "School Campus";
  const activeMotto = schoolProfile?.motto || "Campus Management Platform";
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
        toast.success(`Welcome to ${user?.schoolName || activeSchoolName}`);
        navigate("/");
      }
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.response?.data?.message || "Invalid credentials or unauthorized.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      backgroundColor: "#f8fafc"
    }}>
      <div style={{
        maxWidth: "430px",
        width: "100%",
        padding: "2.4rem 2.2rem",
        borderRadius: "18px",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0"
      }}>
        {/* Dynamic School Campus Header */}
        <div style={{ textAlign: "center", marginBottom: "1.8rem" }}>
          <div style={{
            width: "68px",
            height: "68px",
            margin: "0 auto 1rem",
            borderRadius: "50%",
            padding: "3px",
            background: `linear-gradient(135deg, ${activeColor}, #3b82f6)`,
            boxShadow: `0 8px 18px ${activeColor}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}>
            {activeLogo ? (
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
            ) : (
              <div style={{
                height: "100%",
                width: "100%",
                borderRadius: "50%",
                backgroundColor: activeColor,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                fontWeight: "800"
              }}>
                {activeSchoolName.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: "1.55rem", fontWeight: "800", marginBottom: "0.35rem", lineHeight: 1.2, color: "#0f172a" }}>
              {loadingProfile ? "Loading School Campus..." : activeSchoolName}
            </h2>
            {activeMotto && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 12px",
                borderRadius: "14px",
                backgroundColor: "#ecfdf5",
                fontSize: "0.8rem",
                fontWeight: "600",
                color: activeColor,
                marginBottom: "6px"
              }}>
                <Sparkles size={13} color={activeColor} />
                <span>{activeMotto}</span>
              </div>
            )}
            <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
              Campus Administrator Portal
            </p>
          </div>
        </div>

        {/* Clean Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
              Admin Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. principal@school.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width: "100%",
              marginTop: "0.6rem",
              padding: "0.85rem",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: activeColor,
              boxShadow: `0 4px 12px ${activeColor}44`,
              transition: "transform 0.15s ease"
            }}
          >
            {loading ? "Authenticating..." : (
              <>
                {/* <LogIn size={18} /> */}
                Sign In to {activeSchoolName}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
