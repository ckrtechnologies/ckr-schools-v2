import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  tenantSlug: 'arc',
  schoolInfo: null,
  siblings: [],
  activeStudentId: null,
  activeStudent: null,
  hasMultipleChildren: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTenantSlug: (state, action) => {
      state.tenantSlug = action.payload;
    },
    setSchoolInfo: (state, action) => {
      state.schoolInfo = action.payload;
      if (action.payload?.slug) {
        state.tenantSlug = action.payload.slug;
      }
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = true;
      if (action.payload.tenantSlug) {
        state.tenantSlug = action.payload.tenantSlug;
      }
      if (action.payload.schoolInfo) {
        state.schoolInfo = action.payload.schoolInfo;
      }
      if (action.payload.siblings) {
        state.siblings = action.payload.siblings;
        state.hasMultipleChildren = action.payload.siblings.length > 1;
      }
      if (action.payload.activeStudent) {
        state.activeStudent = action.payload.activeStudent;
        state.activeStudentId = action.payload.activeStudent.id;
      } else if (state.siblings.length > 0 && !state.activeStudentId) {
        state.activeStudent = state.siblings[0];
        state.activeStudentId = state.siblings[0].id;
      }
    },
    setActiveStudent: (state, action) => {
      const studentId = typeof action.payload === 'string' ? action.payload : action.payload?.id;
      const found = state.siblings.find(s => s.id === studentId);
      if (found) {
        state.activeStudentId = found.id;
        state.activeStudent = found;
      } else if (action.payload && typeof action.payload === 'object') {
        state.activeStudent = action.payload;
        state.activeStudentId = action.payload.id;
      }
    },
    setSiblings: (state, action) => {
      state.siblings = action.payload || [];
      state.hasMultipleChildren = (action.payload || []).length > 1;
      if (!state.activeStudentId && state.siblings.length > 0) {
        state.activeStudent = state.siblings[0];
        state.activeStudentId = state.siblings[0].id;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.siblings = [];
      state.activeStudentId = null;
      state.activeStudent = null;
      state.hasMultipleChildren = false;
    },
  },
});

export const { setCredentials, setActiveStudent, setSiblings, setTenantSlug, setSchoolInfo, logout } = authSlice.actions;
export default authSlice.reducer;

