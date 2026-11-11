import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

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
      const stored = localStorage.getItem("financeUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.schoolSlug) return parsed.schoolSlug;
        if (parsed.tenant_slug) return parsed.tenant_slug;
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem("financeUser") || localStorage.getItem("adminUser") || localStorage.getItem("user");
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
  baseURL: API_URL,
});

// Add a request interceptor to inject JWT & Multi-Tenant Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("financeToken") || localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-tenant-slug"] = getTenantSlug();
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout if the request was NOT a login request
    if (
      error.response && 
      error.response.status === 401 && 
      !error.config.url.includes("/loginUser")
    ) {
      // Auto logout on unauthorized (token expired/invalid)
      localStorage.removeItem("financeToken");
      localStorage.removeItem("financeUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Fees API
export const createFee = (data) => api.post('/finance_panel/createFee', data);
export const getFees = () => api.get('/finance_panel/getFees');
export const updateFee = (data) => api.put('/finance_panel/updateFee', data);
export const deleteFee = (id) => api.delete(`/finance_panel/deleteFee/${id}`);

// Communication & Chat API
export const createCommunication = (data) => api.post('/communication/createChat', data);
export const getCommunication = (type) => api.get(`/communication/getChat/${type}`);

// School Info API
export const getInfo = () => api.get('/admin_panel/info/getAll');
export const updateSettings = (data) => api.put('/admin_panel/info/settings', data);

export const addChampion = (data) => api.post('/admin_panel/info/champion', data);
export const updateChampion = (id, data) => api.put(`/admin_panel/info/champion/${id}`, data);
export const deleteChampion = (id) => api.delete(`/admin_panel/info/champion/${id}`);

export const addGalleryImage = (data) => api.post('/admin_panel/info/gallery', data);
export const deleteGalleryImage = (id) => api.delete(`/admin_panel/info/gallery/${id}`);

export const addNewsletter = (data) => api.post('/admin_panel/info/newsletter', data);
export const deleteNewsletter = (id) => api.delete(`/admin_panel/info/newsletter/${id}`);

// Notification API
export const updateNotification = (id) => api.put(`/user/updateNotification/${id}`);

// File Upload API (proxied through backend — NO direct Supabase access)
export const uploadFile = async (file, bucket = "finance", category = "") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    const targetCat = category || bucket || "finance";
    const response = await api.post(`/upload/file?category=${encodeURIComponent(targetCat)}`, formData, {
      timeout: 600000
    });
    return response.data.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export default api;
