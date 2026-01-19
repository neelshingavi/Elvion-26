"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Rocket,
    Briefcase,
    TrendingUp,
    Users,
    Check,
    ChevronRight,
    Sparkles,
    ArrowLeft
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
    },
    {
        id: "job_seeker",
        title: "Job Seeker",
        description: "I want to join a fast-growing startup team.",
        icon: Briefcase,
    },
    {
        id: "customer",
        title: "Customer",
        description: "I want to discover and test new products.",
        icon: Users,
    },
];

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [idea, setIdea] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRoleSubmit = async () => {
        if (!selectedRole || !user) return;

        setLoading(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                role: selectedRole,
                createdAt: serverTimestamp(),
            }, { merge: true });

            if (selectedRole === "founder") {
                setStep(2);
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Error saving role:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea || !user) return;

        setLoading(true);
        try {
            await createStartup(user.uid, idea);
            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating startup:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] p-4 font-sans">
            <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

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
                    <form onSubmit={handleStartupSubmit} className="max-w-md mx-auto w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                                Step 2: The Vision
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">
                                What are you building?
                            </h1>
                            <p className="text-zinc-500">
                                Describe your startup idea in one or two sentences. Our agents will take it from there.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="A platform that uses AI agents to help founders scale..."
                                className="w-full h-32 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
                                required
                            />

                            <button
                                type="submit"
                                disabled={!idea || loading}
                                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                            >
                                {loading ? "Initializing Agents..." : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Initialize Startup
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
