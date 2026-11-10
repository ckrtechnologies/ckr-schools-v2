import { io } from "socket.io-client";
import { Platform } from "react-native";
import { SOCKET_URL } from '@env';

export const getSocketUrl = () => {
  if (SOCKET_URL) return SOCKET_URL;
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5006';
  }
  return 'http://localhost:5006';
};

export const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  autoConnect: false,
});
