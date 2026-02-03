"use client";

import Cookies from "js-cookie";

const ADMIN_COOKIE_NAME = "founderflow_admin_session";

// Admin credentials from environment variables
// In production, set NEXT_PUBLIC_ADMIN_USERNAME and NEXT_PUBLIC_ADMIN_PASSWORD
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

export const loginAdmin = (username: string, pass: string): boolean => {
    // Validate that credentials are configured
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        console.error("Admin credentials not configured in environment variables");
        return false;
    }

    if (username === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        // Set cookie for 1 day with secure attributes
        Cookies.set(ADMIN_COOKIE_NAME, "true", {
            expires: 1,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        return true;
    }
    return false;
};

export const logoutAdmin = () => {
    Cookies.remove(ADMIN_COOKIE_NAME);
};

export const isAdminLoggedIn = (): boolean => {
    return Cookies.get(ADMIN_COOKIE_NAME) === "true";
};
