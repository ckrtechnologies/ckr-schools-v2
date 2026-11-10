import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

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
      const stored = localStorage.getItem("teacherUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
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
  const token =
    localStorage.getItem("tm_auth_token") ||
    localStorage.getItem("tc_auth_token") ||
    localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["x-tenant-slug"] = getTenantSlug();
  return config;
});

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!error.config?.url?.includes("/loginUser")) {
        // clear local storage token on auth error
        logoutUser();
      }
    }
    return Promise.reject(error);
  }
);

// Auth Methods
export const loginUser = async (email, password) => {
  const res = await api.post("/user/loginUser", { data: { email, password } });
  if (res.data?.token) {
    localStorage.setItem("tm_auth_token", res.data.token);
    if (res.data.user) {
      localStorage.setItem("tm_auth_user", JSON.stringify(res.data.user));
    }
  }
  return res.data;
};

export const getCurrentUser = () => {
  try {
    const raw =
      localStorage.getItem("tm_auth_user") ||
      localStorage.getItem("tc_auth_user") ||
      localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("tm_auth_token");
  localStorage.removeItem("tm_auth_user");
};

// Parameters API
export const fetchParameters = async (academicYear = "2026-27") => {
  const res = await api.get(`/teachers_manager/parameters?academic_year=${encodeURIComponent(academicYear)}`);
  return res.data?.data || [];
};

export const createParameter = async (paramData) => {
  const res = await api.post("/teachers_manager/parameters", paramData);
  return res.data?.data;
};

export const updateParameter = async (id, updateData) => {
  const res = await api.put(`/teachers_manager/parameters/${id}`, updateData);
  return res.data?.data;
};

export const deleteParameter = async (id) => {
  const res = await api.delete(`/teachers_manager/parameters/${id}`);
  return res.data?.data;
};

// Evaluation Matrix API
export const fetchMatrix = async (month = "August", academicYear = "2026-27") => {
  const res = await api.get(
    `/teachers_manager/matrix?month=${encodeURIComponent(month)}&academic_year=${encodeURIComponent(academicYear)}`
  );
  return res.data?.data;
};

export const saveBatchEvaluations = async (payload) => {
  const res = await api.post("/teachers_manager/evaluations/batch-save", payload);
  return res.data;
};

// Score Card API
export const fetchScorecard = async (teacherId, month = "August", academicYear = "2026-27") => {
  const res = await api.get(
    `/teachers_manager/scorecard/${teacherId}?month=${encodeURIComponent(month)}&academic_year=${encodeURIComponent(academicYear)}`
  );
  return res.data?.data;
};

// Teacher Analytics & Historical Records API
export const fetchTeacherAnalytics = async (teacherId, academicYear = "2026-27") => {
  const res = await api.get(
    `/teachers_manager/analytics/teacher/${teacherId}?academic_year=${encodeURIComponent(academicYear)}`
  );
  return res.data?.data;
};

// Teacher list API
export const fetchTeachersList = async () => {
  const res = await api.get("/teachers_manager/teachers");
  return res.data?.data || [];
};

export default api;

