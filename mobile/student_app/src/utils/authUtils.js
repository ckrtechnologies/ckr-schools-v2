import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { apiSlice } from '../store/apiSlice';
import { logout } from '../store/authSlice';
import { socket } from '../services/socket';
import { navigationRef } from '../navigation/navigationRef';

/**
 * Completely purges all user credentials, tokens, session keys,
 * RTK Query state, sockets, and Redux auth state upon logout.
 */
export const performFullLogout = async (dispatch) => {
  // 1. Disconnect active sockets
  try {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  } catch (e) {
    console.warn('Socket disconnect error on logout:', e);
  }

  // 2. Wipe ALL AsyncStorage data and files
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.warn('AsyncStorage.clear error on logout:', e);
  }

  // Double-guard: explicitly multiRemove all known session keys
  try {
    await AsyncStorage.multiRemove([
      '@auth_user',
      '@auth_token',
      '@auth_siblings',
      '@auth_active_student',
      '@tenant_slug',
      '@school_info',
    ]);
  } catch (e) {
    console.warn('AsyncStorage multiRemove error on logout:', e);
  }

  // 3. Reset OS Keychain securely
  try {
    await Keychain.resetGenericPassword();
  } catch (e) {
    console.warn('Keychain reset error on logout:', e);
  }

  // 4. Reset RTK Query cache and Redux auth state
  if (dispatch) {
    try {
      dispatch(apiSlice.util.resetApiState());
    } catch (e) {
      console.warn('RTK Query cache reset error on logout:', e);
    }
    dispatch(logout());
  }

  // 5. Instantly reset navigation stack to clean Login screen
  try {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  } catch (navErr) {
    console.warn('Navigation reset error on logout:', navErr);
  }
};

