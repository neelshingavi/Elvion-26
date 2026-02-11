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
        <div className="min-h-screen bg-app p-6 flex items-center justify-center font-sans">
            <div className="w-full max-w-2xl card p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-subtle hover:text-strong transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </button>

                <div className="space-y-2 mb-8">
                    <h1 className="text-h1 text-strong">
                        New Project
                    </h1>
                    <p className="text-body">
                        Launch a new startup workspace. Your agents will be scoped to this project.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-soft border border-danger text-danger text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-overline">
                                Project Name
                            </label>
                            <input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Acme Corp"
                                className="input"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-overline">
                                Industry
                            </label>
                            <select
                                required
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="select"
                            >
                                <option value="" disabled>Select Industry</option>
                                {industries.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-overline">
                            Problem Statement
                        </label>
                        <textarea
                            value={formData.problemStatement}
                            onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                            placeholder="What painful problem are you solving?"
                            className="input h-24 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-overline">
                            One-Liner Solution (The Idea)
                        </label>
                        <textarea
                            required
                            value={formData.idea}
                            onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                            placeholder="Describe your solution in one sentence..."
                            className="input h-24 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-overline">
                            Long-Term Vision (Optional)
                        </label>
                        <textarea
                            value={formData.vision}
                            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                            placeholder="Where do you see this in 5 years?"
                            className="input h-24 resize-none"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
