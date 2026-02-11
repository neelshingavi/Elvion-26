"use client";

export async function loginAdmin(username: string, password: string): Promise<boolean> {
    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) return false;
        const data = await response.json();
        return Boolean(data?.success);
    } catch (error) {
        console.error("Admin login failed:", error);
        return false;
    }
}

export async function logoutAdmin() {
    try {
        await fetch("/api/admin/logout", { method: "POST" });
    } catch (error) {
        console.error("Admin logout failed:", error);
    }
}

export async function isAdminLoggedIn(): Promise<boolean> {
    try {
        const response = await fetch("/api/admin/session", { method: "GET" });
        if (!response.ok) return false;
        const data = await response.json();
        return Boolean(data?.authorized);
    } catch (error) {
        console.error("Admin session check failed:", error);
        return false;
    }
}
