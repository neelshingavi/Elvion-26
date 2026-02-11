import "server-only";

export const ADMIN_COOKIE_NAME = "founderflow_admin_session";
const DEFAULT_SESSION_SECONDS = 60 * 60 * 24; // 1 day

const encoder = new TextEncoder();

function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error("Missing ADMIN_SESSION_SECRET");
    }
    return secret;
}

function base64UrlEncode(bytes: Uint8Array) {
    let base64: string;
    if (typeof Buffer !== "undefined") {
        base64 = Buffer.from(bytes).toString("base64");
    } else {
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        base64 = btoa(binary);
    }
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
    if (typeof Buffer !== "undefined") {
        return new Uint8Array(Buffer.from(base64, "base64"));
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function sign(value: string, secret: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
    return base64UrlEncode(new Uint8Array(signature));
}

async function verifySignature(value: string, signature: string, secret: string) {
    const expected = await sign(value, secret);
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
        diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
}

export interface AdminSessionPayload {
    iat: number;
    exp: number;
}

export async function createAdminSessionCookie(maxAgeSeconds: number = DEFAULT_SESSION_SECONDS) {
    const now = Date.now();
    const payload: AdminSessionPayload = {
        iat: now,
        exp: now + maxAgeSeconds * 1000
    };
    const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const signature = await sign(payloadB64, getSessionSecret());
    return `${payloadB64}.${signature}`;
}

export async function verifyAdminSessionCookie(token?: string | null) {
    if (!token) return { valid: false };
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return { valid: false };
    let secret: string;
    try {
        secret = getSessionSecret();
    } catch (error) {
        console.error("Admin session secret missing:", error);
        return { valid: false };
    }
    const isValid = await verifySignature(payloadB64, signature, secret);
    if (!isValid) return { valid: false };

    try {
        const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
        const payload = JSON.parse(payloadJson) as AdminSessionPayload;
        if (!payload.exp || Date.now() > payload.exp) return { valid: false };
        return { valid: true, payload };
    } catch (error) {
        console.error("Failed to parse admin session payload:", error);
        return { valid: false };
    }
}
