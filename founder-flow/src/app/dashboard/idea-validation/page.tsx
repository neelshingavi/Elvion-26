"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lightbulb, Send, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createStartup } from "@/lib/startup-service";

export default function IdeaValidationPage() {
    const { user } = useAuth();
    const [idea, setIdea] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea || !user) return;

        setLoading(true);
        try {
            // 1. Create startup doc
            const startupId = await createStartup(user.uid, idea);

            // 2. Call AI validation
            const res = await fetch("/api/validate-idea", {
                method: "POST",
                body: JSON.stringify({ idea, startupId, userId: user.uid }),
            });

            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error("Validation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl">
                    <Lightbulb className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Idea Validation</h1>
                    <p className="text-zinc-500">Run your premise through our AI scoring model.</p>
                </div>
            </div>

            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-1 rounded-[2rem] bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 shadow-xl overflow-hidden">
                        <textarea
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                            placeholder="Describe your startup idea in detail..."
                            className="w-full h-48 bg-white dark:bg-black p-8 text-xl rounded-[1.8rem] border-none focus:ring-0 resize-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !idea}
                            className={cn(
                                "flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg",
                                loading || !idea ? "bg-zinc-400 cursor-not-allowed" : "bg-black dark:bg-zinc-50 dark:text-black"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
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
            ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                AI Summary
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
                                {result.summary}
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-black text-white dark:bg-zinc-50 dark:text-black flex flex-col items-center justify-center text-center">
                            <span className="text-sm uppercase tracking-widest opacity-60 mb-2">Startup Score</span>
                            <span className="text-6xl font-black">{result.scoring}</span>
                            <div className="mt-4 w-full h-1 bg-zinc-800 dark:bg-zinc-200 rounded-full overflow-hidden">
                                <div className="h-full bg-white dark:bg-black" style={{ width: `${result.scoring}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10">
                            <h4 className="font-bold text-red-500 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Key Risks
                            </h4>
                            <ul className="space-y-3">
                                {result.risks?.map((risk: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-zinc-600 dark:text-zinc-400">
                                        <span className="text-zinc-300 dark:text-zinc-700 font-mono">{i + 1}.</span>
                                        {risk}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                            <h4 className="font-bold text-blue-500 mb-4 flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                Next Suggestions
                            </h4>
                            <ul className="space-y-3">
                                {result.suggestions?.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-zinc-600 dark:text-zinc-400">
                                        <span className="text-zinc-300 dark:text-zinc-700 font-mono">{i + 1}.</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => setResult(null)}
                            className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            Start over with a different idea
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
