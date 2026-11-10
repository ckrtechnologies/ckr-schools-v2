import { configureStore } from '@reduxjs/toolkit';
import { marketplaceApi } from './marketplaceApi.js';
import comparisonReducer from './comparisonSlice.js';
import authReducer from './authSlice.js';

export const store = configureStore({
  reducer: {
    [marketplaceApi.reducerPath]: marketplaceApi.reducer,
    comparison: comparisonReducer,
    auth: authReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketplaceApi.middleware)
});

