import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { apiSlice } from '../store/apiSlice';
import { logout } from '../store/authSlice';
import { socket } from '../services/socket';

/**
 * Completely purges all user credentials, tokens, session keys,
 * RTK Query state, sockets, and Redux auth state upon logout.
 */
export const performFullLogout = async (dispatch) => {
  try {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  } catch (e) {
    console.warn('Socket disconnect error on logout:', e);
  }

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
    console.warn('AsyncStorage purge error on logout:', e);
  }

  try {
    await Keychain.resetGenericPassword();
  } catch (e) {
    console.warn('Keychain reset error on logout:', e);
  }

  if (dispatch) {
    try {
      dispatch(apiSlice.util.resetApiState());
    } catch (e) {
      console.warn('RTK Query cache reset error on logout:', e);
    }
    dispatch(logout());
  }
};
