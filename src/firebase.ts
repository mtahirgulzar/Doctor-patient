// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3KRJ053jWVM2prcutrppna906RLxq4hY",
  authDomain: "chatsystem-42560.firebaseapp.com",
  projectId: "chatsystem-42560",
  storageBucket: "chatsystem-42560.firebasestorage.app",
  messagingSenderId: "597168703492",
  appId: "1:597168703492:web:fc48eb415ef68878d28d51",
  measurementId: "G-MF4LXZJFYQ",
  databaseURL: "https://chatsystem-42560-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  // Removed enableIndexedDbPersistence as it's not applicable for Realtime Database
}

export { app, analytics, auth, db, storage };
