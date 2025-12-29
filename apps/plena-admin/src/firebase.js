import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDuYEnG0xwn9_m3I6YKQdz89NJTJpnSPHY",
    authDomain: "plena-system.firebaseapp.com",
    projectId: "plena-system",
    storageBucket: "plena-system.firebasestorage.app",
    messagingSenderId: "580090911924",
    appId: "1:580090911924:web:2942afdf2e49b0c1580be1",
    measurementId: "G-H208D85X75"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
