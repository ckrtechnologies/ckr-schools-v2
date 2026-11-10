import { createSlice } from "@reduxjs/toolkit";

const safeJsonParse = (item) => {
  try {
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error("Error parsing ttPortalUser from localStorage", e);
    return null;
  }
};

const initialState = {
  user: safeJsonParse(localStorage.getItem("ttPortalUser")),
  token: localStorage.getItem("ttPortalToken") || null,
  isAuthenticated: !!localStorage.getItem("ttPortalToken"),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("ttPortalUser", JSON.stringify(action.payload.user));
      localStorage.setItem("ttPortalToken", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("ttPortalUser");
      localStorage.removeItem("ttPortalToken");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
