import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

export const getTenantSlug = () => {
  if (typeof window !== "undefined") {
    // 1. From subdomain (e.g. vision.ckrschools.online or visionadmin.ckrtechnologies.in)
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] !== "admin" && parts[0] !== "www" && parts[0] !== "localhost") {
      return parts[0].replace(/admin$/, "");
    }
    // 2. From URL query param ?tenant=slug
    const urlParams = new URLSearchParams(window.location.search);
    const qTenant = urlParams.get("tenant") || urlParams.get("school");
    if (qTenant) {
      localStorage.setItem("tenantSlug", qTenant);
      return qTenant;
    }
    // 3. From authenticated adminUser stored in localStorage
    try {
      const stored = localStorage.getItem("adminUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.schoolSlug) return parsed.schoolSlug;
        if (parsed.tenant_slug) return parsed.tenant_slug;
      }
    } catch (e) {}

    // 4. From localStorage explicit tenantSlug
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
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Multi-tenant header injection:
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
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
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
export const getSystemMonitorList = () => api.get('/admin_panel/communication/monitor');
export const getSystemMonitorHistory = (user1, user2) => api.get(`/admin_panel/communication/history/${user1}/${user2}`);

// School Info API
export const getInfo = () => api.get('/admin_panel/info/getAll');
export const updateSettings = (data) => api.put('/admin_panel/info/settings', data);
export const getSchoolProfile = () => api.get('/admin_panel/info/profile');
export const updateSchoolProfile = (data) => api.put('/admin_panel/info/profile', data);

export const addChampion = (data) => api.post('/admin_panel/info/champion', data);
export const updateChampion = (id, data) => api.put(`/admin_panel/info/champion/${id}`, data);
export const deleteChampion = (id) => api.delete(`/admin_panel/info/champion/${id}`);

export const addGalleryImage = (data) => api.post('/admin_panel/info/gallery', data);
export const deleteGalleryImage = (id) => api.delete(`/admin_panel/info/gallery/${id}`);

export const getResults = () => api.get('/admin_panel/results');

// Co-Scholastic API (Part-2 CBSE Assessment)
export const getCoScholasticGrades = (classId, term, academicYear = "2026-27") =>
  api.get(`/academic_manager/co-scholastic?class_id=${classId}&term=${encodeURIComponent(term)}&academic_year=${encodeURIComponent(academicYear)}`);

export const saveCoScholasticGrades = (classId, term, grades, academicYear = "2026-27") =>
  api.post("/academic_manager/co-scholastic/bulk", {
    class_id: classId,
    term,
    academic_year: academicYear,
    grades,
  });

export const addNewsletter = (data) => api.post('/admin_panel/info/newsletter', data);
export const deleteNewsletter = (id) => api.delete(`/admin_panel/info/newsletter/${id}`);

// Notification API
export const updateNotification = (id) => api.put(`/user/updateNotification/${id}`);
export const sendBroadcastNotification = (data) => api.post('/admin_panel/notifications/broadcast', data);
export const getAllNotifications = (params) => api.get('/admin_panel/notifications/all', { params });
export const markNotificationsAsRead = () => api.patch('/admin_panel/notifications/all/read');

// File Upload API (proxied through backend — NO direct Supabase access)
export const uploadFile = async (file, bucket = "school", category = "") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    const response = await api.post(`/upload/file?category=${category || bucket}`, formData, {
      timeout: 600000 // 10 minutes timeout for large files on slow connections
    });
    return response.data.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Delete a previously uploaded file by its URL
export const deleteFile = (url) => api.delete("/upload/file", { data: { url } });


// Consents API
export const createConsent = (data) => api.post('/admin_panel/consents', data);
export const getConsents = (params) => api.get('/admin_panel/consents/admin', { params });
export const getConsentReport = (id) => api.get(`/admin_panel/consents/admin/${id}/report`);
export const updateConsent = (id, data) => api.put(`/admin_panel/consents/admin/${id}`, data);
export const deleteConsent = (id) => api.delete(`/admin_panel/consents/admin/${id}`);

// Circulars API
export const createCircular = (data) => api.post('/circulars', data);
export const getCirculars = (params) => api.get('/circulars', { params });
export const deleteCircular = (id) => api.delete(`/circulars/${id}`);
export const uploadCircularFile = (formData) => api.post('/circulars/upload', formData);

export default api;
