import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import comparisonReducer from './comparisonSlice.js';
import { marketplaceApi } from './marketplaceApi.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    comparison: comparisonReducer,
    [marketplaceApi.reducerPath]: marketplaceApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketplaceApi.middleware)
});

