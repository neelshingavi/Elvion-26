"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target,
    ChevronRight,
    Plus,
    Clock,
    CheckCircle2,
    Circle,
    Flag,
    Sparkles,
    ArrowRight,
    Calendar,
    AlertTriangle,
    Link as LinkIcon,
    Play,
    Pause,
    MoreHorizontal,
    Edit3,
    Trash2,
    ChevronDown,
    Loader2,
    Rocket,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Types
interface Goal {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    status: "active" | "achieved" | "abandoned";
    progress: number;
    milestones: Milestone[];
    phase: string;
}

interface Milestone {
    id: string;
    title: string;
    targetDate: Date;
    status: "pending" | "in_progress" | "achieved";
    dependsOn: string[];
}

interface Phase {
    id: string;
    title: string;
    description: string;
    startMonth: number;
    endMonth: number;
    color: string;
    goals: Goal[];
}

// Default roadmap phases
const DEFAULT_PHASES: Phase[] = [
    {
        id: "foundation",
        title: "Foundation",
        description: "Core setup and initial validation",
        startMonth: 1,
        endMonth: 3,
        color: "from-blue-500 to-cyan-500",
        goals: []
    },
    {
        id: "validation",
        title: "Validation",
        description: "Product-market fit experiments",
        startMonth: 3,
        endMonth: 6,
        color: "from-purple-500 to-indigo-500",
        goals: []
    },
    {
        id: "growth",
        title: "Growth",
        description: "Scale what works",
        startMonth: 6,
        endMonth: 12,
        color: "from-green-500 to-emerald-500",
        goals: []
    },
    {
        id: "scale",
        title: "Scale",
        description: "Market expansion",
        startMonth: 12,
        endMonth: 24,
        color: "from-orange-500 to-amber-500",
        goals: []
    }
];

export default function RoadmapPage() {
    const { user } = useAuth();

    // State
    const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [startupId, setStartupId] = useState<string | null>(null);
    const [startup, setStartup] = useState<any>(null);
    const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

    // New goal form state
    const [newGoal, setNewGoal] = useState({
        title: "",
        description: "",
        targetDate: "",
        phase: "",
        milestones: [""]
    });

    // Load roadmap data
    useEffect(() => {
        const loadRoadmap = async () => {
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const activeStartupId = userData?.activeStartupId;

                if (!activeStartupId) {
                    setLoading(false);
                    return;
                }

                setStartupId(activeStartupId);

                // Get startup data
                const startupDoc = await getDoc(doc(db, "startups", activeStartupId));
                if (startupDoc.exists()) {
                    setStartup(startupDoc.data());
                }

                // Get roadmap
                const roadmapDoc = await getDoc(doc(db, "roadmaps", activeStartupId));

                if (roadmapDoc.exists()) {
                    const data = roadmapDoc.data();
                    if (data.phases) {
                        setPhases(data.phases);
                    }
                }
            } catch (error) {
                console.error("Error loading roadmap:", error);
            } finally {
                setLoading(false);
            }
        };

        loadRoadmap();
    }, [user]);

    // Generate AI roadmap
    const generateRoadmap = async () => {
        if (!startup || !startupId) return;

        setGenerating(true);

        try {
            const response = await fetch("/api/generate-roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startupId,
                    idea: startup.idea || startup.oneSentencePitch,
                    industry: startup.industry,
                    stage: startup.stage
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Parse AI response into phases
                if (data.roadmap) {
                    // Update phases with generated goals
                    const updatedPhases = DEFAULT_PHASES.map(phase => ({
                        ...phase,
                        goals: data.roadmap[phase.id]?.goals || []
                    }));

                    setPhases(updatedPhases);

                    // Save to Firestore
                    await setDoc(doc(db, "roadmaps", startupId), {
                        phases: updatedPhases,
                        generatedAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }
        } catch (error) {
            console.error("Error generating roadmap:", error);
        } finally {
            setGenerating(false);
        }
    };

    // Add new goal
    const handleAddGoal = async () => {
        if (!newGoal.title || !newGoal.phase || !startupId) return;

        const goalId = `goal_${Date.now()}`;
        const goal: Goal = {
            id: goalId,
            title: newGoal.title,
            description: newGoal.description,
            targetDate: new Date(newGoal.targetDate),
            status: "active",
            progress: 0,
            phase: newGoal.phase,
            milestones: newGoal.milestones.filter(m => m).map((m, i) => ({
                id: `milestone_${goalId}_${i}`,
                title: m,
                targetDate: new Date(newGoal.targetDate),
                status: "pending" as const,
                dependsOn: []
            }))
        };

        const updatedPhases = phases.map(phase =>
            phase.id === newGoal.phase
                ? { ...phase, goals: [...phase.goals, goal] }
                : phase
        );

        setPhases(updatedPhases);

        // Save to Firestore
        await setDoc(doc(db, "roadmaps", startupId), {
            phases: updatedPhases,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Reset form
        setNewGoal({ title: "", description: "", targetDate: "", phase: "", milestones: [""] });
        setShowAddGoal(false);
    };

    // Toggle goal expansion
    const toggleGoalExpand = (goalId: string) => {
        setExpandedGoals(prev => {
            const next = new Set(prev);
            if (next.has(goalId)) {
                next.delete(goalId);
            } else {
                next.add(goalId);
            }
            return next;
        });
    };

    // Update milestone status
    const updateMilestoneStatus = async (phaseId: string, goalId: string, milestoneId: string, newStatus: Milestone["status"]) => {
        const updatedPhases = phases.map(phase => {
            if (phase.id === phaseId) {
                return {
                    ...phase,
                    goals: phase.goals.map(goal => {
                        if (goal.id === goalId) {
                            const updatedMilestones = goal.milestones.map(m =>
                                m.id === milestoneId ? { ...m, status: newStatus } : m
                            );
                            const achievedCount = updatedMilestones.filter(m => m.status === "achieved").length;
                            const progress = Math.round((achievedCount / updatedMilestones.length) * 100);

                            return {
                                ...goal,
                                milestones: updatedMilestones,
                                progress,
                                status: progress === 100 ? "achieved" as const : goal.status
                            };
                        }
                        return goal;
                    })
                };
            }
            return phase;
        });

        setPhases(updatedPhases);

        if (startupId) {
            await setDoc(doc(db, "roadmaps", startupId), {
                phases: updatedPhases,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    };

    // Calculate overall progress
    const overallProgress = () => {
        const allGoals = phases.flatMap(p => p.goals);
        if (allGoals.length === 0) return 0;
        const totalProgress = allGoals.reduce((acc, g) => acc + g.progress, 0);
        return Math.round(totalProgress / allGoals.length);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-zinc-500">Loading roadmap...</span>
                </div>
            </div>
        );
    }

    const hasGoals = phases.some(p => p.goals.length > 0);

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Target className="w-8 h-8 text-indigo-500" />
                            Strategic Roadmap
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            Goal-oriented execution plan with milestones and dependencies
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode("timeline")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    viewMode === "timeline"
                                        ? "bg-white dark:bg-zinc-700 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                )}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    viewMode === "list"
                                        ? "bg-white dark:bg-zinc-700 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700"
                                )}
                            >
                                List
                            </button>
                        </div>

                        {!hasGoals ? (
                            <button
                                onClick={generateRoadmap}
                                disabled={generating}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate AI Roadmap
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAddGoal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add Goal
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Overview */}
                {hasGoals && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-zinc-500">Overall Progress</span>
                                <span className="text-2xl font-black text-indigo-500">{overallProgress()}%</span>
                            </div>
                            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${overallProgress()}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <Flag className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-bold text-zinc-500">Goals</span>
                            </div>
                            <div className="text-2xl font-black">
                                {phases.reduce((acc, p) => acc + p.goals.filter(g => g.status === "achieved").length, 0)}
                                <span className="text-zinc-400 text-lg"> / {phases.reduce((acc, p) => acc + p.goals.length, 0)}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-bold text-zinc-500">Active Phase</span>
                            </div>
                            <div className="text-xl font-black">
                                {phases.find(p => p.goals.some(g => g.status === "active"))?.title || "Foundation"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!hasGoals && !generating && (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Target className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-black mb-2">No Roadmap Yet</h2>
                        <p className="text-zinc-500 max-w-md mx-auto mb-8">
                            Generate an AI-powered roadmap based on your startup context, or create goals manually.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={generateRoadmap}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:scale-105 transition-all"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generate AI Roadmap
                            </button>
                            <button
                                onClick={() => setShowAddGoal(true)}
                                className="flex items-center gap-2 px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Create Manually
                            </button>
                        </div>
                    </div>
                )}

                {/* Timeline View */}
                {hasGoals && viewMode === "timeline" && (
                    <div className="space-y-6">
                        {phases.map((phase, phaseIndex) => (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: phaseIndex * 0.1 }}
                                className="relative"
                            >
                                {/* Phase Header */}
                                <div
                                    className={cn(
                                        "p-6 rounded-2xl cursor-pointer transition-all",
                                        selectedPhase === phase.id
                                            ? "bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800"
                                            : "bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900"
                                    )}
                                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black text-lg",
                                                phase.color
                                            )}>
                                                {phaseIndex + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg">{phase.title}</h3>
                                                <p className="text-sm text-zinc-500">{phase.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-zinc-400">Timeline</div>
                                                <div className="font-bold">
                                                    Month {phase.startMonth} - {phase.endMonth}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-zinc-400">Goals</div>
                                                <div className="font-bold">{phase.goals.length}</div>
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-5 h-5 text-zinc-400 transition-transform",
                                                selectedPhase === phase.id && "rotate-180"
                                            )} />
                                        </div>
                                    </div>
                                </div>

                                {/* Phase Goals */}
                                <AnimatePresence>
                                    {selectedPhase === phase.id && phase.goals.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 ml-8 pl-8 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-4"
                                        >
                                            {phase.goals.map((goal) => (
                                                <div
                                                    key={goal.id}
                                                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                                >
                                                    {/* Goal Header */}
                                                    <div
                                                        className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                                                        onClick={() => toggleGoalExpand(goal.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                                goal.status === "achieved"
                                                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                                                    : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                                                            )}>
                                                                {goal.status === "achieved"
                                                                    ? <CheckCircle2 className="w-5 h-5" />
                                                                    : <Target className="w-5 h-5" />
                                                                }
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold">{goal.title}</h4>
                                                                <p className="text-sm text-zinc-500">{goal.description}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {/* Progress */}
                                                                <div className="w-24">
                                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                                        <span className="text-zinc-400">Progress</span>
                                                                        <span className="font-bold text-indigo-500">{goal.progress}%</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                                                            style={{ width: `${goal.progress}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className={cn(
                                                                    "w-5 h-5 text-zinc-400 transition-transform",
                                                                    expandedGoals.has(goal.id) && "rotate-90"
                                                                )} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Milestones */}
                                                    <AnimatePresence>
                                                        {expandedGoals.has(goal.id) && goal.milestones.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-800/30"
                                                            >
                                                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                                                                    Milestones
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {goal.milestones.map((milestone) => (
                                                                        <div
                                                                            key={milestone.id}
                                                                            className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg"
                                                                        >
                                                                            <button
                                                                                onClick={() => updateMilestoneStatus(
                                                                                    phase.id,
                                                                                    goal.id,
                                                                                    milestone.id,
                                                                                    milestone.status === "achieved" ? "pending" : "achieved"
                                                                                )}
                                                                                className={cn(
                                                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                                                    milestone.status === "achieved"
                                                                                        ? "bg-green-500 border-green-500 text-white"
                                                                                        : "border-zinc-300 hover:border-indigo-500"
                                                                                )}
                                                                            >
                                                                                {milestone.status === "achieved" && (
                                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                            <span className={cn(
                                                                                "flex-1",
                                                                                milestone.status === "achieved" && "line-through text-zinc-400"
                                                                            )}>
                                                                                {milestone.title}
                                                                            </span>
                                                                            {milestone.dependsOn.length > 0 && (
                                                                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                                                    <LinkIcon className="w-3 h-3" />
                                                                                    {milestone.dependsOn.length} deps
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Empty phase state */}
                                {selectedPhase === phase.id && phase.goals.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 ml-8 pl-8 border-l-2 border-zinc-200 dark:border-zinc-800"
                                    >
                                        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-center">
                                            <p className="text-zinc-500 mb-4">No goals in this phase yet</p>
                                            <button
                                                onClick={() => {
                                                    setNewGoal(prev => ({ ...prev, phase: phase.id }));
                                                    setShowAddGoal(true);
                                                }}
                                                className="text-indigo-500 font-bold hover:text-indigo-600"
                                            >
                                                + Add Goal
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* List View */}
                {hasGoals && viewMode === "list" && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Goal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Phase</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Progress</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {phases.flatMap(phase => phase.goals.map(goal => (
                                    <tr key={goal.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{goal.title}</div>
                                            <div className="text-sm text-zinc-500">{goal.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                phase.id === "foundation" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                                phase.id === "validation" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                                                phase.id === "growth" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                                phase.id === "scale" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                            )}>
                                                {phase.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold">{goal.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                                goal.status === "achieved" && "bg-green-100 text-green-700",
                                                goal.status === "active" && "bg-blue-100 text-blue-700",
                                                goal.status === "abandoned" && "bg-zinc-100 text-zinc-700"
                                            )}>
                                                {goal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                                                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddGoal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setShowAddGoal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h2 className="text-xl font-black">Add New Goal</h2>
                                <button
                                    onClick={() => setShowAddGoal(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        Goal Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Launch MVP"
                                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        Description
                                    </label>
                                    <textarea
                                        value={newGoal.description}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe the goal..."
                                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                            Phase *
                                        </label>
                                        <select
                                            value={newGoal.phase}
                                            onChange={(e) => setNewGoal(prev => ({ ...prev, phase: e.target.value }))}
                                            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">Select phase</option>
                                            {phases.map(p => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                            Target Date
                                        </label>
                                        <input
                                            type="date"
                                            value={newGoal.targetDate}
                                            onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                                            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        Milestones
                                    </label>
                                    {newGoal.milestones.map((milestone, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={milestone}
                                                onChange={(e) => {
                                                    const updated = [...newGoal.milestones];
                                                    updated[i] = e.target.value;
                                                    setNewGoal(prev => ({ ...prev, milestones: updated }));
                                                }}
                                                placeholder={`Milestone ${i + 1}`}
                                                className="flex-1 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            {i === newGoal.milestones.length - 1 && (
                                                <button
                                                    onClick={() => setNewGoal(prev => ({ ...prev, milestones: [...prev.milestones, ""] }))}
                                                    className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddGoal(false)}
                                    className="px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddGoal}
                                    disabled={!newGoal.title || !newGoal.phase}
                                    className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50"
                                >
                                    Add Goal
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
