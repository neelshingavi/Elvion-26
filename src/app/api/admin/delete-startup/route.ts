import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionCookie } from "@/lib/server/admin-session";
import { deleteStartupFullyAdmin } from "@/lib/server/admin-data";

async function requireAdmin(request: Request) {
    const cookie = request.headers.get("cookie") || "";
    const match = cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
    const value = match ? decodeURIComponent(match.split("=")[1] || "") : null;
    const session = await verifyAdminSessionCookie(value);
    return session.valid;
}

export async function POST(request: Request) {
    const ok = await requireAdmin(request);
    if (!ok) {
        return NextResponse.json(
            { error: { message: "Unauthorized.", code: "admin/unauthorized" } },
            { status: 401 }
        );
    }

    try {
        const { startupId } = await request.json();
        if (!startupId) {
            return NextResponse.json(
                { error: { message: "startupId is required.", code: "admin/missing-startup" } },
                { status: 400 }
            );
        }

        await deleteStartupFullyAdmin(String(startupId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete startup error:", error);
        return NextResponse.json(
            { error: { message: "Failed to delete startup.", code: "admin/delete-startup-failed" } },
            { status: 500 }
        );
    }
}
