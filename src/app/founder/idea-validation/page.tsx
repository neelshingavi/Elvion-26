"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStartup } from "@/hooks/useStartup";
import {
    Lightbulb, Send, Loader2, AlertCircle, ArrowRight, DollarSign,
    Users, Target, History, Plus, FileText, CheckCircle2, TrendingUp,
    Scale, BookOpen, Share2, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createStartup, getStartupMemory, StartupMemory } from "@/lib/startup-service";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ValidationResult {
    scoring: number;
    summary: string;
    risks: string[];
    suggestions: string[];
    implementation_verdict?: string;
    capital_required_inr?: string;
    team_required?: string[];
    competitors?: string[];
    existing_implementation?: string;
    pros?: string[];
    cons?: string[];
    research_papers?: { title: string; url: string }[];
    market_size_india?: string;
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

    // Fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            if (startup?.startupId) {
                const mems = await getStartupMemory(startup.startupId);
                const validationMems = mems.filter(m => m.type === "agent-output");
                setHistory(validationMems);
            }
        };
        fetchHistory();
    }, [startup?.startupId, result]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea || !user) return;

        setLoading(true);
        setError(null);
        try {
            let startupId = startup?.startupId;
            if (!startupId) {
                startupId = await createStartup(user.uid, "My Startup", "General", idea);
            }

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
        // Keep the current idea in the box for easy editing
        setView("input");
    };

    const loadFromHistory = (memory: StartupMemory) => {
        try {
            const data = JSON.parse(memory.content);
            setResult(data);
            // Also set the idea text if possible, but memory doesn't store the prompt directly in this format usually.
            // For now, we just show the result.
            setView("result");
        } catch (e) {
            console.error("Failed to parse memory", e);
        }
    };

    const generatePDF = () => {
        if (!result) return;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(79, 70, 229); // Indigo 600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("FounderFlow Idea Report", 20, 25);

        // Date
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 150, 25);

        let yPos = 50;

        // Score & Verdict
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text(`Score: ${result.scoring}/100`, 20, yPos);
        doc.text(`Verdict: ${result.implementation_verdict}`, 120, yPos);
        yPos += 15;

        // Summary
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(result.summary, 170);
        doc.text(splitSummary, 20, yPos);
        yPos += (splitSummary.length * 5) + 10;

        // Market Data
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Market & Financials (India)", 20, yPos);
        yPos += 7;

        const marketData = [
            ["Metric", "Details"],
            ["Capital Required", result.capital_required_inr || "N/A"],
            ["Market Size (TAM/SAM)", result.market_size_india || "N/A"],
            ["Team Requirements", result.team_required?.join(", ") || "N/A"]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [["Metric", "Details"]],
            body: [
                ["Capital Required", result.capital_required_inr || "N/A"],
                ["Market Size", result.market_size_india || "N/A"],
                ["Team", result.team_required?.join(", ") || "N/A"]
            ],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // Pros & Cons
        doc.text("Pros & Cons", 20, yPos);
        yPos += 7;

        const pros = result.pros?.join("\n• ") || "";
        const cons = result.cons?.join("\n• ") || "";

        autoTable(doc, {
            startY: yPos,
            head: [["Strengths (Pros)", "Weaknesses (Cons)"]],
            body: [[`• ${pros}`, `• ${cons}`]],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // Suggestions
        doc.text("Strategic Suggestions", 20, yPos);
        yPos += 7;
        const suggestions = result.suggestions?.map(s => [s]) || [];
        autoTable(doc, {
            startY: yPos,
            body: suggestions,
            theme: 'striped',
        });

        doc.save("founderflow-report.pdf");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Idea Validation
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Analyze market viability with localized Indian context
                    </p>
                </div>
                {view === "result" && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleNewValidation}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Edit / New
                        </button>
                        <button
                            onClick={generatePDF}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <Download className="w-4 h-4" />
                            Export PDF
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        {view === "input" ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="max-w-3xl mx-auto mt-8"
                            >
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 transition blur-xl"></div>
                                        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-2">
                                            <textarea
                                                value={idea}
                                                onChange={(e) => setIdea(e.target.value)}
                                                placeholder="Describe your startup idea... (e.g. 'A subscription service for authentic home-cooked meals in Bangalore')"
                                                className="w-full h-48 bg-transparent p-4 text-base md:text-lg border-none focus:ring-0 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-zinc-900 dark:text-zinc-100"
                                                disabled={loading}
                                            />
                                            <div className="px-4 py-3 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
                                                <span className="text-xs text-zinc-400 font-medium">
                                                    AI-Powered Analysis • Indian Market Focus
                                                </span>
                                                <button
                                                    type="submit"
                                                    disabled={loading || !idea}
                                                    className={cn(
                                                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all transform active:scale-95",
                                                        loading || !idea
                                                            ? "bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed"
                                                            : "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                                                    )}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Thinking...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Validate Idea
                                                            <ArrowRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm"
                                        >
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </form>
                            </motion.div>
                        ) : (
                            result && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Score Card */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Target className="w-24 h-24 text-zinc-500" />
                                            </div>
                                            <div className="text-sm font-medium text-zinc-500 mb-2">Viability Score</div>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-5xl font-black tracking-tighter",
                                                    result.scoring > 75 ? "text-green-600" : result.scoring > 50 ? "text-yellow-500" : "text-red-500"
                                                )}>
                                                    {result.scoring}
                                                </span>
                                                <span className="text-zinc-400 font-medium">/100</span>
                                            </div>
                                            <div className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {result.implementation_verdict}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-zinc-900 dark:to-zinc-900 border border-indigo-100 dark:border-zinc-800 shadow-sm">
                                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4 text-indigo-500" />
                                                Executive Summary
                                            </h3>
                                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm md:text-base">
                                                {result.summary}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pros & Cons Columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-green-600 font-semibold text-sm uppercase tracking-wider">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Strengths (Pros)
                                            </div>
                                            <div className="space-y-3">
                                                {result.pros?.map((pro, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/20 text-sm text-green-900 dark:text-green-100">
                                                        {pro}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-red-500 font-semibold text-sm uppercase tracking-wider">
                                                <AlertCircle className="w-4 h-4" />
                                                Weaknesses (Cons)
                                            </div>
                                            <div className="space-y-3">
                                                {result.cons?.map((con, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 text-sm text-red-900 dark:text-red-100">
                                                        {con}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Data Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <div className="p-2 w-fit rounded-lg bg-emerald-100 text-emerald-600 mb-3">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs text-zinc-500 font-medium uppercase">Investment (INR)</div>
                                            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                                                {result.capital_required_inr || "N/A"}
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <div className="p-2 w-fit rounded-lg bg-blue-100 text-blue-600 mb-3">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs text-zinc-500 font-medium uppercase">Market Size</div>
                                            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                                                {result.market_size_india || "Analyzing..."}
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 col-span-1 sm:col-span-2">
                                            <div className="p-2 w-fit rounded-lg bg-purple-100 text-purple-600 mb-3">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div className="text-xs text-zinc-500 font-medium uppercase">Team Needed</div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {result.team_required?.map((role, i) => (
                                                    <span key={i} className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Research & Competitors */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                                Relevant Research / Papers
                                            </h4>
                                            <ul className="space-y-3">
                                                {result.research_papers?.map((paper, i) => (
                                                    <li key={i} className="flex gap-3 items-start p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer group">
                                                        <FileText className="w-4 h-4 text-zinc-400 mt-1 group-hover:text-indigo-500" />
                                                        <div>
                                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 group-hover:underline">
                                                                {paper.title}
                                                            </div>
                                                            <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">
                                                                {paper.url}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                <Scale className="w-4 h-4 text-orange-500" />
                                                Competitors
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {result.competitors?.map((comp, i) => (
                                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm">
                                                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                                                        {comp}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                                        <h4 className="font-semibold mb-4 text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            Actionable Next Steps
                                        </h4>
                                        <div className="grid gap-3">
                                            {result.suggestions?.map((item, i) => (
                                                <div key={i} className="flex gap-3 items-start">
                                                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 pt-0.5">
                                                        {item}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </motion.div>
                            )
                        )}
                    </ AnimatePresence>
                </div>

                {/* Right Sidebar - History */}
                <div className="lg:col-span-3 border-l border-zinc-200 dark:border-zinc-800 pl-0 lg:pl-8">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-2 mb-6 text-zinc-500">
                            <History className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Previous Validations</span>
                        </div>
                        <div className="space-y-3 max-h-[calc(100vh-150px)] overflow-y-auto pr-2 custom-scrollbar">
                            {history.map((mem) => {
                                let data;
                                try { data = JSON.parse(mem.content); } catch (e) { return null; }

                                return (
                                    <button
                                        key={mem.id}
                                        onClick={() => loadFromHistory(mem)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group relative"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                data.scoring > 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {data.scoring}/100
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                                {mem.timestamp?.toDate ? new Date(mem.timestamp.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                            </span>
                                        </div>
                                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                            {data.summary}
                                        </div>
                                    </button>
                                );
                            })}
                            {!history.length && (
                                <div className="text-xs text-zinc-400 italic text-center py-8">
                                    No history yet. Start your first validation!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
