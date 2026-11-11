import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const getTenantSlug = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] !== "admin" && parts[0] !== "www" && parts[0] !== "localhost") {
      return parts[0].replace(/(admin|admission|finance|tc|teachers|academics|timetable)$/, "");
    }
    const urlParams = new URLSearchParams(window.location.search);
    const qTenant = urlParams.get("tenant") || urlParams.get("school");
    if (qTenant) {
      localStorage.setItem("tenantSlug", qTenant);
      return qTenant;
    }
    try {
      const stored = localStorage.getItem("tcUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.schoolSlug) return parsed.schoolSlug;
        if (parsed.tenant_slug) return parsed.tenant_slug;
      }
    } catch (e) {}

    const local = localStorage.getItem("tenantSlug");
    if (local) return local;
  }
  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach Authorization Bearer token & Multi-Tenant Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tc_auth_token") || localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["x-tenant-slug"] = getTenantSlug();
  return config;
});

// If token is invalid or forbidden, auto-clear and prompt login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!error.config?.url?.includes("/loginUser")) {
        logoutUser();
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  const res = await api.post("/user/loginUser", { data: { email, password } });
  if (res.data?.token) {
    localStorage.setItem("tc_auth_token", res.data.token);
    if (res.data.user) {
      localStorage.setItem("tc_auth_user", JSON.stringify(res.data.user));
    }
  }
  return res.data;
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("tc_auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("tc_auth_token");
  localStorage.removeItem("tc_auth_user");
  // Also clean up any accidental cross-port localhost tokens
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("ttPortalToken");
  localStorage.removeItem("token");
};

export default api;
