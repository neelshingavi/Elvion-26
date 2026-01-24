"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStartup } from "@/lib/startup-service";
import { submitFeedback, trackCustomerEvent } from "@/lib/customer-service";
import { Startup } from "@/lib/startup-service";
import {
    ArrowLeft,
    MessageSquare,
    Send,
    ThumbsUp,
    AlertCircle,
    Lightbulb
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FeedbackPage({ params }: { params: Promise<{ startupId: string }> }) {
    const unwrappedParams = use(params);
    const { startupId } = unwrappedParams;
    const { user } = useAuth();
    const router = useRouter();
    const [startup, setStartup] = useState<Startup | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<"general" | "bug" | "feature_request">("general");
    const [content, setContent] = useState("");
    const [nps, setNps] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getStartup(startupId);
                setStartup(data);
            } catch (error) {
                console.error("Failed to load startup:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [startupId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !startup) return;
        setSubmitting(true);

        try {
            await submitFeedback({
                customerId: user.uid,
                startupId: startup.startupId,
                type,
                content,
                rating: nps || undefined
            });

            await trackCustomerEvent(user.uid, startup.startupId, "feedback_submit");

            // Show success logic or redirect
            router.push("/customer/dashboard");
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!startup) return <div>Startup not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
                href="/customer/products"
                className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Discovery
            </Link>

            <header className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Giving Feedback to
                </div>
                <h1 className="text-4xl font-bold tracking-tight">{startup.idea}</h1>
                <p className="text-zinc-500 text-lg">
                    Your insights help shape this product. Be honest and specific.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Feedback Type Selection */}
                <div className="grid grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => setType("general")}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${type === "general" ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black" : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                    >
                        <MessageSquare className="w-6 h-6 mb-2" />
                        <span className="font-bold text-sm">General</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("feature_request")}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${type === "feature_request" ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black" : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                    >
                        <Lightbulb className="w-6 h-6 mb-2" />
                        <span className="font-bold text-sm">Idea</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("bug")}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${type === "bug" ? "border-black dark:border-white bg-black text-white dark:bg-white dark:text-black" : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                    >
                        <AlertCircle className="w-6 h-6 mb-2" />
                        <span className="font-bold text-sm">Issue</span>
                    </button>
                </div>

                {/* Rating (NPS) */}
                <div className="space-y-4">
                    <label className="block font-bold">How likely are you to recommend this?</label>
                    <div className="flex justify-between gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                            <button
                                key={score}
                                type="button"
                                onClick={() => setNps(score)}
                                className={`flex-1 aspect-square rounded-lg font-bold transition-all text-sm ${nps === score ? "bg-black text-white dark:bg-white dark:text-black scale-110" : "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
                            >
                                {score}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="block font-bold">
                        {type === "bug" ? "Describe the issue" : type === "feature_request" ? "Describe your idea" : "Your Feedback"}
                    </label>
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                        placeholder="Share your thoughts..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting || !content}
                    className="w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {submitting ? "Sending..." : (
                        <>
                            Submit Feedback
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
