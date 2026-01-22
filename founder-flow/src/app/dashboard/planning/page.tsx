"use client";

import { Map as MapIcon, Loader2, Rocket, Flag, Target, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStartup } from "@/hooks/useStartup";
import { cn } from "@/lib/utils";

export default function PlanningPage() {
    const { user } = useAuth();
    const { startup, loading } = useStartup();
    const [generating, setGenerating] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const generateRoadmap = async () => {
        if (!startup) return;
        setGenerating(true);
        try {
            await fetch("/api/generate-roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startupId: startup.startupId, idea: startup.idea }),
            });
        } catch (error) {
            console.error("Roadmap generation failed:", error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
                        <MapIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Strategic Roadmap</h1>
                        <p className="text-zinc-500">AI-generated milestones for your startup.</p>
                    </div>
                </div>

                {!startup || startup.stage === "idea_submitted" ? (
                    <button
                        onClick={generateRoadmap}
                        disabled={generating}
                        className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md disabled:bg-zinc-400"
                    >
                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        Generate Roadmap
                    </button>
                ) : null}
            </div>

            <div className="relative">
                {!startup || startup.stage === "idea_submitted" ? (
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
                        {[
                            { stage: "idea_validated", title: "Validation & Strategy", description: "Focusing on market fit and initial strategy." },
                            { stage: "roadmap_created", title: "Technical Blueprint", description: "Architecture and core feature definition." },
                            { stage: "execution_active", title: "Build & Launch", description: "Sprinting towards the MVP launch." }
                        ].map((step, i) => {
                            const isCompleted = ["idea_validated", "roadmap_created", "execution_active"].indexOf(startup.stage) > ["idea_validated", "roadmap_created", "execution_active"].indexOf(step.stage);
                            const isCurrent = startup.stage === step.stage;

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "group p-8 rounded-3xl border transition-all",
                                        isCompleted
                                            ? "bg-green-500/5 border-green-500/10"
                                            : isCurrent
                                                ? "bg-white dark:bg-zinc-900 border-black dark:border-white shadow-xl scale-[1.02]"
                                                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-60"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <span className={cn(
                                                "text-xs font-black uppercase tracking-widest",
                                                isCompleted ? "text-green-500" : "text-zinc-400"
                                            )}>
                                                {step.stage.replace("_", " ")}
                                            </span>
                                            <h3 className="text-2xl font-bold">{step.title}</h3>
                                            <p className="text-zinc-500 max-w-lg">{step.description}</p>
                                        </div>
                                        <div className={cn(
                                            "p-3 rounded-2xl",
                                            isCompleted ? "bg-green-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                        )}>
                                            {isCompleted ? <Flag className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
