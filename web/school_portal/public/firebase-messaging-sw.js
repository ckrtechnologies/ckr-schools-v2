importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBE2tWRjUICM3bElvFf0EoRvlgjQEnm3tw",
  authDomain: "vision-international-sch-cea2a.firebaseapp.com",
  projectId: "vision-international-sch-cea2a",
  storageBucket: "vision-international-sch-cea2a.firebasestorage.app",
  messagingSenderId: "353667789372",
  appId: "1:353667789372:web:1d9083c231b4a38887c939",
  measurementId: "G-T437P07JTH"
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
