import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: Request) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "UID is required" }, { status: 400 });
        }

        // Initialize Admin (checks for env vars)
        try {
            await initAdmin();
        } catch (e) {
            console.error("Firebase Admin Init Error:", e);
            return NextResponse.json({
                error: "Server configuration missing. Cannot delete Auth User without Service Account."
            }, { status: 500 });
        }

        await getAuth().deleteUser(uid);

        return NextResponse.json({ success: true, message: `User ${uid} deleted from Auth.` });
    } catch (error: any) {
        console.error("Delete User API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
    }
}
