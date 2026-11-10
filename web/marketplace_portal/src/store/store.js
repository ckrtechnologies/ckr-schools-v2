import { configureStore } from '@reduxjs/toolkit';
import { marketplaceApi } from './marketplaceApi.js';
import comparisonReducer from './comparisonSlice.js';

export const store = configureStore({
  reducer: {
    [marketplaceApi.reducerPath]: marketplaceApi.reducer,
    comparison: comparisonReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(marketplaceApi.middleware)
});

