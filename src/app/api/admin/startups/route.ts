import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionCookie } from "@/lib/server/admin-session";
import { getAdminDb } from "@/lib/firebase-admin";

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

export async function GET(request: Request) {
    const ok = await requireAdmin(request);
    if (!ok) {
        return NextResponse.json(
            { error: { message: "Unauthorized.", code: "admin/unauthorized" } },
            { status: 401 }
        );
    }

    try {
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

        const db = await getAdminDb();
        const snapshot = await db
            .collection("startups")
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        const startups = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                idea: data.idea,
                stage: data.stage,
                createdAt: data.createdAt
            };
        });

        return NextResponse.json({ startups });
    } catch (error) {
        console.error("Admin startups error:", error);
        return NextResponse.json(
            { error: { message: "Failed to load startups.", code: "admin/startups-failed" } },
            { status: 500 }
        );
    }
}
