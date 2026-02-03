import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = !!firebaseConfig.apiKey;

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = isConfigValid ? getAuth(app) : new Proxy({}, {
    get: () => { throw new Error("Firebase Auth is not initialized. Missing environment variables in .env.local"); }
}) as any;

const db = isConfigValid ? getFirestore(app) : new Proxy({}, {
    get: () => { throw new Error("Firebase Firestore is not initialized. Missing environment variables in .env.local"); }
}) as any;

const storage = isConfigValid ? getStorage(app) : new Proxy({}, {
    get: () => { throw new Error("Firebase Storage is not initialized. Missing environment variables in .env.local"); }
}) as any;

if (!isConfigValid) {
    console.warn("Firebase configuration is missing. Auth, Firestore, and Storage will not function.");
}

export { auth, db, storage, app, isConfigValid };
