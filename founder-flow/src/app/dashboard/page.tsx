"use client";

import { useAuth } from "@/context/AuthContext";
import { Rocket, Target, Users, Zap } from "lucide-react";
import { getNextRequiredAgent } from "@/lib/orchestrator";

export default function DashboardPage() {
    const { user } = useAuth();

    const nextAgent = getNextRequiredAgent(null);

    const stats = [
        { name: "Startup Milestone", value: "Idea Phase", icon: Rocket, color: "text-blue-500" },
        { name: "Active Agent", value: nextAgent.charAt(0).toUpperCase() + nextAgent.slice(1).replace("-", " "), icon: Zap, color: "text-yellow-500" },
        { name: "Community Rank", value: "Novice", icon: Users, color: "text-green-500" },
        { name: "Next Step", value: "Validate Premise", icon: Target, color: "text-purple-500" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {user?.displayName || "Founder"}
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Your AI agents are ready to assist. What are we building today?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    {stat.name}
                                </p>
                                <p className="text-lg font-bold">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-black text-white dark:bg-zinc-50 dark:text-black">
                    <h3 className="text-2xl font-bold mb-4">Launch Agent</h3>
                    <p className="opacity-70 mb-8 max-w-sm">
                        Ready to turn your vision into reality? Start the validation process and let our agents draft your first roadmap.
                    </p>
                    <button className="px-6 py-3 bg-white text-black dark:bg-black dark:text-white rounded-xl font-bold hover:scale-105 transition-transform">
                        Start Idea Check
                    </button>
                </div>

                <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-2xl font-bold mb-4">Startup Memory</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                        Every decision, agent output, and pivot is logged here for continuity and learning.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700">
                            <span className="text-sm italic text-zinc-400">No activity logged yet...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
