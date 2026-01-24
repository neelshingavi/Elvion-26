import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    getDoc
} from "firebase/firestore";
import { JobSeekerProfile, JobMatch } from "./types/job-seeker";
import { Startup } from "./startup-service";

// Profile Services
export const createJobSeekerProfile = async (uid: string, data: Partial<JobSeekerProfile>) => {
    const profileRef = doc(db, "jobSeekers", uid);
    await setDoc(profileRef, {
        uid,
        ...data,
        readinessScore: Math.floor(Math.random() * 40) + 60, // Mock AI scoring start 60-100
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getJobSeekerProfile = async (uid: string): Promise<JobSeekerProfile | null> => {
    const docRef = doc(db, "jobSeekers", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as JobSeekerProfile;
    }
    return null;
};

// Application Services
export const getMyApplications = async (uid: string) => {
    const q = query(
        collection(db, "applications"),
        where("jobSeekerId", "==", uid),
        orderBy("appliedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Matching Engine (Mock)
export const getJobMatches = async (profile: JobSeekerProfile): Promise<{ startup: Startup, match: JobMatch }[]> => {
    // 1. Fetch active startups
    const q = query(collection(db, "startups"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const allStartups = snapshot.docs.map(doc => ({ startupId: doc.id, ...doc.data() })) as Startup[];

    // 2. Mock matching logic
    return allStartups.map(startup => {
        const score = Math.floor(Math.random() * 100);
        return {
            startup,
            match: {
                startupId: startup.startupId,
                matchScore: score,
                reason: "High alignment with your skill set in AI/ML.",
                missingSkills: ["Kubernetes"],
                urgency: score > 80 ? "high" : "medium"
            }
        };
    }).sort((a, b) => b.match.matchScore - a.match.matchScore);
};
