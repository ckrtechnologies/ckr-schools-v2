import { createSlice } from '@reduxjs/toolkit';

const safeJsonParse = (item) => {
  try {
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Error parsing spocUser from localStorage', e);
    return null;
  }
};

const initialState = {
  user: safeJsonParse(localStorage.getItem('spocUser')),
  token: localStorage.getItem('spocToken') || null,
  isAuthenticated: !!localStorage.getItem('spocToken'),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('spocUser', JSON.stringify(action.payload.user));
      localStorage.setItem('spocToken', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('spocUser');
      localStorage.removeItem('spocToken');
      // Drop the cached tenant so the next sign-in is scoped by the account, not a stale school.
      localStorage.removeItem('spocTenantSlug');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
