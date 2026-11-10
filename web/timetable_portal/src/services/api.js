import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

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
      const stored = localStorage.getItem("ttPortalUser") || localStorage.getItem("timetableUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.schoolSlug) return parsed.schoolSlug;
        if (parsed.tenant_slug) return parsed.tenant_slug;
        if (parsed.tenantSlug) return parsed.tenantSlug;
      }
    } catch (e) {}

    const local = localStorage.getItem("tenantSlug");
    if (local) return local;
  }
  return null;
};

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: inject isolated portal JWT & Multi-Tenant Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ttPortalToken") || localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-tenant-slug"] = getTenantSlug();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: isolated auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config?.url?.includes("/loginUser")
    ) {
      localStorage.removeItem("ttPortalToken");
      localStorage.removeItem("ttPortalUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// --- Auth API ---
export const login = (email, password) =>
  api.post("/user/loginUser", { data: { email, password } });

// --- Timetable APIs ---
export const getTimeTables = () => api.get("/admin_panel/timeTable/getTimeTable");

export const createDayTimeTable = (data) =>
  api.post("/admin_panel/timeTable/createTimeTable", { data });

export const addPeriod = (data) =>
  api.post("/admin_panel/timeTable/addPeriod", { data });

export const updatePeriod = (id, data) =>
  api.put(`/admin_panel/timeTable/updatePeriod/${id}`, { data });

export const deletePeriod = (id) =>
  api.delete(`/admin_panel/timeTable/deletePeriod/${id}`);

export const duplicateDaySchedule = (payload) =>
  api.post("/admin_panel/timeTable/duplicateDay", payload);

// --- Master Data Fetchers (Native Express 5 DDD Endpoints) ---
export const fetchAllClasses = async () => {
  const res = await api.get("/admin_panel/class/getClass");
  return res.data?.classes || [];
};

export const fetchAllTeachers = async () => {
  const res = await api.get("/admin_panel/users");
  return (res.data?.users || []).filter((u) => u.type === "teacher");
};

export const fetchAllSubjects = async () => {
  const res = await api.get("/admin_panel/subjects/getSubjects");
  return res.data?.subjects || [];
};

export const fetchAllRooms = async () => {
  const res = await api.get("/rooms/getRooms");
  return res.data?.rooms || [];
};

export default api;
