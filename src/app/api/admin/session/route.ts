import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionCookie } from "@/lib/server/admin-session";

export async function GET(request: Request) {
    const cookie = request.headers.get("cookie") || "";
    const match = cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
    const value = match ? decodeURIComponent(match.split("=")[1] || "") : null;

    const session = await verifyAdminSessionCookie(value);
    return NextResponse.json({ authorized: session.valid });
}
