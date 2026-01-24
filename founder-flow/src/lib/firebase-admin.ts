import "server-only";
import admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(params: FirebaseAdminConfig) {
    const privateKey = formatPrivateKey(params.privateKey);

    if (admin.apps.length > 0) {
        return admin.app();
    }

    const cert = admin.credential.cert({
        projectId: params.projectId,
        clientEmail: params.clientEmail,
        privateKey: privateKey,
    });

    return admin.initializeApp({
        credential: cert,
        projectId: params.projectId,
    });
}

export async function initAdmin() {
    const params = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
        privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    };

    if (!params.clientEmail || !params.privateKey) {
        throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");
    }

    return createFirebaseAdminApp(params);
}
