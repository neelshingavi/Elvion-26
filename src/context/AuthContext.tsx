"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db, isConfigValid } from "@/lib/firebase";
import { FounderProfile } from "@/lib/types/founder";

interface AuthContextType {
    user: User | null;
    userData: FounderProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<FounderProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isConfigValid) {
            setLoading(false);
            return;
        }

        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // If user logged in, listen to their profile to get onboarding status
                // Using onSnapshot ensures real-time updates for onboarding completion
                unsubscribeSnapshot = onSnapshot(doc(db, "users", currentUser.uid), (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setUserData(docSnapshot.data() as FounderProfile);
                    } else {
                        // Doc might not exist yet during signup creation flow
                        setUserData(null);
                    }
                    // Only stop loading once we've attempted to fetch profile
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user profile:", error);
                    setLoading(false);
                });
            } else {
                // If logged out clear everything
                setUserData(null);
                setLoading(false);
                if (unsubscribeSnapshot) {
                    unsubscribeSnapshot();
                    unsubscribeSnapshot = undefined;
                }
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {/* Prevent flash of content by waiting for auth check */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
