import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

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

const app: FirebaseApp = initializeApp(firebaseConfig);
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const auth: Auth = getAuth(app);
const db: Database = getDatabase(app);
const storage: FirebaseStorage = getStorage(app);

export { app, analytics, auth, db, storage };
