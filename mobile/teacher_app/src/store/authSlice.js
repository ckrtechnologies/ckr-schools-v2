import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  tenantSlug: 'arc',
  schoolInfo: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTenantSlug: (state, action) => {
      state.tenantSlug = action.payload || 'arc';
    },
    setSchoolInfo: (state, action) => {
      state.schoolInfo = action.payload;
    },
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.user?.schoolSlug) {
        state.tenantSlug = action.payload.user.schoolSlug;
      }
      if (action.payload.schoolInfo) {
        state.schoolInfo = action.payload.schoolInfo;
      } else if (action.payload.user?.schoolName) {
        state.schoolInfo = {
          name: action.payload.user.schoolName,
          slug: action.payload.user.schoolSlug,
          themeColor: action.payload.user.themeColor,
          logoUrl: action.payload.user.logoUrl,
          motto: action.payload.user.schoolMotto,
          affiliationBoard: action.payload.user.affiliationBoard,
        };
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setTenantSlug, setSchoolInfo, loginStart, loginSuccess, loginFailure, updateUserProfile, logout } = authSlice.actions;
export default authSlice.reducer;
