importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAwjIm4XXCC5XUNokISvhoytb3c5I30Ykw",
  authDomain: "schoolkarma.firebaseapp.com",
  projectId: "schoolkarma",
  storageBucket: "schoolkarma.firebasestorage.app",
  messagingSenderId: "691306869122",
  appId: "1:691306869122:web:bf02d24f5cffb557dcdf9b",
  measurementId: "G-C84900PV88"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
