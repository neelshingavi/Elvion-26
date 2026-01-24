"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStartup } from "@/hooks/useStartup";
import {
    Lightbulb, Send, Loader2, AlertCircle, ArrowRight, DollarSign,
    Users, Target, History, Plus, FileText, CheckCircle2, TrendingUp,
    Scale, BookOpen, Share2, Download, Trash2, ChevronDown, ChevronUp, Briefcase, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createStartup, getStartupMemory, StartupMemory, deleteStartupMemory } from "@/lib/startup-service";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CapitalStaging {
    initial_funds: string;
    registration_legal: string;
    infrastructure_hardware: string;
    marketing_launch: string;
}

interface ValidationResult {
    scoring: number;
    summary: string;
    risks: string[];
    suggestions: string[];
    implementation_verdict?: string;
    capital_staging?: CapitalStaging;
    team_required?: string[];
    competitors?: string[];
    existing_implementation?: string;
    pros?: string[];
    cons?: string[];
    research_papers?: { title: string; url: string }[];
    market_size_india?: string;
    score_improvement_plan?: string[];
}

const ShowMoreCard = ({ title, items, icon: Icon, colorClass, borderClass, bgClass }: any) => {
    const [expanded, setExpanded] = useState(false);
    // Always show all items, but truncate container height if not expanded
    const displayItems = items || [];
    const hasMore = displayItems.length > 2; // Threshold to trigger "Show More"

    return (
        <div className={cn("rounded-2xl border transition-all h-full flex flex-col relative overflow-hidden", bgClass, borderClass)}>
            <div className="p-6 pb-2">
                <h4 className={cn("font-semibold mb-3 flex items-center gap-2", colorClass)}>
                    {Icon && <Icon className="w-4 h-4" />}
                    {title}
                </h4>
            </div>

            <div className={cn("px-6 space-y-3 transition-all duration-300", expanded ? "pb-4 max-h-[1000px] overflow-visible" : "overflow-hidden max-h-[160px]")}>
                {displayItems.length > 0 ? displayItems.map((item: string, i: number) => (
                    <div key={i} className={cn("text-sm leading-relaxed pl-3 border-l-2", colorClass.replace("text-", "border-").replace("500", "500/20"))}>
                        {item}
                    </div>
                )) : <p className="text-zinc-500 italic text-sm">No specific data available.</p>}
            </div>

            {/* Gradient fade for collapsed state */}
            {!expanded && hasMore && (
                <div className={cn("absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t pointer-events-none",
                    "from-white dark:from-black to-transparent opacity-emulate")}
                />
            )}

            {hasMore && (
                <div className="px-6 pb-4 pt-2 mt-auto z-10 relative">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors w-full justify-center py-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-lg border border-zinc-100 dark:border-zinc-800"
                    >
                        {expanded ? "Show Less" : "Read More"}
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>
            )}
        </div>
    );
};

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
    const fetchHistory = async () => {
        if (startup?.startupId) {
            const mems = await getStartupMemory(startup.startupId);
            const validationMems = mems.filter(m => m.type === "agent-output");
            setHistory(validationMems);
        }
    };

    useEffect(() => {
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

    const handleDeleteHistory = async (e: React.MouseEvent, memoryId: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this validation result?")) {
            await deleteStartupMemory(memoryId);
            fetchHistory(); // Refresh list
            if (result && history.find(h => h.id === memoryId)?.content.includes(result.summary)) {
                setResult(null);
                setView("input");
            }
        }
    };

    const generatePDF = () => {
        if (!result) return;
        const doc = new jsPDF();

        // --- Header ---
        doc.setFillColor(79, 70, 229); // Indigo 600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("FounderFlow Report", 20, 25);
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 150, 25);

        let yPos = 55;

        // --- Score & Verdict ---
        doc.setTextColor(0, 0, 0); // Reset text color to black
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Viability Score:`, 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${result.scoring}/100`, 60, yPos);

        doc.setFont("helvetica", "bold");
        doc.text(`Verdict:`, 100, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${result.implementation_verdict}`, 125, yPos);
        yPos += 15;

        // --- Summary ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(result.summary, 170); // Max width 170
        doc.text(splitSummary, 20, yPos);
        yPos += (splitSummary.length * 5) + 15;

        // --- Financials ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Financial Requirements (India)", 20, yPos);
        yPos += 5;

        const investmentBody = result.capital_staging ? [
            ["Initial Funds (Bootstrap)", result.capital_staging.initial_funds],
            ["Registration & Legal", result.capital_staging.registration_legal],
            ["Hardware / Infrastructure", result.capital_staging.infrastructure_hardware],
            ["Marketing & Launch", result.capital_staging.marketing_launch]
        ] : [["Total estimate", "N/A"]];

        autoTable(doc, {
            startY: yPos,
            head: [["Category", "Estimated Cost (INR)"]],
            body: investmentBody,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            bodyStyles: { textColor: [0, 0, 0] }, // Ensure black text
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
            margin: { left: 20 }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // --- Market & Improvements ---
        doc.text("Market & Strategic Improvements", 20, yPos);

        const improvements = result.score_improvement_plan?.join("\n\n• ") || "N/A";

        autoTable(doc, {
            startY: yPos + 5,
            head: [["Key Details", "Score Improvement Plan"]],
            body: [
                [`Market Size: ${result.market_size_india || "N/A"}\n\nTeam: ${result.team_required?.join(", ") || "N/A"}`, `• ${improvements}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            bodyStyles: { textColor: [0, 0, 0] },
            margin: { left: 20 }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // --- SWOT ---
        // Check for page break
        if (yPos > 240) { doc.addPage(); yPos = 20; }

        doc.text("SWOT Analysis", 20, yPos);
        const maxRows = Math.max(result.pros?.length || 0, result.cons?.length || 0);
        const swotBody = [];
        for (let i = 0; i < maxRows; i++) {
            swotBody.push([
                result.pros?.[i] || "",
                result.cons?.[i] || ""
            ]);
        }

        autoTable(doc, {
            startY: yPos + 5,
            head: [["Strengths", "Weaknesses"]],
            body: swotBody,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            bodyStyles: { textColor: [0, 0, 0] },
            margin: { left: 20 }
        });

        doc.save("founderflow-report.pdf");
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Idea Validator
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Comprehensive market analysis for Indian founders
                    </p>
                </div>
                {view === "result" && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleNewValidation}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Analysis
                        </button>
                        <button
                            onClick={generatePDF}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <Download className="w-4 h-4" />
                            PDF Report
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
                                                placeholder="Describe your startup idea detail... e.g. 'Instant grocery delivery in Tier 2 cities in India'"
                                                className="w-full h-48 bg-transparent p-4 text-base md:text-lg border-none focus:ring-0 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-zinc-900 dark:text-zinc-100"
                                                disabled={loading}
                                            />
                                            <div className="px-4 py-3 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
                                                <span className="text-xs text-zinc-400 font-medium">
                                                    Models trained on Indian Market Data
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
                                                            Crunching Numbers...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Validate Now
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
                                    className="space-y-8"
                                >
                                    {/* Top Row: Score & Summary */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                        <div className="lg:col-span-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <Target className="w-32 h-32 text-zinc-500" />
                                            </div>
                                            <div className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2">Viability Score</div>
                                            <div className="relative inline-flex items-center justify-center">
                                                <svg className="w-32 h-32 transform -rotate-90">
                                                    <circle cx="64" cy="64" r="60" stroke="#e5e7eb" strokeWidth="8" fill="transparent" className="dark:stroke-zinc-800" />
                                                    <circle cx="64" cy="64" r="60" stroke={result.scoring > 75 ? "#10b981" : result.scoring > 50 ? "#eab308" : "#ef4444"} strokeWidth="8" fill="transparent" strokeDasharray={`${result.scoring * 3.77} 377`} strokeLinecap="round" />
                                                </svg>
                                                <span className={cn("absolute text-4xl font-black",
                                                    result.scoring > 75 ? "text-green-600" : result.scoring > 50 ? "text-yellow-500" : "text-red-500"
                                                )}>
                                                    {result.scoring}
                                                </span>
                                            </div>
                                            <div className="mt-4 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                                                {result.implementation_verdict}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-9 p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-zinc-900 dark:to-black border border-indigo-100 dark:border-zinc-800/50 shadow-sm flex flex-col justify-center">
                                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2 text-lg">
                                                <Lightbulb className="w-5 h-5 text-indigo-500" />
                                                Executive Summary
                                            </h3>
                                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
                                                {result.summary}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Landscape Metrics Grid - Aligned Heights */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                        {/* Financial Breakdown */}
                                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <h4 className="font-semibold text-lg">Financial Estimates (INR)</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 flex-1">
                                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col justify-center">
                                                    <div className="text-xs text-zinc-500 mb-1">Initial Funds</div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                                                        {result.capital_staging?.initial_funds || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col justify-center">
                                                    <div className="text-xs text-zinc-500 mb-1">Launch Marketing</div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                                                        {result.capital_staging?.marketing_launch || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col justify-center">
                                                    <div className="text-xs text-zinc-500 mb-1">Registration/Legal</div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                                                        {result.capital_staging?.registration_legal || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col justify-center">
                                                    <div className="text-xs text-zinc-500 mb-1">Hardware/Infra</div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                                                        {result.capital_staging?.infrastructure_hardware || "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Market & Team - Split Vertical */}
                                        <div className="flex flex-col gap-6 h-full">
                                            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                        <TrendingUp className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="font-semibold text-lg">Market Size (India)</h4>
                                                </div>
                                                <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 pl-1">
                                                    {result.market_size_india || "Analyzing..."}
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="font-semibold text-lg">Team Needs</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {result.team_required?.map((role, i) => (
                                                        <span key={i} className="px-3 py-1 text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Info Cards - Same Heights */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                                        <div className="h-full">
                                            <ShowMoreCard
                                                title="Strengths"
                                                items={result.pros}
                                                icon={CheckCircle2}
                                                colorClass="text-green-600"
                                                bgClass="bg-green-50/20 dark:bg-green-900/10"
                                                borderClass="border-green-100 dark:border-green-900/20"
                                            />
                                        </div>
                                        <div className="h-full">
                                            <ShowMoreCard
                                                title="Risks"
                                                items={result.cons}
                                                icon={AlertCircle}
                                                colorClass="text-red-500"
                                                bgClass="bg-red-50/20 dark:bg-red-900/10"
                                                borderClass="border-red-100 dark:border-red-900/20"
                                            />
                                        </div>
                                        <div className="h-full">
                                            <ShowMoreCard
                                                title="Next Steps"
                                                items={result.suggestions}
                                                icon={Send}
                                                colorClass="text-indigo-600"
                                                bgClass="bg-indigo-50/20 dark:bg-indigo-900/10"
                                                borderClass="border-indigo-100 dark:border-indigo-900/20"
                                            />
                                        </div>
                                        <div className="h-full">
                                            <ShowMoreCard
                                                title="Score Improvements"
                                                items={result.score_improvement_plan}
                                                icon={Zap}
                                                colorClass="text-amber-600"
                                                bgClass="bg-amber-50/20 dark:bg-amber-900/10"
                                                borderClass="border-amber-100 dark:border-amber-900/20"
                                            />
                                        </div>
                                    </div>

                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Sidebar - History */}
                <div className="lg:col-span-3 border-l border-zinc-200 dark:border-zinc-800 pl-0 lg:pl-8">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-2 mb-6 text-zinc-500">
                            <History className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Validation History</span>
                        </div>
                        <div className="space-y-3 max-h-[calc(100vh-150px)] overflow-y-auto pr-2 custom-scrollbar">
                            {history.map((mem) => {
                                let data;
                                try { data = JSON.parse(mem.content); } catch (e) { return null; }

                                return (
                                    <div
                                        key={mem.id}
                                        className="w-full text-left p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group relative cursor-pointer"
                                        onClick={() => loadFromHistory(mem)}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                data.scoring > 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {data.scoring}/100
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteHistory(e, mem.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-all"
                                                title="Delete result"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                            {data.summary}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-1">
                                            {mem.timestamp?.toDate ? new Date(mem.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                                        </div>
                                    </div>
                                );
                            })}
                            {!history.length && (
                                <div className="text-xs text-zinc-400 italic text-center py-8">
                                    No history found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
