"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createStartup } from "@/lib/startup-service";

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

export default function CreateProjectPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        industry: "",
        idea: "",
        vision: "",
        problemStatement: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            await createStartup(
                user.uid,
                formData.name,
                formData.industry,
                formData.idea,
                formData.vision,
                formData.problemStatement,
                {
                    oneSentencePitch: formData.idea
                }
            );
            router.push("/founder/dashboard");
        } catch (err: any) {
            console.error("Error creating project:", err);
            setError(err.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    if (!user && !authLoading) return null;

    
    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-6 flex items-center justify-center font-sans">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black dark:hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </button>

                <div className="space-y-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        New Project
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Launch a new startup workspace. Your agents will be scoped to this project.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
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
                                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all appearance-none"
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
                            className="w-full h-24 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
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
                            className="w-full h-24 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
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
                            className="w-full h-24 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-bold hover:scale-[1.01] transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Workspace..." : (
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
