import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

export function initFirebase() {
  if (firebaseApp) return firebaseApp;

  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
    return firebaseApp;
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
    || path.resolve(__dirname, '../config/serviceAccountKey.json');

  if (fs.existsSync(keyPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'schoolkarma'
      });
      return firebaseApp;
    } catch (err) {
      console.error('[Firebase] Failed to initialize Firebase Admin SDK:', err.message);
      return null;
    }
  } else {
    console.warn(`[Firebase] Service account key not found at ${keyPath}`);
    return null;
  }
}

export async function sendPushNotification({ tokens, title, body, data = {} }) {
  if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) return { success: false, reason: 'NO_TOKENS' };
  
  if (!firebaseApp) {
    initFirebase();
  }
  
  if (!firebaseApp) {
    return { success: false, reason: 'FIREBASE_NOT_INITIALIZED' };
  }

  const messaging = getMessaging(firebaseApp);
  const tokenList = Array.isArray(tokens) ? tokens.filter(Boolean) : [tokens];
  if (tokenList.length === 0) return { success: false, reason: 'NO_VALID_TOKENS' };

  // Convert all data values to strings as required by FCM specification
  const sanitizedData = {};
  for (const [key, val] of Object.entries(data)) {
    sanitizedData[key] = typeof val === 'string' ? val : JSON.stringify(val);
  }

  try {
    if (tokenList.length === 1) {
      const response = await messaging.send({
        token: tokenList[0],
        notification: { title, body },
        data: sanitizedData,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default_channel'
          }
        }
      });
      return { success: true, messageId: response };
    } else {
      const batches = [];
      for (let i = 0; i < tokenList.length; i += 500) {
        batches.push(tokenList.slice(i, i + 500));
      }

      let totalSuccess = 0;
      let totalFailure = 0;
      for (const batch of batches) {
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: sanitizedData,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default_channel'
            }
          }
        });
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;
      }
      return { success: true, successCount: totalSuccess, failureCount: totalFailure };
    }
  } catch (err) {
    console.error('[Firebase FCM] Send error:', err.message);
    return { success: false, error: err.message };
  }
}

export default {
  initFirebase,
  sendPushNotification
};
