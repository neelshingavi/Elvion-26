"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Rocket,
    TrendingUp,
    Check,
    ChevronRight,
    Sparkles,
    ArrowLeft,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createStartup } from "@/lib/startup-service";

const roles = [
    {
        id: "founder",
        title: "Founder",
        description: "I want to build and scale my startup idea.",
        icon: Rocket,
    },
    {
        id: "investor",
        title: "Investor",
        description: "I am looking for high-potential startups to fund.",
        icon: TrendingUp,
    }
];

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleRoleSubmit = async () => {
        if (!selectedRole || !user) return;

        setLoading(true);
        setError(null);

        try {
            await withTimeout(
                setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    role: selectedRole,
                    createdAt: serverTimestamp(),
                }, { merge: true }),
                10000,
                "Network request timed out. Please check your internet connection."
            );

            if (selectedRole === "founder") {
                setStep(2);
            } else if (selectedRole.startsWith("investor")) {
                router.push("/investor/dashboard");
            } else {
                router.push("/founder/dashboard");
            }
        } catch (err: any) {
            console.error("Error saving role:", err);
            setError(err.message || "Failed to save role. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] p-4 font-sans">
            <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <>
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                                Step 1: Persona
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                Tell us about yourself
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Choose the role that best describes your intent on FounderFlow.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`relative flex flex-col items-start p-6 rounded-2xl border transition-all text-left group ${selectedRole === role.id
                                        ? "border-black dark:border-white bg-white dark:bg-zinc-900 shadow-xl shadow-black/5"
                                        : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                                        }`}
                                >
                                    <div
                                        className={`p-2 rounded-lg mb-4 transition-colors ${selectedRole === role.id
                                            ? "bg-black text-white dark:bg-white dark:text-black"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
                                            }`}
                                    >
                                        <role.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                                        {role.title}
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {role.description}
                                    </p>
                                    {selectedRole === role.id && (
                                        <div className="absolute top-4 right-4 text-black dark:text-white">
                                            <div className="p-1 bg-black dark:bg-white rounded-full">
                                                <Check className="w-3 h-3 text-white dark:text-black" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleRoleSubmit}
                                disabled={!selectedRole || loading}
                                className={`group flex items-center gap-2 px-10 py-4 rounded-2xl font-bold transition-all ${selectedRole && !loading
                                    ? "bg-black dark:bg-zinc-50 text-white dark:text-black hover:scale-105 shadow-lg shadow-black/10"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                    }`}
                            >
                                {loading ? "Saving..." : (
                                    <>
                                        Continue
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleStartupSubmit} className="max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Roles
                        </button>

                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                                Step 2: New Project
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Launch Project Workspace
                            </h1>
                            <p className="text-zinc-500">
                                Your agents will be scoped to this project.
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
                )}
            </div>
        </div>
    );
}
