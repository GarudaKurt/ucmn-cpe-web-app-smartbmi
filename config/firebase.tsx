import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAsVPYxgzlkA0HgokO_6Pbb0E_hBVJoUV4",
  authDomain: "bmi-machine-6026b.firebaseapp.com",
  databaseURL: "https://bmi-machine-6026b-default-rtdb.firebaseio.com",
  projectId: "bmi-machine-6026b",
  storageBucket: "bmi-machine-6026b.firebasestorage.app",
  messagingSenderId: "263520592547",
  appId: "1:263520592547:web:0df49d2e00cb21ab325516"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);