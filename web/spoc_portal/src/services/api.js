import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const getTenantSlug = () => {
  if (typeof window === 'undefined') return null;

  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length > 2 && !['admin', 'www', 'localhost'].includes(parts[0])) {
    return parts[0].replace(/spoc$/, '');
  }

  const urlParams = new URLSearchParams(window.location.search);
  const queryTenant = urlParams.get('tenant') || urlParams.get('school');
  if (queryTenant) {
    localStorage.setItem('spocTenantSlug', queryTenant);
    return queryTenant;
  }

  try {
    const stored = localStorage.getItem('spocUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.schoolSlug) return parsed.schoolSlug;
    }
  } catch (e) {
    /* ignore malformed cache */
  }

  return localStorage.getItem('spocTenantSlug') || null;
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spocToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const slug = getTenantSlug();
  if (slug) config.headers['x-tenant-slug'] = slug;

  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = (error.config?.url || '').includes('/loginUser');
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('spocToken');
      localStorage.removeItem('spocUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (payload, tenantSlug) =>
  api.post('/user/loginUser', { data: payload }, {
    headers: tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}
  });

export const getOverview = () => api.get('/marketplace/manage/overview');
export const getProfile = () => api.get('/marketplace/manage/profile');
export const updateProfile = (data) => api.put('/marketplace/manage/profile', data);
export const setPublished = (isPublished) => api.patch('/marketplace/manage/publish', { is_published: isPublished });

export const getReviews = (params) => api.get('/marketplace/manage/reviews', { params });
export const replyToReview = (id, reply) => api.post(`/marketplace/manage/reviews/${id}/reply`, { reply });
export const deleteReviewReply = (id) => api.delete(`/marketplace/manage/reviews/${id}/reply`);
export const reportReview = (id, reason) => api.patch(`/marketplace/manage/reviews/${id}/report`, { reported: true, reason });
export const withdrawReport = (id) => api.patch(`/marketplace/manage/reviews/${id}/report`, { reported: false });

export const getGallery = () => api.get('/marketplace/manage/gallery');
export const createGalleryItem = (data) => api.post('/marketplace/manage/gallery', data);
export const updateGalleryItem = (id, data) => api.patch(`/marketplace/manage/gallery/${id}`, data);
export const deleteGalleryItem = (id) => api.delete(`/marketplace/manage/gallery/${id}`);
export const deleteCdnFile = (url) => api.delete('/upload/file', { data: { url } });

export const marketplaceSchoolUrl = (slug) => {
  const base = (import.meta.env.VITE_MARKETPLACE_URL || 'http://localhost:5175').replace(/\/+$/, '');
  return slug ? `${base}/schools/${encodeURIComponent(slug)}` : base;
};

export const getPressReleases = () => api.get('/marketplace/manage/press');
export const createPressRelease = (data) => api.post('/marketplace/manage/press', data);
export const updatePressRelease = (id, data) => api.patch(`/marketplace/manage/press/${id}`, data);
export const deletePressRelease = (id) => api.delete(`/marketplace/manage/press/${id}`);

export const getLeads = (params) => api.get('/marketplace/manage/leads', { params });

export const uploadFile = async (file, bucket = 'school', category = 'marketplace') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  const response = await api.post(`/upload/file?category=${category}`, formData, { timeout: 600000 });
  return response.data.url;
};

export const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (/^(https?:|data:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

export default api;
