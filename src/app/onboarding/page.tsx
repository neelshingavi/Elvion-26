"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Rocket,
    Sparkles,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createStartup } from "@/lib/startup-service";

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        industry: "",
        idea: "",
        vision: "",
        problemStatement: ""
    });

    // Industries List
    const industries = [
        "SaaS / B2B Software",
        "Consumer App / B2C",
        "Fintech",
        "HealthTech",
        "E-commerce",
        "EdTech",
        "Artificial Intelligence",
        "GreenTech / Sustainability",
        "Web3 / Blockchain",
        "Hardware / IoT",
        "Other"
    ];

    // Timeout helper
    const withTimeout = <T,>(promise: Promise<T>, ms: number = 8000, errorMessage: string = "Request timed out"): Promise<T> => {
        const timeout = new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), ms)
        );
        return Promise.race([promise, timeout]);
    };

    // Auto-set founder role on mount
    useEffect(() => {
        const initializeFounderRole = async () => {
            if (!user) return;

            try {
                await withTimeout(
                    setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        role: "founder",
                        createdAt: serverTimestamp(),
                    }, { merge: true }),
                    10000,
                    "Network request timed out. Please check your internet connection."
                );
                setInitializing(false);
            } catch (err: any) {
                console.error("Error setting founder role:", err);
                setError(err.message || "Failed to initialize. Please try again.");
                setInitializing(false);
            }
        };

        initializeFounderRole();
    }, [user]);

    const handleStartupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            await withTimeout(
                createStartup(
                    user.uid,
                    formData.name,
                    formData.industry,
                    formData.idea,
                    formData.vision,
                    formData.problemStatement
                ),
                15000,
                "Startup initialization timed out. Please check your connection."
            );
            router.push("/founder/dashboard");
        } catch (err: any) {
            console.error("Error creating startup:", err);
            setError(err.message || "Failed to initialize startup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] p-4 font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-black dark:bg-white rounded-xl">
                        <Rocket className="w-6 h-6 text-white dark:text-black" />
                    </div>
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Initializing FounderFlow...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] p-4 font-sans">
            <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleStartupSubmit} className="max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-3 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                            <Rocket className="w-3 h-3" />
                            Founder Onboarding
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Launch Your Project Workspace
                        </h1>
                        <p className="text-zinc-500">
                            Your AI agents will be scoped to this project.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                    Project Name
                                </label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                    Industry
                                </label>
                                <select
                                    required
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all appearance-none"
                                >
                                    <option value="" disabled>Select Industry</option>
                                    {industries.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Problem Statement
                            </label>
                            <textarea
                                value={formData.problemStatement}
                                onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                                placeholder="What painful problem are you solving?"
                                className="w-full h-24 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                One-Liner Solution (The Idea)
                            </label>
                            <textarea
                                required
                                value={formData.idea}
                                onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                                placeholder="Describe your solution in one sentence..."
                                className="w-full h-24 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Long-Term Vision (Optional)
                            </label>
                            <textarea
                                value={formData.vision}
                                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                placeholder="Where do you see this in 5 years?"
                                className="w-full h-24 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!formData.idea || !formData.name || !formData.industry || loading}
                            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                        >
                            {loading ? "Initializing Agents..." : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Launch Project Workspace
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
