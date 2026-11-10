import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import filtersReducer from './filtersSlice.js';
import { schoolApi } from './schoolApi.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
    [schoolApi.reducerPath]: schoolApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(schoolApi.middleware)
});

