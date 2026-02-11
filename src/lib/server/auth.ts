import "server-only";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const MAX_BODY_CHARS = 10000;

export type AuthResult =
    | { ok: true; uid: string; token: string }
    | { ok: false; response: NextResponse };

export async function requireUser(request: Request): Promise<AuthResult> {
    const authHeader = request.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    const token = match?.[1] || request.headers.get("x-firebase-auth-token");

    if (!token) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: { message: "Missing authentication token.", code: "auth/missing-token" } },
                { status: 401 }
            )
        };
    }

    try {
        const auth = await getAdminAuth();
        const decoded = await auth.verifyIdToken(token);
        return { ok: true, uid: decoded.uid, token };
    } catch (error) {
        console.error("Auth verification failed:", error);
        return {
            ok: false,
            response: NextResponse.json(
                { error: { message: "Invalid or expired authentication token.", code: "auth/invalid-token" } },
                { status: 401 }
            )
        };
    }
}

export type StartupAccessResult =
    | { ok: true; startup: Record<string, any>; role: string }
    | { ok: false; response: NextResponse };

export async function requireStartupAccess(startupId: string, uid: string): Promise<StartupAccessResult> {
    if (!startupId) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: { message: "startupId is required.", code: "startup/missing-id" } },
                { status: 400 }
            )
        };
    }

    const db = await getAdminDb();
    const startupRef = db.collection("startups").doc(startupId);
    const startupSnap = await startupRef.get();

    if (!startupSnap.exists) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: { message: "Startup not found.", code: "startup/not-found" } },
                { status: 404 }
            )
        };
    }

    const startup = startupSnap.data() || {};
    if (startup.ownerId === uid) {
        return { ok: true, startup, role: "owner" };
    }

    const membershipSnap = await db
        .collection("startup_members")
        .where("startupId", "==", startupId)
        .where("userId", "==", uid)
        .limit(1)
        .get();

    if (membershipSnap.empty) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: { message: "Access denied for this startup.", code: "startup/forbidden" } },
                { status: 403 }
            )
        };
    }

    const membership = membershipSnap.docs[0].data();
    return { ok: true, startup, role: membership.role || "member" };
}

export async function safeJson<T = any>(request: Request): Promise<T | null> {
    try {
        const text = await request.text();
        if (!text) return null;
        if (text.length > MAX_BODY_CHARS) return null;
        return JSON.parse(text);
    } catch {
        return null;
    }
}
