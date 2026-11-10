import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import filtersReducer from './filtersSlice.js';
import { superadminApi } from './superadminApi.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
    [superadminApi.reducerPath]: superadminApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(superadminApi.middleware)
});

