// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjM1Zev4cLUvpHr1n4cj0TRb7mVZbbH08",
  authDomain: "geri-donusum-ab5af.firebaseapp.com",
  projectId: "geri-donusum-ab5af",
  storageBucket: "geri-donusum-ab5af.firebasestorage.app",
  messagingSenderId: "644189464612",
  appId: "1:644189464612:web:7ee060b95c29fc4bbc10b1",
  measurementId: "G-F2Z0E0P91Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);