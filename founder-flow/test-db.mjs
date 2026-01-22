
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDO-YX8PoKWofKoo6_lrLeBDReTpc3XXCE",
    authDomain: "founderflow-60e46.firebaseapp.com",
    projectId: "founderflow-60e46",
    storageBucket: "founderflow-60e46.firebasestorage.app",
    messagingSenderId: "1073418675310",
    appId: "1:1073418675310:web:45b30fb874d58f4a61f27f",
};

console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Attempting to write to Firestore...");

const testWrite = async () => {
    try {
        await setDoc(doc(db, "test_connectivity", "test_doc"), {
            timestamp: serverTimestamp(),
            status: "ok"
        });
        console.log("✅ Successfully wrote to Firestore!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to write to Firestore:", error);
        process.exit(1);
    }
};

testWrite();
