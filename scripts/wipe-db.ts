
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Environment Variables from .env.local
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.warn("No .env.local found! Please ensure environment variables are set.");
        return;
    }
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key.trim()] = val;
        }
    });
}

loadEnv();

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.error("❌ Missing specific keys in .env.local for Admin SDK:");
    console.error(`- NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${!!PROJECT_ID}`);
    console.error(`- FIREBASE_CLIENT_EMAIL: ${!!CLIENT_EMAIL}`);
    console.error(`- FIREBASE_PRIVATE_KEY: ${!!PRIVATE_KEY}`);
    console.error("Please add these to run the wipe script.");
    process.exit(1);
}

// 2. Initialize Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: PRIVATE_KEY,
        }),
        projectId: PROJECT_ID
    });
}

const db = admin.firestore();

// 3. Define Collections to Wipe
const COLLECTIONS = [
    "users",
    "startups",
    "startup_members",
    "startupMemory",
    "tasks",
    "agentRuns",
    "connections",
    "connection_requests",
    "chat_rooms",
    "dealflow",            // To be removed
    "project_connections", // To be removed
    "deal_ai_analysis",    // To be removed
    "chats"                // Contains 'messages' subcollection
];

async function wipeDatabase() {
    console.log("⚠️  WARNING: This will WIPE ALL DATA from the database!");
    console.log(`Target Project: ${PROJECT_ID}`);
    console.log("Waiting 5 seconds... Press Ctrl+C to cancel.");

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("🚀 Starting Wipe...");

    for (const colName of COLLECTIONS) {
        const colRef = db.collection(colName);
        const snapshot = await colRef.get();

        if (snapshot.empty) {
            console.log(`- ${colName}: Already empty.`);
            continue;
        }

        console.log(`- ${colName}: Deleting ${snapshot.size} documents (recursively)...`);

        // Use recursiveDelete to handle subcollections (like messages in chats)
        // We delete document by document to be safe, or use bulkWriter/recursiveDelete on collection?
        // recursiveDelete works on refs.

        const bulkDelete = await db.recursiveDelete(colRef);
        console.log(`  ✔ Deleted.`);
    }

    console.log("✅ Database Wipe Complete. Schema matches codebase.");
}

wipeDatabase().catch(console.error);
