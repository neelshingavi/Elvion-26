"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Map, Loader2, Rocket, Flag, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const mockRoadmap = [
    { stage: "Phase 1", title: "Core MVP Development", description: "Build the landing page and basic auth flow.", status: "completed" },
    { stage: "Phase 2", title: "AI Orchestrator Setup", description: "Connect Gemini and build the agent switching logic.", status: "current" },
    { stage: "Phase 3", title: "Matching Logic", description: "Implement vector-based matching for users.", status: "future" },
    { stage: "Phase 4", title: "Public Launch", description: "Open beta for initial test group.", status: "future" },
];

export default function PlanningPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<any[] | null>(null);

    const generateRoadmap = async () => {
        setLoading(true);
        // Simulate API call to Gemini
        setTimeout(() => {
            setRoadmap(mockRoadmap);
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
                        <Map className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Strategic Roadmap</h1>
                        <p className="text-zinc-500">AI-generated milestones for your startup.</p>
                    </div>
                </div>

                {!roadmap && (
                    <button
                        onClick={generateRoadmap}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md disabled:bg-zinc-400"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        Generate Roadmap
                    </button>
                )}
            </div>

            <div className="relative">
                {!roadmap ? (
                    <div className="p-12 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-full mb-4 shadow-sm">
                            <Rocket className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Roadmap Yet</h3>
                        <p className="text-zinc-500 max-w-sm mb-6">
                            Our Planning Agent takes your validated idea and breaks it down into actionable phases.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {roadmap.map((step, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "group p-8 rounded-3xl border transition-all",
                                    step.status === "completed"
                                        ? "bg-green-500/5 border-green-500/10"
                                        : step.status === "current"
                                            ? "bg-white dark:bg-zinc-900 border-black dark:border-white shadow-xl scale-[1.02]"
                                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-60"
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-widest",
                                            step.status === "completed" ? "text-green-500" : "text-zinc-400"
                                        )}>
                                            {step.stage}
                                        </span>
                                        <h3 className="text-2xl font-bold">{step.title}</h3>
                                        <p className="text-zinc-500 max-w-lg">{step.description}</p>
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl",
                                        step.status === "completed" ? "bg-green-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                    )}>
                                        {step.status === "completed" ? <Flag className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
