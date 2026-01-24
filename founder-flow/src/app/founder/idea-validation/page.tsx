"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStartup } from "@/hooks/useStartup";
import { Lightbulb, Send, Loader2, AlertCircle, ArrowRight, DollarSign, Users, Target, History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createStartup, getStartupMemory, StartupMemory } from "@/lib/startup-service";
import { motion, AnimatePresence } from "framer-motion";

interface ValidationResult {
    scoring: number;
    summary: string;
    risks: string[];
    suggestions: string[];
    implementation_verdict?: string;
    capital_required?: string;
    team_required?: string[];
    competitors?: string[];
    existing_implementation?: string;
}

export default function IdeaValidationPage() {
    const { user } = useAuth();
    const { startup } = useStartup();
    const [idea, setIdea] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<StartupMemory[]>([]);
    const [view, setView] = useState<"input" | "result">("input");

    // Fetch history on load
    useEffect(() => {
        const fetchHistory = async () => {
            if (startup?.startupId) {
                const mems = await getStartupMemory(startup.startupId);
                const validationMems = mems.filter(m => m.type === "agent-output");
                setHistory(validationMems);
            }
        };
        fetchHistory();
    }, [startup?.startupId, result]); // Re-fetch when result changes

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea || !user) return;

        setLoading(true);
        setError(null);
        try {
            // 1. Get or create startup doc
            let startupId = startup?.startupId;
            if (!startupId) {
                startupId = await createStartup(user.uid, "My Startup", "General", idea);
            }

            // 2. Call AI validation
            const res = await fetch("/api/validate-idea", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea, startupId, userId: user.uid }),
            });

            const data = await res.json();
            if (data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
            setResult(data);
            setView("result");
        } catch (error: any) {
            console.error("Validation failed:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNewValidation = () => {
        setResult(null);
        setIdea("");
        setView("input");
    };

    const loadFromHistory = (memory: StartupMemory) => {
        try {
            const data = JSON.parse(memory.content);
            setResult(data);
            setView("result");
        } catch (e) {
            console.error("Failed to parse memory", e);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                        <Lightbulb className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Idea Validator</h1>
                        <p className="text-zinc-500">AI-powered market feasibility analysis</p>
                    </div>
                </div>
                {view === "result" && (
                    <button
                        onClick={handleNewValidation}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Validation
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {view === "input" ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="p-1 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-xl overflow-hidden">
                                        <div className="bg-white dark:bg-zinc-950 rounded-[1.9rem] p-1">
                                            <textarea
                                                value={idea}
                                                onChange={(e) => setIdea(e.target.value)}
                                                placeholder="Describe your startup idea in detail used plain language..."
                                                className="w-full h-64 bg-transparent p-6 text-lg border-none focus:ring-0 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <p className="text-sm font-medium">{error}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading || !idea}
                                            className={cn(
                                                "flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20",
                                                loading || !idea ? "bg-zinc-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-white/10"
                                            )}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Crunching data...
                                                </>
                                            ) : (
                                                <>
                                                    Validate Idea
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            result && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    {/* Top Stats Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                            <div className="text-sm text-zinc-500 font-medium mb-1">Score</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className={cn("text-4xl font-black",
                                                    result.scoring > 75 ? "text-green-500" : result.scoring > 50 ? "text-yellow-500" : "text-red-500"
                                                )}>
                                                    {result.scoring}
                                                </span>
                                                <span className="text-zinc-400">/100</span>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm md:col-span-2">
                                            <div className="text-sm text-zinc-500 font-medium mb-1">Verdict</div>
                                            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                                {result.implementation_verdict || "Analysis Complete"}
                                            </div>
                                            <div className="text-sm text-zinc-400 mt-1 truncate">{result.existing_implementation}</div>
                                        </div>
                                    </div>

                                    {/* Summary Card */}
                                    <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                        <h3 className="text-indigo-600 dark:text-indigo-400 font-semibold mb-2 flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            Executive Summary
                                        </h3>
                                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{result.summary}</p>
                                    </div>

                                    {/* Detailed Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Capital & Team */}
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                                                        <DollarSign className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">Capital Required</h4>
                                                        <p className="text-zinc-600 dark:text-zinc-400 mt-1">{result.capital_required}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Team Requirements</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {result.team_required?.map((role: string, i: number) => (
                                                                <span key={i} className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                                                    {role}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Competitors */}
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <h4 className="font-semibold mb-4">Competitors</h4>
                                            <ul className="space-y-2">
                                                {result.competitors?.map((comp: string, i: number) => (
                                                    <li key={i} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        {comp}
                                                    </li>
                                                ))}
                                                {!result.competitors?.length && <li className="text-zinc-500 italic">No direct competitors identified.</li>}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Risks & Suggestions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-500">
                                                <AlertCircle className="w-4 h-4" />
                                                Key Risks
                                            </h4>
                                            <ul className="space-y-3">
                                                {result.risks?.map((risk: string, i: number) => (
                                                    <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-4 border-l-2 border-red-500/20">
                                                        {risk}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-blue-500">
                                                <Send className="w-4 h-4" />
                                                Next Steps
                                            </h4>
                                            <ul className="space-y-3">
                                                {result.suggestions?.map((item: string, i: number) => (
                                                    <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-4 border-l-2 border-blue-500/20">
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar History */}
                <div className="lg:col-span-1 border-l border-zinc-200 dark:border-zinc-800 pl-8 hidden lg:block">
                    <div className="flex items-center gap-2 mb-6 text-zinc-500">
                        <History className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">History</span>
                    </div>
                    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                        {history.map((mem) => {
                            let data;
                            try { data = JSON.parse(mem.content); } catch (e) { return null; }

                            return (
                                <button
                                    key={mem.id}
                                    onClick={() => loadFromHistory(mem)}
                                    className="w-full text-left p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn("text-xs font-bold px-2 py-1 rounded-md",
                                            data.scoring > 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                        )}>
                                            Score: {data.scoring}
                                        </span>
                                        <span className="text-[10px] text-zinc-400">
                                            {mem.timestamp?.toDate ? new Date(mem.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {data.implementation_verdict || "Analysis"}
                                    </div>
                                </button>
                            );
                        })}
                        {!history.length && (
                            <div className="text-sm text-zinc-400 italic">No previous validations found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
