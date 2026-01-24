"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStartup } from "@/hooks/useStartup";
import {
    Lightbulb, Send, Loader2, AlertCircle, ArrowRight, DollarSign,
    Users, Target, History, Plus, FileText, CheckCircle2, TrendingUp,
    Scale, BookOpen, Download, Trash2, ChevronDown, ChevronUp, Zap
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

const ShowMoreCard = ({ title, items, icon: Icon, colorClass, bgClass }: any) => {
    const [expanded, setExpanded] = useState(false);
    const displayItems = items || [];
    const hasMore = displayItems.length > 2;

    return (
        <div className={cn(
            "rounded-3xl border transition-all h-full flex flex-col relative bg-white dark:bg-zinc-950 overflow-hidden",
            "border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md",
            bgClass
        )}>
            <div className="p-8 pb-4 flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className={cn("p-2.5 rounded-xl shrink-0", colorClass.replace("text-", "bg-").replace("600", "500/10").replace("500", "500/10"))}>
                        {Icon && <Icon className={cn("w-4 h-4", colorClass)} />}
                    </div>
                    <h4 className="font-bold text-[11px] tracking-[0.15em] text-zinc-400 uppercase line-clamp-1">
                        {title}
                    </h4>
                </div>

                <div className={cn(
                    "flex-1 min-w-0 transition-all duration-500 ease-in-out",
                    expanded ? "opacity-100" : "max-h-[140px] opacity-100 overflow-hidden relative"
                )}>
                    <div className="space-y-4">
                        {displayItems.length > 0 ? displayItems.map((item: string, i: number) => (
                            <div key={i} className="flex gap-3 min-w-0">
                                <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", colorClass.replace("text-", "bg-"))} />
                                <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400 break-words line-clamp-3">
                                    {item}
                                </p>
                            </div>
                        )) : <p className="text-zinc-500 italic text-[13px]">No data available.</p>}
                    </div>
                    {!expanded && hasMore && (
                        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                    )}
                </div>
            </div>

            {hasMore && (
                <div className="px-8 pb-8 pt-2 shrink-0">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-100 dark:border-zinc-800 shadow-inner"
                    >
                        {expanded ? "Show Less" : "Read More"}
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                startupId = await createStartup(user.uid, "My Startup", "Tech", idea);
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
        if (confirm("Permanently delete this validation node?")) {
            await deleteStartupMemory(memoryId);
            fetchHistory();
            if (result && history.find(h => h.id === memoryId)?.content.includes(result.summary)) {
                setResult(null);
                setView("input");
            }
        }
    };

    const generatePDF = () => {
        if (!result) return;
        const doc = new jsPDF();

        doc.setFillColor(24, 24, 27); // Zinc 900
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("VENTURE VIABILITY REPORT", 20, 28);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`DATE: ${new Date().toLocaleDateString().toUpperCase()}`, 150, 28);
        doc.text("FOUNDERFLOW INTEL ENGINE (INDIA)", 20, 36);

        let yPos = 65;

        // Score & Verdict
        doc.setTextColor(24, 24, 27);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("CORE METRICS", 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.text("VIABILITY SCORE:", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${result.scoring}/100`, 60, yPos);

        doc.setFont("helvetica", "bold");
        doc.text("STRATEGIC VERDICT:", 100, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${result.implementation_verdict?.toUpperCase()}`, 145, yPos);
        yPos += 15;

        // Executive Summary
        doc.setFont("helvetica", "bold");
        doc.text("EXECUTIVE SUMMARY", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitSummary = doc.splitTextToSize(result.summary, 170);
        doc.text(splitSummary, 20, yPos);
        yPos += (splitSummary.length * 6) + 15;

        // Financials Table
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("FINANCIAL ARCHITECTURE (INR)", 20, yPos);
        yPos += 5;

        const investmentBody = result.capital_staging ? [
            ["INITIAL FUNDS (BOOTSTRAP)", result.capital_staging.initial_funds],
            ["GOVERNMENT & LEGAL FILINGS", result.capital_staging.registration_legal],
            ["INFRASTRUCTURE & COMPUTE", result.capital_staging.infrastructure_hardware],
            ["GO-TO-MARKET / ACQUISITION", result.capital_staging.marketing_launch]
        ] : [["DATA", "ANALYSIS INCOMPLETE"]];

        autoTable(doc, {
            startY: yPos,
            head: [["CATEGORY", "ESTIMATED CAPITAL (₹)"]],
            body: investmentBody,
            theme: 'striped',
            headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [24, 24, 27], fontSize: 9 },
            margin: { left: 20 },
            styles: { font: "helvetica" }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 20;

        // Strategic Roadmap (Improvements)
        if (yPos > 240) { doc.addPage(); yPos = 25; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("STRATEGIC REFINEMENT PLAN", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        result.score_improvement_plan?.forEach((step, i) => {
            const stepLines = doc.splitTextToSize(`${i + 1}. ${step}`, 170);
            doc.text(stepLines, 20, yPos);
            yPos += (stepLines.length * 5) + 3;
        });

        yPos += 10;

        // Market & Team
        if (yPos > 240) { doc.addPage(); yPos = 25; }
        doc.setFont("helvetica", "bold");
        doc.text("MARKET & HUMAN CAPITAL", 20, yPos);

        autoTable(doc, {
            startY: yPos + 5,
            head: [["METRIC", "INTELLIGENCE"]],
            body: [
                ["MARKET SIZE (INDIA)", result.market_size_india || "N/A"],
                ["CORE TEAM ROLES", result.team_required?.join(", ").toUpperCase() || "N/A"],
                ["KEY COMPETITORS", result.competitors?.join(", ").toUpperCase() || "N/A"]
            ],
            theme: 'grid',
            headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
            bodyStyles: { textColor: [24, 24, 27], fontSize: 9 },
            margin: { left: 20 }
        });

        doc.save(`founderflow-${startup?.name || "report"}.pdf`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 p-6 md:p-12 animate-in fade-in duration-1000">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-100 dark:border-zinc-800 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
                        <Target className="w-3.5 h-3.5" />
                        Venture Intelligence
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                        Idea <span className="text-zinc-400 dark:text-zinc-600">Validator</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-lg max-w-xl leading-relaxed">
                        Classify market viability using foundational data sets and Indian economic indicators.
                    </p>
                </div>
                {view === "result" && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleNewValidation}
                            className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={generatePDF}
                            className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest bg-black dark:bg-zinc-50 text-white dark:text-black rounded-2xl transition-all shadow-xl shadow-black/10 hover:scale-105 active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            PDF Extract
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Hub */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        {view === "input" ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl pt-8"
                            >
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[3rem] opacity-0 group-hover:opacity-10 transition duration-500 blur-2xl"></div>
                                        <div className="relative bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 p-3 overflow-hidden">
                                            <textarea
                                                value={idea}
                                                onChange={(e) => setIdea(e.target.value)}
                                                placeholder="Articulate your vision... (e.g. 'Decentralized energy grid for hyper-local communities in Maharashtra')"
                                                className="w-full h-56 bg-transparent p-10 text-xl md:text-2xl border-none focus:ring-0 resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-800 focus:outline-none text-zinc-900 dark:text-zinc-100 font-medium leading-normal"
                                                disabled={loading}
                                            />
                                            <div className="px-10 py-6 flex justify-between items-center border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                                                <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    Ready for Extraction
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={loading || !idea}
                                                    className={cn(
                                                        "flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-white transition-all transform active:scale-95 shadow-2xl",
                                                        loading || !idea
                                                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                            : "bg-black dark:bg-white dark:text-black hover:scale-105"
                                                    )}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Processing
                                                        </>
                                                    ) : (
                                                        <>
                                                            Analyze Idea
                                                            <ArrowRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10 text-red-500 flex items-center gap-4 text-xs font-bold uppercase tracking-widest"
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
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-12 pb-20 pt-8"
                                >
                                    {/* Score Card - Classy Refinement */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                        <div className="lg:col-span-4 p-10 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                                <Target className="w-48 h-48 text-zinc-950 dark:text-zinc-50" />
                                            </div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-10 shrink-0">Viability Matrix</div>
                                            <div className="relative shrink-0">
                                                <svg className="w-44 h-44 transform -rotate-90">
                                                    <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-50 dark:text-zinc-900" />
                                                    <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={`${result.scoring * 5.02} 502`} strokeLinecap="round" className="text-indigo-500 transition-all duration-1000 ease-out" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                                        {result.scoring}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PQ INDEX</span>
                                                </div>
                                            </div>
                                            <div className="mt-12 px-8 py-2.5 bg-indigo-500/10 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] rounded-full uppercase tracking-[0.2em] shrink-0">
                                                {result.implementation_verdict}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-8 p-12 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center min-w-0 overflow-hidden">
                                            <div className="flex items-center gap-3 mb-8 shrink-0">
                                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                                                    <Lightbulb className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-400">Executive Intelligence</h3>
                                            </div>
                                            <p className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.5] line-clamp-4 break-words">
                                                {result.summary}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Strategic Intelligence Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                        {/* Financial Architecture */}
                                        <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-w-0 overflow-hidden h-full">
                                            <div className="flex items-center gap-3 mb-10 shrink-0">
                                                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-400">Capital Architecture (INR)</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800/50 flex-1">
                                                <div className="p-8 bg-white dark:bg-zinc-950 flex flex-col justify-center min-w-0">
                                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 shrink-0">Liquidity</div>
                                                    <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight line-clamp-1 break-all">
                                                        {result.capital_staging?.initial_funds || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-white dark:bg-zinc-950 flex flex-col justify-center min-w-0">
                                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 shrink-0">Acquisition</div>
                                                    <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight line-clamp-1 break-all">
                                                        {result.capital_staging?.marketing_launch || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-white dark:bg-zinc-950 flex flex-col justify-center min-w-0">
                                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 shrink-0">Compliance</div>
                                                    <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight line-clamp-1 break-all">
                                                        {result.capital_staging?.registration_legal || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-white dark:bg-zinc-950 flex flex-col justify-center min-w-0">
                                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 shrink-0">Compute</div>
                                                    <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight line-clamp-1 break-all">
                                                        {result.capital_staging?.infrastructure_hardware || "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Market & Human Resources */}
                                        <div className="grid grid-rows-2 gap-8 h-full">
                                            <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center relative overflow-hidden min-w-0">
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                                    <TrendingUp className="w-32 h-32" />
                                                </div>
                                                <div className="flex items-center gap-3 mb-6 shrink-0">
                                                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                                                        <TrendingUp className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-400">Market Potential</h4>
                                                </div>
                                                <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight pr-12 line-clamp-2 break-words">
                                                    {result.market_size_india || "Calculating..."}
                                                </div>
                                            </div>

                                            <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center min-w-0 overflow-hidden">
                                                <div className="flex items-center gap-3 mb-6 shrink-0">
                                                    <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-400">Talent Architecture</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2.5 overflow-hidden">
                                                    {result.team_required?.map((role, i) => (
                                                        <span key={i} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-100 dark:border-zinc-800/50 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Classy Refinement Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <ShowMoreCard
                                            title="Strengths"
                                            items={result.pros}
                                            icon={CheckCircle2}
                                            colorClass="text-emerald-500"
                                            bgClass="bg-white"
                                        />
                                        <ShowMoreCard
                                            title="Structural Risks"
                                            items={result.cons}
                                            icon={AlertCircle}
                                            colorClass="text-orange-500"
                                            bgClass="bg-white"
                                        />
                                        <ShowMoreCard
                                            title="Strategic Roadmap"
                                            items={result.suggestions}
                                            icon={Send}
                                            colorClass="text-indigo-500"
                                            bgClass="bg-white"
                                        />
                                        <ShowMoreCard
                                            title="Optimization Plan"
                                            items={result.score_improvement_plan}
                                            icon={Zap}
                                            colorClass="text-amber-500"
                                            bgClass="bg-white"
                                        />
                                    </div>

                                    {/* Competitors - Minimalist Row */}
                                    <div className="p-10 rounded-[3rem] bg-zinc-900 border border-white/5 shadow-2xl overflow-hidden relative group min-w-0">
                                        <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                            <Scale className="w-40 h-40 text-white" />
                                        </div>
                                        <div className="relative z-10 space-y-8 min-w-0">
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="p-3 bg-white/10 rounded-2xl">
                                                    <Scale className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-zinc-500">Competitive Landscape</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-3 min-w-0 overflow-hidden">
                                                {result.competitors?.map((comp, i) => (
                                                    <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[13px] font-bold text-white hover:bg-white/10 transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                        {comp}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </div>

                {/* Vertical History Rail */}
                <div className="lg:col-span-3 border-l border-zinc-100 dark:border-zinc-800 pl-12 hidden lg:block">
                    <div className="sticky top-12 space-y-10">
                        <div className="flex items-center gap-3 text-zinc-400 pt-8">
                            <History className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Temporal Registry</span>
                        </div>
                        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-6 custom-scrollbar">
                            {history.length > 0 ? history.map((mem) => {
                                let data;
                                try { data = JSON.parse(mem.content); } catch (e) { return null; }

                                return (
                                    <div
                                        key={mem.id}
                                        className="w-full text-left p-6 rounded-[2rem] hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:shadow-lg transition-all group relative cursor-pointer min-w-0 overflow-hidden"
                                        onClick={() => loadFromHistory(mem)}
                                    >
                                        <div className="flex items-center justify-between mb-4 shrink-0">
                                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                                data.scoring > 70 ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                            )}>
                                                {data.scoring} PQ INDEX
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteHistory(e, mem.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-xl transition-all text-zinc-400 shadow-sm"
                                                title="Drop Record"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="text-[11px] font-bold text-zinc-500 line-clamp-2 leading-relaxed group-hover:text-zinc-900 dark:group-hover:text-zinc-100 uppercase tracking-tight transition-colors break-words">
                                            {data.summary}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-[10px] text-zinc-300 font-black uppercase tracking-widest text-center py-10 opacity-50">
                                    Zero Records Found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
