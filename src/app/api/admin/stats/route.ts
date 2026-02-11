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
        const db = await getAdminDb();
        let totalUsers = 0;
        let totalStartups = 0;
        try {
            totalUsers = (await db.collection("users").count().get()).data().count;
        } catch {
            totalUsers = (await db.collection("users").get()).size;
        }
        try {
            totalStartups = (await db.collection("startups").count().get()).data().count;
        } catch {
            totalStartups = (await db.collection("startups").get()).size;
        }

        let founders = 0;
        let others = 0;

        const usersSnap = await db.collection("users").select("role").get();
        usersSnap.forEach((doc) => {
            const role = doc.data().role;
            if (role === "founder") founders++;
            else others++;
        });

        return NextResponse.json({
            founders,
            others,
            startups: totalStartups,
            totalUsers
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: { message: "Failed to load stats.", code: "admin/stats-failed" } },
            { status: 500 }
        );
    }
}
