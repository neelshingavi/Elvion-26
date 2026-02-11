import { db, storage } from "./firebase";
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FounderProfile as UserData } from "./types/founder";
import { auth } from "./firebase";

/**
 * Profile Service
 * Handles all user profile related data operations with Firestore and Firebase Storage.
 */

export const getProfile = async (uid: string): Promise<UserData | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { uid, ...userSnap.data() } as UserData;
        }
        return null;
    } catch (error) {
        console.error("[ProfileService] Error fetching profile:", error);
        throw error;
    }
};

export const subscribeToProfile = (uid: string, callback: (data: UserData) => void) => {
    const userRef = doc(db, "users", uid);
    return onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
            callback({ uid, ...snap.data() } as UserData);
        }
    });
};

export const updateProfileData = async (uid: string, data: Partial<UserData>): Promise<void> => {
    try {
        const userRef = doc(db, "users", uid);

        // Sanitize data - remove undefined fields to prevent silent failures or overwrites
        const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {} as Record<string, any>);

        // Update standard Firestore doc
        await updateDoc(userRef, {
            ...sanitizedData,
            updatedAt: serverTimestamp()
        });

        // If displayName is updated, also update Firebase Auth profile
        if (data.displayName && auth.currentUser) {
            await updateAuthProfile(auth.currentUser, {
                displayName: data.displayName
            });
        }

        // If photoURL is updated, also update Firebase Auth profile
        if (data.photoURL && auth.currentUser) {
            await updateAuthProfile(auth.currentUser, {
                photoURL: data.photoURL
            });
        }
    } catch (error) {
        console.error("[ProfileService] Error updating profile:", error);
        throw error;
    }
};

export const uploadProfileImage = async (
    uid: string,
    file: File,
    type: 'avatar' | 'banner'
): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB limit.");
    }

    try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const filePath = `users/${uid}/profile_${type}_${timestamp}.${extension}`;
        const storageRef = ref(storage, filePath);

        const result = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(result.ref);

        // Update the respective field in Firestore immediately
        const field = type === 'avatar' ? 'photoURL' : 'bannerURL';
        await updateProfileData(uid, { [field]: downloadURL });

        return downloadURL;
    } catch (error) {
        console.error("[ProfileService] Image upload failed:", error);
        throw error;
    }
};
