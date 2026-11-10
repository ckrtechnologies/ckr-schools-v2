import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn } from "lucide-react";
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
        applySchoolBranding(profile, "Finance Portal");
      }
    }
    loadBranding();
    return () => { isMounted = false; };
  }, [tenantSlug]);

  const activeSchoolName = schoolProfile?.name || "School Campus";
  const activeMotto = schoolProfile?.motto || "Fee & Financial Governance Portal";
  const activeLogo = resolveAssetUrl(schoolProfile?.logoUrl) || null;
  const activeColor = schoolProfile?.themeColor || "#064e3b";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");

    setLoading(true);
    try {
      const response = await api.post("/user/loginUser", {
        data: { email, password },
      });

      if (response.data.success) {
        const allowedRoles = ["super_admin", "admin", "principal", "finance", "accountant"];
        if (!allowedRoles.includes(response.data.user.type)) {
          toast.error("Unauthorized access. Finance portal only.");
          setLoading(false);
          return;
        }

        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        );
        toast.success("Welcome back to Finance Portal!");
        navigate("/dashboard");
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          {activeLogo ? (
            <img 
              src={activeLogo} 
              alt={activeSchoolName} 
              style={{ height: "64px", width: "64px", borderRadius: "50%", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} 
            />
          ) : (
            <div style={{ height: "64px", width: "64px", borderRadius: "50%", backgroundColor: activeColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {activeSchoolName.charAt(0)}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.25rem", lineHeight: 1.2 }}>{activeSchoolName}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{activeMotto}</p>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Email Address</label>
            <input
              type="email"
              className="input-glass"
              placeholder="finance@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              className="input-glass"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : (
              <>
                <LogIn size={16} /> Sign In to Finance Portal
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
