import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('ckr_school_token') || null;
const userStr = localStorage.getItem('ckr_school_user');
let user = null;
try {
  user = userStr ? JSON.parse(userStr) : null;
} catch (e) {
  user = null;
}

const initialState = {
  token,
  user,
  tenantSlug: localStorage.getItem('ckr_school_slug') || 'vision',
  isAuthenticated: Boolean(token)
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user, tenantSlug } = action.payload;
      state.token = token;
      state.user = user;
      state.tenantSlug = tenantSlug || user?.schoolSlug || 'vision';
      state.isAuthenticated = true;
      localStorage.setItem('ckr_school_token', token);
      localStorage.setItem('ckr_school_user', JSON.stringify(user));
      localStorage.setItem('ckr_school_slug', state.tenantSlug);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('ckr_school_token');
      localStorage.removeItem('ckr_school_user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

