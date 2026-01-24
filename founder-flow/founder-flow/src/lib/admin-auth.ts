"use client";

import Cookies from "js-cookie";

const ADMIN_COOKIE_NAME = "founderflow_admin_session";
const ADMIN_USERNAME = "admin@123";
const ADMIN_PASSWORD = "123456";

export const loginAdmin = (username: string, pass: string): boolean => {
    if (username === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        // Set cookie for 1 day
        Cookies.set(ADMIN_COOKIE_NAME, "true", { expires: 1 });
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
