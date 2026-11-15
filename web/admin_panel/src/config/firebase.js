import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAwjIm4XXCC5XUNokISvhoytb3c5I30Ykw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "schoolkarma.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "schoolkarma",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "schoolkarma.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "691306869122",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:691306869122:web:bf02d24f5cffb557dcdf9b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-C84900PV88"
};

export let messaging = null;

if (firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging not supported in this environment");
  }
}
