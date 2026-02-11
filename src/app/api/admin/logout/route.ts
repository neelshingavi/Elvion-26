import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/server/admin-session";

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0
    });
    return response;
}
