import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionCookie } from "@/lib/server/admin-session";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = String(body?.username || "");
        const password = String(body?.password || "");

        const expectedUser = process.env.ADMIN_USERNAME || "";
        const expectedPass = process.env.ADMIN_PASSWORD || "";

        if (!expectedUser || !expectedPass) {
            return NextResponse.json(
                { error: { message: "Admin credentials are not configured.", code: "admin/not-configured" } },
                { status: 500 }
            );
        }

        if (!username || !password) {
            return NextResponse.json(
                { error: { message: "Username and password are required.", code: "admin/missing-credentials" } },
                { status: 400 }
            );
        }

        if (username !== expectedUser || password !== expectedPass) {
            return NextResponse.json(
                { error: { message: "Invalid credentials.", code: "admin/invalid-credentials" } },
                { status: 401 }
            );
        }

        const sessionValue = await createAdminSessionCookie();
        const response = NextResponse.json({ success: true });
        response.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: sessionValue,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24
        });
        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: { message: "Failed to authenticate.", code: "admin/login-failed" } },
            { status: 500 }
        );
    }
}
