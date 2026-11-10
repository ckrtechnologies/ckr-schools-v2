import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('ckr_sa_token') || null;
const userStr = localStorage.getItem('ckr_sa_user');
let user = null;
try {
  user = userStr ? JSON.parse(userStr) : null;
} catch (e) {
  user = null;
}

const initialState = {
  token,
  user,
  isAuthenticated: Boolean(token)
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem('ckr_sa_token', token);
      localStorage.setItem('ckr_sa_user', JSON.stringify(user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('ckr_sa_token');
      localStorage.removeItem('ckr_sa_user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

