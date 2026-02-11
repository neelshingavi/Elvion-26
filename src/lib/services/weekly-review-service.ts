
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { WeeklyReview } from "@/types/weekly-review";

export const WeeklyReviewService = {
    // Get the current week number (ISO 8601 or simpler based on year)
    getWeekNumber: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    },

    getReviewId: (userId: string, week: number, year: number) => {
        return `${userId}_${year}_${week}`;
    },

    async getLatestReview(userId: string): Promise<WeeklyReview | null> {
        const q = query(
            collection(db, "weekly_reviews"),
            where("userId", "==", userId),
            where("status", "==", "completed"),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return snap.docs[0].data() as WeeklyReview;
    },

    async getDraft(userId: string): Promise<WeeklyReview | null> {
        // A draft is essentially the current week's Review if not completed
        const currentWeek = WeeklyReviewService.getWeekNumber();
        const currentYear = new Date().getFullYear();
        const id = WeeklyReviewService.getReviewId(userId, currentWeek, currentYear);

        const docRef = doc(db, "weekly_reviews", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data() as WeeklyReview;
            if (data.status === 'draft') return data;
        }
        return null;
    },

    async saveDraft(review: WeeklyReview) {
        const id = WeeklyReviewService.getReviewId(review.userId, review.weekNumber, review.year);
        // Ensure status is draft
        const dataToSave = { ...review, id, updatedAt: serverTimestamp(), status: 'draft' };
        await setDoc(doc(db, "weekly_reviews", id), dataToSave, { merge: true });
        return id;
    },

    async submitReview(review: WeeklyReview) {
        const id = WeeklyReviewService.getReviewId(review.userId, review.weekNumber, review.year);
        const dataToSave = { ...review, id, updatedAt: serverTimestamp(), status: 'completed', createdAt: review.createdAt || serverTimestamp() };
        await setDoc(doc(db, "weekly_reviews", id), dataToSave, { merge: true });
        return id;
    }
};
