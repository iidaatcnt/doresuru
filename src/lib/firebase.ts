import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVGLtuvYf5PuWlnGElG1Wt5_yITaIm0m0",
  authDomain: "doresuru.firebaseapp.com",
  projectId: "doresuru",
  storageBucket: "doresuru.firebasestorage.app",
  messagingSenderId: "447435355139",
  appId: "1:447435355139:web:d0c0ad63c82d631c3b4a36",
  measurementId: "G-J3172C5WXT"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
