"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Sparkles,
    Target, Lightbulb, RefreshCw, Play, ChevronRight, Clock, Loader2, Zap,
    Brain, Shield, BarChart3, GitBranch, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyGoal {
    id: string; title: string; status: "achieved" | "in_progress" | "missed"; progress: number;
}
interface TaskSummary { total: number; completed: number; pending: number; overdue: number; }
interface MarketInsight {
    type: "opportunity" | "threat"; title: string; description: string; impact: "high" | "medium" | "low";
}
interface PivotSimulation {
    id: string; scenario: string; description: string;
    impact: { revenue: number; timeline: number; risk: number; };
    recommendation: string;
}
interface ReviewData {
    weekNumber: number; startDate: Date; endDate: Date; goals: WeeklyGoal[];
    tasks: TaskSummary; insights: MarketInsight[]; pivotSimulations: PivotSimulation[];
    aiSummary: string; nextWeekFocus: string[];
}

export default function WeeklyReviewPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [startupId, setStartupId] = useState<string | null>(null);
    const [reviewData, setReviewData] = useState<ReviewData | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "goals" | "insights" | "pivot">("overview");
    const [selectedPivot, setSelectedPivot] = useState<PivotSimulation | null>(null);
    const [pivotInput, setPivotInput] = useState("");

    const getWeekNumber = () => Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const activeStartupId = userDoc.data()?.activeStartupId;
                if (!activeStartupId) { setLoading(false); return; }
                setStartupId(activeStartupId);

                const tasksSnap = await getDocs(query(collection(db, "tasks"), where("startupId", "==", activeStartupId)));
                const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const taskSummary: TaskSummary = {
                    total: tasks.length,
                    completed: tasks.filter((t: any) => t.status === "done").length,
                    pending: tasks.filter((t: any) => t.status === "pending").length,
                    overdue: tasks.filter((t: any) => t.status !== "done" && (t.dueDate?.toDate?.() || new Date()) < new Date()).length
                };

                const defaultReview: ReviewData = {
                    weekNumber: getWeekNumber(),
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    endDate: new Date(),
                    goals: [
                        { id: "g1", title: "Complete customer discovery interviews", status: "in_progress", progress: 60 },
                        { id: "g2", title: "Define MVP feature set", status: "achieved", progress: 100 },
                        { id: "g3", title: "Research competitor pricing", status: "in_progress", progress: 40 }
                    ],
                    tasks: taskSummary,
                    insights: [
                        { type: "opportunity", title: "Rising AI adoption in SMB sector", description: "45% increase in AI adoption intent among Indian SMBs", impact: "high" },
                        { type: "threat", title: "New data handling regulations", description: "DPDP Act compliance deadlines approaching", impact: "medium" }
                    ],
                    pivotSimulations: [],
                    aiSummary: "This week showed solid progress on product definition while customer discovery is ongoing.",
                    nextWeekFocus: ["Complete remaining 5 customer interviews", "Draft initial pitch deck", "Set up analytics tracking"]
                };
                setReviewData(defaultReview);
            } catch (error) { console.error("Error:", error); }
            finally { setLoading(false); }
        };
        loadData();
    }, [user]);

    const runPivotSimulation = async () => {
        if (!startupId || !pivotInput) return;
        setGenerating(true);
        // Simulate API call
        setTimeout(() => {
            const newPivot: PivotSimulation = {
                id: `pivot_${Date.now()}`,
                scenario: pivotInput,
                description: `Analysis of pivoting to: ${pivotInput}`,
                impact: { revenue: Math.floor(Math.random() * 50) + 10, timeline: Math.floor(Math.random() * 6) + 3, risk: Math.floor(Math.random() * 40) + 20 },
                recommendation: "Consider testing this pivot with a small segment before full commitment."
            };
            setReviewData(prev => prev ? { ...prev, pivotSimulations: [...prev.pivotSimulations, newPivot] } : null);
            setSelectedPivot(newPivot);
            setPivotInput("");
            setGenerating(false);
        }, 2000);
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    const progressPct = reviewData?.tasks.total ? Math.round((reviewData.tasks.completed / reviewData.tasks.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3"><Calendar className="w-8 h-8 text-indigo-500" />Weekly Review</h1>
                        <p className="text-zinc-500 mt-1">Week {reviewData?.weekNumber} • Goals vs Tasks</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-medium text-sm">
                        <RefreshCw className="w-4 h-4" />Refresh
                    </button>
                </div>

                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
                    {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "goals", label: "Goals", icon: Target },
                    { id: "insights", label: "Insights", icon: Lightbulb }, { id: "pivot", label: "Pivot Sim", icon: GitBranch }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500")}>
                            <tab.icon className="w-4 h-4" />{tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && reviewData && (
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white"><Brain className="w-6 h-6" /></div>
                                <div><h3 className="font-black text-lg mb-2">AI Summary</h3><p className="text-zinc-600 dark:text-zinc-400">{reviewData.aiSummary}</p></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[{ icon: CheckCircle2, label: "Completed", value: reviewData.tasks.completed, color: "green" },
                            { icon: Clock, label: "Pending", value: reviewData.tasks.pending, color: "blue" },
                            { icon: AlertTriangle, label: "Overdue", value: reviewData.tasks.overdue, color: "amber" },
                            { icon: TrendingUp, label: "Progress", value: `${progressPct}%`, color: "indigo" }
                            ].map((stat, i) => (
                                <div key={i} className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3 mb-2"><stat.icon className={`w-5 h-5 text-${stat.color}-500`} /><span className="text-sm font-bold text-zinc-500">{stat.label}</span></div>
                                    <div className={`text-3xl font-black text-${stat.color}-500`}>{stat.value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />Next Week Focus</h3>
                            <div className="space-y-3">
                                {reviewData.nextWeekFocus.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <span className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
                                        <span className="font-medium">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "goals" && reviewData?.goals.map(goal => (
                    <div key={goal.id} className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                                    goal.status === "achieved" ? "bg-green-100 text-green-600" : goal.status === "in_progress" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600")}>
                                    {goal.status === "achieved" ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div><h4 className="font-bold">{goal.title}</h4><span className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                                    goal.status === "achieved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{goal.status}</span></div>
                            </div>
                            <span className="text-2xl font-black text-indigo-500">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", goal.status === "achieved" ? "bg-green-500" : "bg-blue-500")} style={{ width: `${goal.progress}%` }} />
                        </div>
                    </div>
                ))}

                {activeTab === "insights" && reviewData?.insights.map((insight, i) => (
                    <div key={i} className={cn("p-6 rounded-2xl border", insight.type === "opportunity" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                        <div className="flex items-start gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", insight.type === "opportunity" ? "bg-green-500" : "bg-red-500")}>
                                {insight.type === "opportunity" ? <TrendingUp className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold">{insight.title}</h4>
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", insight.impact === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>{insight.impact}</span>
                                </div>
                                <p className="text-sm text-zinc-600">{insight.description}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {activeTab === "pivot" && (
                    <div className="space-y-6">
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5 text-purple-500" />Simulate Pivot</h3>
                            <div className="flex gap-4">
                                <input value={pivotInput} onChange={e => setPivotInput(e.target.value)} placeholder="e.g., Switch from B2C to B2B..."
                                    className="flex-1 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 outline-none" />
                                <button onClick={runPivotSimulation} disabled={generating || !pivotInput}
                                    className="px-6 py-4 bg-purple-500 text-white rounded-xl font-bold disabled:opacity-50">
                                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        {reviewData?.pivotSimulations.map(p => (
                            <div key={p.id} onClick={() => setSelectedPivot(p)} className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:shadow-lg">
                                <h4 className="font-bold mb-2">{p.scenario}</h4>
                                <div className="flex gap-4">
                                    <span className="px-3 py-1 bg-green-100 rounded-lg text-sm text-green-700">+{p.impact.revenue}% Revenue</span>
                                    <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm text-blue-700">{p.impact.timeline} mo</span>
                                    <span className="px-3 py-1 bg-amber-100 rounded-lg text-sm text-amber-700">{p.impact.risk}% Risk</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedPivot && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedPivot(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 top-[15%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-50">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                                <h2 className="text-xl font-black">Pivot Analysis</h2>
                                <button onClick={() => setSelectedPivot(null)}><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-zinc-600">{selectedPivot.description}</p>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-green-50 rounded-xl"><div className="text-2xl font-black text-green-600">+{selectedPivot.impact.revenue}%</div><div className="text-xs text-green-600">Revenue</div></div>
                                    <div className="p-4 bg-blue-50 rounded-xl"><div className="text-2xl font-black text-blue-600">{selectedPivot.impact.timeline}</div><div className="text-xs text-blue-600">Months</div></div>
                                    <div className="p-4 bg-amber-50 rounded-xl"><div className="text-2xl font-black text-amber-600">{selectedPivot.impact.risk}%</div><div className="text-xs text-amber-600">Risk</div></div>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-xl"><h4 className="font-bold text-indigo-700 mb-2">Recommendation</h4><p className="text-sm text-zinc-600">{selectedPivot.recommendation}</p></div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
