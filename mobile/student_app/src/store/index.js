import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import { apiSlice } from './apiSlice';
import authReducer from './authSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// React Native AppState foreground listener:
// When the app returns from background, flushes dead keep-alive sockets & refetches active queries
export const configureAppListeners = (dispatch) => {
  return setupListeners(dispatch, (customHandler) => {
    let currentAppState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        currentAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        customHandler();
      }
      currentAppState = nextAppState;
    });
    return () => subscription.remove();
  });
};

configureAppListeners(store.dispatch);

