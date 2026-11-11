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
      const stored = localStorage.getItem("academicUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
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

// Attach Authorization token & Multi-Tenant Header
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("am_auth_token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("tm_auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["x-tenant-slug"] = getTenantSlug();
  return config;
});

// Response interceptor for handling 401/403
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

// -------------------------------------------------------------
// Auth Services
// -------------------------------------------------------------
export const loginUser = async (email, password) => {
  const res = await api.post("/user/loginUser", { data: { email, password } });
  const user = res.data?.user || res.data;
  const token = res.data?.token || res.data?.access_token || user?.access_token;

  if (token) {
    localStorage.setItem("am_auth_token", token);
    localStorage.setItem("am_auth_user", JSON.stringify(user));
  }
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem("am_auth_token");
  localStorage.removeItem("am_auth_user");
  window.dispatchEvent(new Event("am-auth-changed"));
};

export const getCurrentUser = () => {
  try {
    const raw =
      localStorage.getItem("am_auth_user") ||
      localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// -------------------------------------------------------------
// Academic Manager Services
// -------------------------------------------------------------
export const getAcademicMeta = async () => {
  const res = await api.get("/academic_manager/meta");
  return res.data?.data || res.data;
};

export const getDistributions = async (params = {}) => {
  const res = await api.get("/academic_manager/distributions", { params });
  return res.data?.data || [];
};

export const saveDistribution = async (payload) => {
  const res = await api.post("/academic_manager/distributions", payload);
  return res.data?.data || res.data;
};

export const lockDistribution = async (id, is_locked) => {
  const res = await api.patch(`/academic_manager/distributions/${id}/lock`, { is_locked });
  return res.data?.data || res.data;
};

export const deleteDistribution = async (id) => {
  const res = await api.delete(`/academic_manager/distributions/${id}`);
  return res.data;
};

export const cloneDistribution = async (source_distribution_id, target_class_ids) => {
  const res = await api.post("/academic_manager/distributions/clone", {
    source_distribution_id,
    target_class_ids
  });
  return res.data?.data || res.data;
};

export const getGradingTracker = async (params = {}) => {
  const res = await api.get("/academic_manager/grading-tracker", { params });
  return res.data?.data || { summary: {}, records: [] };
};

export const sendGradingReminder = async (teacher_id, exam_id, message) => {
  const res = await api.post("/academic_manager/grading-tracker/remind", {
    teacher_id,
    exam_id,
    message
  });
  return res.data;
};

// -------------------------------------------------------------
// Exams & Date Sheets Services
// -------------------------------------------------------------
export const getExams = async () => {
  const res = await api.get("/admin_panel/exams");
  return res.data?.exams || res.data?.data || (Array.isArray(res.data) ? res.data : []);
};

export const createExam = async (payload) => {
  const res = await api.post("/admin_panel/exams", payload);
  return res.data;
};

export const cloneDateSheet = async (sourceClassId, targetClassIds, examTitle) => {
  const res = await api.post("/exams/clone-date-sheet", {
    sourceClassId,
    targetClassIds,
    examTitle
  });
  return res.data;
};

// -------------------------------------------------------------
// Co-Scholastic Assessment Services (Part-2 Grading)
// -------------------------------------------------------------
export const getCoScholasticGrades = async (classId, term, academicYear = "2026-27") => {
  const res = await api.get("/academic_manager/co-scholastic", {
    params: { class_id: classId, term, academic_year: academicYear },
  });
  return res.data?.data || [];
};

export const saveCoScholasticGrades = async (classId, term, grades, academicYear = "2026-27") => {
  const res = await api.post("/academic_manager/co-scholastic/bulk", {
    class_id: classId,
    term,
    academic_year: academicYear,
    grades,
  });
  return res.data;
};

// -------------------------------------------------------------
// Academic Terms Management Services (CRUD)
// -------------------------------------------------------------
export const getTerms = async (academicYear = "2026-27") => {
  const res = await api.get("/academic_manager/terms", {
    params: { academic_year: academicYear }
  });
  return res.data?.data || [];
};

export const createTerm = async (payload) => {
  const res = await api.post("/academic_manager/terms", payload);
  return res.data;
};

export const updateTerm = async (id, payload) => {
  const res = await api.put(`/academic_manager/terms/${id}`, payload);
  return res.data;
};

export const deleteTerm = async (id) => {
  const res = await api.delete(`/academic_manager/terms/${id}`);
  return res.data;
};

// -------------------------------------------------------------
// Results & Report Cards Services
// -------------------------------------------------------------
export const getResults = async () => {
  const res = await api.get("/admin_panel/results");
  return res.data?.data || [];
};

export default api;

