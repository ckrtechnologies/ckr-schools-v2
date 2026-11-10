import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'ckr_marketplace_token';
const USER_KEY = 'ckr_marketplace_user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

const initialState = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: readStoredUser(),
  isLoginOpen: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token || null;
      state.user = action.payload.user || null;
      if (state.token) localStorage.setItem(TOKEN_KEY, state.token);
      else localStorage.removeItem(TOKEN_KEY);
      if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      else localStorage.removeItem(USER_KEY);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    openLogin: (state) => {
      state.isLoginOpen = true;
    },
    closeLogin: (state) => {
      state.isLoginOpen = false;
    }
  }
});

export const { setCredentials, logout, openLogin, closeLogin } = authSlice.actions;
export default authSlice.reducer;

function mapClassNameToGrade(className) {
  if (!className) return '';
  const digits = String(className).match(/\d+/);
  if (!digits) return '';
  const gradeNumber = Number(digits[0]);
  if (!Number.isFinite(gradeNumber) || gradeNumber < 1 || gradeNumber > 12) return '';
  return `Grade ${gradeNumber}`;
}

function mapClassNameToBand(className) {
  if (!className) return '';
  const text = String(className).trim();
  if (/nursery|lkg|ukg|pre[- ]?primary|kg/i.test(text)) return 'Pre-Primary';
  const digits = text.match(/\d+/);
  if (!digits) return '';
  const gradeNumber = Number(digits[0]);
  if (!Number.isFinite(gradeNumber)) return '';
  if (gradeNumber <= 5) return 'Primary (1-5)';
  if (gradeNumber <= 8) return 'Middle (6-8)';
  if (gradeNumber <= 10) return 'Secondary (9-10)';
  if (gradeNumber <= 12) return 'Senior Secondary (11-12)';
  return '';
}

/**
 * Derives editable form values from the signed-in account so parents do not have to
 * retype details the school already holds.
 */
export function buildPrefill(user) {
  const prefill = user?.prefill || {};
  const children = Array.isArray(prefill.children) ? prefill.children.filter(child => child?.name) : [];
  const primaryChild = children[0] || null;

  return {
    parentName: (prefill.parentName || user?.name || '').trim(),
    phone: (prefill.phone || user?.phone || '').trim(),
    alternateNumber: (prefill.alternateNumber || '').trim(),
    email: (prefill.email || user?.email || '').trim(),
    studentName: primaryChild?.name || '',
    grade: mapClassNameToGrade(primaryChild?.className),
    gradeBand: mapClassNameToBand(primaryChild?.className),
    children,
    hasChildren: children.length > 0,
    hasMultipleChildren: children.length > 1
  };
}

/** Applies prefill values only to fields the parent has not typed into yet. */
export function fillIfEmpty(currentValue, incomingValue) {
  if (currentValue && String(currentValue).trim() !== '') return currentValue;
  return incomingValue || currentValue;
}
