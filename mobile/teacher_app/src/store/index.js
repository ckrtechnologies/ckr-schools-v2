import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import authReducer from './authSlice';
import appReducer from './appSlice';
import { apiSlice } from './apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
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
