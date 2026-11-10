import axios from 'axios';
import { store } from '../store';
import { Platform } from 'react-native';
import { API_URL } from '@env';

export const getBaseUrl = () => {
  let url = API_URL || 'http://localhost:5006/api';
  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2');
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const state = store.getState()?.auth;
      const token = state?.token;
      const tenantSlug = state?.tenantSlug || 'arc';

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (tenantSlug) {
        config.headers['x-tenant-slug'] = tenantSlug;
      }
    } catch (error) {
      console.log("Store couldn't be accessed!", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
