import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
    initializeAuth,
    browserLocalPersistence,
    browserPopupRedirectResolver
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Improved Auth initialization for browser environments
const auth = isConfigValid
    ? (typeof window !== "undefined"
        ? initializeAuth(app, {
            persistence: browserLocalPersistence,
            popupRedirectResolver: browserPopupRedirectResolver,
        })
        : getAuth(app))
    : ({} as any);
const db = isConfigValid ? getFirestore(app) : ({} as any);

if (!isConfigValid) {
    console.warn("Firebase configuration is missing. Auth and Firestore will not function.");
}

export { auth, db, app, isConfigValid };
