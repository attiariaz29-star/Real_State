// ============================================================
// NestFinder AI — Firebase Initialization
// Include this file BEFORE auth-shared.js and properties-shared.js
// on any page that needs login or property data.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyC6Mosq86guOFdxXCX0yS0XzfDRFuwZB9k",
  authDomain: "nestfinder-ai.firebaseapp.com",
  databaseURL: "https://nestfinder-ai-default-rtdb.firebaseio.com",
  projectId: "nestfinder-ai",
  storageBucket: "nestfinder-ai.firebasestorage.app",
  messagingSenderId: "364776807298",
  appId: "1:364776807298:web:2f2a9883ab0e728da2cd9b",
  measurementId: "G-KS06LYGL8K"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
