"use client";

import { Map as MapIcon, Loader2, Rocket, Flag, Target, Sparkles, ChevronRight, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStartup } from "@/hooks/useStartup";
import { cn } from "@/lib/utils";
import { getStartupMemory, StartupMemory } from "@/lib/startup-service";
import { motion, AnimatePresence } from "framer-motion";

interface RoadmapPhase {
    title: string;
    duration: string;
    description: string;
    milestones: string[];
}

interface RoadmapData {
    phases: RoadmapPhase[];
    pros: string[];
    cons: string[];
}

export default function PlanningPage() {
    const { user } = useAuth();
    const { startup, loading: startupLoading } = useStartup();
    const [generating, setGenerating] = useState(false);
    const [history, setHistory] = useState<StartupMemory[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<StartupMemory | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getVerdictLabel = (content: string) => {
        try {
            const parsed = JSON.parse(content);
            return parsed.implementation_verdict || "Report";
        } catch {
            return "Report";
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            if (startup?.startupId) {
                const mems = await getStartupMemory(startup.startupId);
                const validationMems = mems.filter(m => m.type === "agent-output");
                setHistory(validationMems);

                // If there's an existing roadmap in memory, load it
                const existingRoadmap = mems.find(m => m.type === "agent-output" && m.content.includes("\"phases\":"));
                if (existingRoadmap && !roadmap) {
                    try {
                        const data = JSON.parse(existingRoadmap.content);
                        if (data.phases) setRoadmap(data);
                    } catch (e) { }
                }
            }
        };
        fetchHistory();
    }, [startup?.startupId]);

    const handleGenerate = async () => {
        if (!startup || !selectedIdea) return;
        if (!user) {
            setError("You must be logged in to generate a roadmap.");
            return;
        }

        setGenerating(true);
        setError(null);
        try {
            let ideaData: any = {};
            try {
                ideaData = JSON.parse(selectedIdea.content);
            } catch {
                ideaData = { summary: selectedIdea.content };
            }
            const token = await user.getIdToken();
            const res = await fetch("/api/generate-roadmap", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    startupId: startup.startupId,
                    idea: ideaData.summary || selectedIdea.content.substring(0, 100),
                    context: selectedIdea.content
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const message = typeof data.error === "string" ? data.error : data.error?.message || "Failed to generate roadmap";
                throw new Error(message);
            }
            setRoadmap(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    if (startupLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 max-w-full mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-soft text-primary rounded-2xl">
                        <MapIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Strategic Roadmap</h1>
                        <p className="text-muted">Transform your validated idea into an actionable plan</p>
                    </div>
                </div>

                {!roadmap && history.length > 0 && (
                    <div className="flex items-center gap-3">
                        <select
                            onChange={(e) => {
                                const mem = history.find(m => m.id === e.target.value);
                                setSelectedIdea(mem || null);
                            }}
                            className="bg-surface-alt border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                        >
                            <option value="">Select Validated Idea</option>
                            {history.map((mem) => (
                                <option key={mem.id} value={mem.id}>
                                    {new Date(mem.timestamp?.toDate?.() || Date.now()).toLocaleDateString()} - {getVerdictLabel(mem.content)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || !selectedIdea}
                            className="flex items-center gap-2 px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Generate
                        </button>
                    </div>
                )}

                {roadmap && (
                    <button
                        onClick={() => { setRoadmap(null); setSelectedIdea(null); }}
                        className="text-sm font-medium text-primary hover:text-primary"
                    >
                        Create New Roadmap
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-danger-soft0/10 border border-red-500/20 text-danger flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {!roadmap ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-12 rounded-[2.5rem] bg-surface-alt border-2 border-dashed border-subtle flex flex-col items-center text-center"
                    >
                        <div className="p-4 bg-surface rounded-full mb-4 shadow-sm">
                            <Rocket className="w-12 h-12 text-subtle dark:text-muted" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Roadmap Generated</h3>
                        <p className="text-muted max-w-sm mb-6">
                            {history.length > 0
                                ? "Select one of your validated ideas above to generate a custom strategic roadmap."
                                : "You haven't validated any ideas yet. Go to Idea Validation first!"}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-12"
                    >
                        {/* Phases Flow */}
                        <div className="relative">
                            {/* Horizontal Line for Desktop */}
                            <div className="hidden lg:block absolute top-[120px] left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20" />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {roadmap.phases.map((phase, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.2 }}
                                        className="relative group"
                                    >
                                        <div className="mb-8 flex flex-col items-center">
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-4 shadow-xl z-10 transition-transform group-hover:scale-110",
                                                idx === 0 ? "bg-primary" : idx === 1 ? "bg-secondary" : "bg-info"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-subtle flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {phase.duration}
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-3xl bg-surface border border-subtle shadow-xl group-hover:border-primary transition-all">
                                            <h3 className="text-lg font-bold mb-3">{phase.title}</h3>
                                            <p className="text-sm text-muted mb-6 leading-relaxed">{phase.description}</p>

                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black uppercase text-subtle tracking-tighter">Key Milestones</div>
                                                {phase.milestones.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-sm font-medium">
                                                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                                                        <span>{m}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {idx < 2 && (
                                            <div className="hidden lg:block absolute -right-4 top-[120px] z-20">
                                                <div className="bg-surface p-1 rounded-full border border-subtle">
                                                    <ChevronRight className="w-4 h-4 text-subtle" />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Pros & Cons Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-8 rounded-[2rem] bg-success-soft border border-success/20"
                            >
                                <div className="flex items-center gap-3 mb-6 text-success">
                                    <div className="p-2 bg-success-soft rounded-lg">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-bold">Strategic Pros</h4>
                                </div>
                                <ul className="space-y-4">
                                    {roadmap.pros.map((pro, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                                            <p className="text-muted font-medium">{pro}</p>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-8 rounded-[2rem] bg-danger-soft0/5 border border-red-500/10"
                            >
                                <div className="flex items-center gap-3 mb-6 text-danger dark:text-danger">
                                    <div className="p-2 bg-danger-soft0/10 rounded-lg">
                                        <TrendingDown className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-bold">Potential Challenges</h4>
                                </div>
                                <ul className="space-y-4">
                                    {roadmap.cons.map((con, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-danger-soft0 mt-2" />
                                            <p className="text-muted font-medium">{con}</p>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
