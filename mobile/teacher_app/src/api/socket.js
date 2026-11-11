import io from 'socket.io-client';
import { Platform, AppState } from 'react-native';
import { SOCKET_URL } from '@env';

export const getSocketUrl = () => {
  if (SOCKET_URL) return SOCKET_URL;
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5006';
  }
  return 'http://localhost:5006';
};

// Initialize socket (URL should match backend)
const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

// Auto-reconnect socket when app returns from background
if (typeof AppState !== 'undefined') {
  AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active' && !socket.connected) {
      socket.connect();
    }
  });
}

export default socket;
