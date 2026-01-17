"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, TrendingUp, Users, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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

import { Rocket } from "lucide-react";

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const handleContinue = () => {
        if (selectedRole) {
            // Here we would save the role to Firestore
            console.log("Selected role:", selectedRole);
            router.push("/dashboard");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] p-4 font-sans">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
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
                            className={`relative flex flex-col items-start p-6 rounded-2xl border transition-all text-left ${selectedRole === role.id
                                    ? "border-black dark:border-white bg-white dark:bg-zinc-900 shadow-sm"
                                    : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                                }`}
                        >
                            <div
                                className={`p-2 rounded-lg mb-4 ${selectedRole === role.id
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                    }`}
                            >
                                <role.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                                {role.title}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {role.description}
                            </p>
                            {selectedRole === role.id && (
                                <div className="absolute top-4 right-4 text-black dark:text-white">
                                    <Check className="w-5 h-5" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center pt-8">
                    <button
                        onClick={handleContinue}
                        disabled={!selectedRole}
                        className={`px-8 py-3 rounded-xl font-medium transition-all ${selectedRole
                                ? "bg-black dark:bg-zinc-50 text-white dark:text-black hover:scale-105 active:scale-95"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            }`}
                    >
                        Continue to FounderFlow
                    </button>
                </div>
            </div>
        </div>
    );
}
