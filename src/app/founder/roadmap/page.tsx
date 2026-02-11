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
        color: "bg-info",
        goals: []
    },
    {
        id: "validation",
        title: "Validation",
        description: "Product-market fit experiments",
        startMonth: 3,
        endMonth: 6,
        color: "bg-primary",
        goals: []
    },
    {
        id: "growth",
        title: "Growth",
        description: "Scale what works",
        startMonth: 6,
        endMonth: 12,
        color: "bg-success",
        goals: []
    },
    {
        id: "scale",
        title: "Scale",
        description: "Market expansion",
        startMonth: 12,
        endMonth: 24,
        color: "bg-warning",
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
                    } else if (data.generatedRoadmap?.roadmap) {
                        const updatedPhases = DEFAULT_PHASES.map(phase => ({
                            ...phase,
                            goals: data.generatedRoadmap.roadmap?.[phase.id]?.goals || []
                        }));
                        setPhases(updatedPhases);
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
        if (!user) {
            console.error("User not authenticated.");
            return;
        }

        setGenerating(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/generate-roadmap", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    startupId,
                    idea: startup.idea || startup.oneSentencePitch,
                    industry: startup.industry,
                    stage: startup.stage
                })
            });

            const data = await response.json();
            if (response.ok) {

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
                        startupId,
                        phases: updatedPhases,
                        generatedAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                }
            } else {
                throw new Error(data?.error?.message || "Failed to generate roadmap");
            }
        } catch (error) {
            console.error("Error generating roadmap:", error);
        } finally {
            setGenerating(false);
        }
    };

    // Add new goal
    const handleAddGoal = async () => {
        if (!newGoal.title || !newGoal.phase || !newGoal.targetDate || !startupId) return;

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
            startupId,
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
                            const progress = updatedMilestones.length === 0 ? 0 : Math.round((achievedCount / updatedMilestones.length) * 100);

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
                startupId,
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
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted">Loading roadmap...</span>
                </div>
            </div>
        );
    }

    const hasGoals = phases.some(p => p.goals.length > 0);

    return (
        <div className="min-h-screen bg-app p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-h1 flex items-center gap-3">
                            <Target className="w-8 h-8 text-primary" />
                            Strategic Roadmap
                        </h1>
                        <p className="text-muted mt-1">
                            Goal-oriented execution plan with milestones and dependencies
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-surface-alt rounded-xl p-1">
                            <button
                                onClick={() => setViewMode("timeline")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    viewMode === "timeline"
                                        ? "bg-surface  shadow-sm"
                                        : "text-muted hover:text-muted"
                                )}
                            >
                                Timeline
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    viewMode === "list"
                                        ? "bg-surface  shadow-sm"
                                        : "text-muted hover:text-muted"
                                )}
                            >
                                List
                            </button>
                        </div>

                        {!hasGoals ? (
                            <button
                                onClick={generateRoadmap}
                                disabled={generating}
                                className="btn-primary text-sm hover:scale-105 transition-all disabled:opacity-50 px-6 py-3"
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
                                className="btn-secondary text-sm hover:scale-105 transition-all px-4 py-2"
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
                        <div className="md:col-span-2 card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-muted">Overall Progress</span>
                                <span className="text-2xl font-black text-primary">{overallProgress()}%</span>
                            </div>
                            <div className="w-full h-4 bg-surface-alt rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${overallProgress()}%` }}
                                />
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Flag className="w-5 h-5 text-success" />
                                <span className="text-sm font-bold text-muted">Goals</span>
                            </div>
                            <div className="text-2xl font-black">
                                {phases.reduce((acc, p) => acc + p.goals.filter(g => g.status === "achieved").length, 0)}
                                <span className="text-subtle text-lg"> / {phases.reduce((acc, p) => acc + p.goals.length, 0)}</span>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-info" />
                                <span className="text-sm font-bold text-muted">Active Phase</span>
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
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-soft flex items-center justify-center">
                                <Target className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-h2 text-strong mb-2">No Roadmap Yet</h2>
                            <p className="text-muted max-w-md mx-auto mb-8">
                                Generate an AI-powered roadmap based on your startup context, or create goals manually.
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={generateRoadmap}
                                    className="btn-primary hover:scale-105 transition-all px-6 py-3"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Generate AI Roadmap
                                </button>
                                <button
                                    onClick={() => setShowAddGoal(true)}
                                    className="btn-secondary px-6 py-3"
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
                                            ? "bg-surface  shadow-lg border border-subtle "
                                            : "bg-surface-alt hover:bg-surface"
                                    )}
                                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 radius-control flex items-center justify-center text-on-primary font-black text-lg",
                                                phase.color
                                            )}>
                                                {phaseIndex + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg">{phase.title}</h3>
                                                <p className="text-sm text-muted">{phase.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-subtle">Timeline</div>
                                                <div className="font-bold">
                                                    Month {phase.startMonth} - {phase.endMonth}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-subtle">Goals</div>
                                                <div className="font-bold">{phase.goals.length}</div>
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-5 h-5 text-subtle transition-transform",
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
                                        className="mt-4 ml-8 pl-8 border-l-2 border-subtle space-y-4"
                                        >
                                            {phase.goals.map((goal) => (
                                                <div
                                                    key={goal.id}
                                                    className="bg-surface rounded-xl border border-subtle overflow-hidden"
                                                >
                                                    {/* Goal Header */}
                                                    <div
                                                        className="p-4 cursor-pointer hover:bg-surface-alt transition-all"
                                                        onClick={() => toggleGoalExpand(goal.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                                goal.status === "achieved"
                                                                    ? "bg-success-soft text-success"
                                                                    : "bg-primary-soft text-primary"
                                                            )}>
                                                                {goal.status === "achieved"
                                                                    ? <CheckCircle2 className="w-5 h-5" />
                                                                    : <Target className="w-5 h-5" />
                                                                }
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold">{goal.title}</h4>
                                                                <p className="text-sm text-muted">{goal.description}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {/* Progress */}
                                                                <div className="w-24">
                                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                                        <span className="text-subtle">Progress</span>
                                                                        <span className="font-bold text-primary">{goal.progress}%</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-primary rounded-full transition-all"
                                                                            style={{ width: `${goal.progress}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className={cn(
                                                                    "w-5 h-5 text-subtle transition-transform",
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
                                                                className="border-t border-subtle p-4 bg-surface-alt"
                                                            >
                                                                <p className="text-xs font-bold uppercase tracking-widest text-subtle mb-3">
                                                                    Milestones
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {goal.milestones.map((milestone) => (
                                                                        <div
                                                                            key={milestone.id}
                                                                            className="flex items-center gap-3 p-3 bg-surface rounded-lg"
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
                                                                                        ? "bg-success border-success text-on-primary"
                                                                                        : "border-subtle hover:border-primary"
                                                                                )}
                                                                            >
                                                                                {milestone.status === "achieved" && (
                                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                            <span className={cn(
                                                                                "flex-1",
                                                                                milestone.status === "achieved" && "line-through text-subtle"
                                                                            )}>
                                                                                {milestone.title}
                                                                            </span>
                                                                            {milestone.dependsOn.length > 0 && (
                                                                                <span className="text-xs text-subtle flex items-center gap-1">
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
                                        className="mt-4 ml-8 pl-8 border-l-2 border-subtle"
                                    >
                                        <div className="p-8 bg-surface-alt rounded-xl text-center">
                                            <p className="text-muted mb-4">No goals in this phase yet</p>
                                            <button
                                                onClick={() => {
                                                    setNewGoal(prev => ({ ...prev, phase: phase.id }));
                                                    setShowAddGoal(true);
                                                }}
                                                className="text-primary font-bold hover:text-primary"
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
                    <div className="card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-surface-alt">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted">Goal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted">Phase</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted">Progress</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-muted">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-subtle">
                                {phases.flatMap(phase => phase.goals.map(goal => (
                                    <tr key={goal.id} className="hover:bg-surface-alt">
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{goal.title}</div>
                                            <div className="text-sm text-muted">{goal.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                phase.id === "foundation" && "bg-info-soft text-info",
                                                phase.id === "validation" && "bg-primary-soft text-primary",
                                                phase.id === "growth" && "bg-success-soft text-success",
                                                phase.id === "scale" && "bg-warning-soft text-warning"
                                            )}>
                                                {phase.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-2 bg-surface-alt rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold">{goal.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                                goal.status === "achieved" && "bg-success-soft text-success",
                                                goal.status === "active" && "bg-info-soft text-info",
                                                goal.status === "abandoned" && "bg-surface-alt text-muted"
                                            )}>
                                                {goal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-surface-alt rounded-lg">
                                                <MoreHorizontal className="w-4 h-4 text-subtle" />
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
                            className="fixed inset-0 bg-overlay z-40"
                            onClick={() => setShowAddGoal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg modal z-50"
                        >
                            <div className="p-6 border-b border-subtle flex items-center justify-between">
                                <h2 className="text-xl font-black">Add New Goal</h2>
                                <button
                                    onClick={() => setShowAddGoal(false)}
                                    className="p-2 hover:bg-surface-alt rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">
                                        Goal Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Launch MVP"
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">
                                        Description
                                    </label>
                                    <textarea
                                        value={newGoal.description}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe the goal..."
                                        className="input h-20 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">
                                            Phase *
                                        </label>
                                        <select
                                            value={newGoal.phase}
                                            onChange={(e) => setNewGoal(prev => ({ ...prev, phase: e.target.value }))}
                                            className="select"
                                        >
                                            <option value="">Select phase</option>
                                            {phases.map(p => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">
                                            Target Date
                                        </label>
                                        <input
                                            type="date"
                                            value={newGoal.targetDate}
                                            onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">
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
                                                className="input flex-1"
                                            />
                                            {i === newGoal.milestones.length - 1 && (
                                                <button
                                                    onClick={() => setNewGoal(prev => ({ ...prev, milestones: [...prev.milestones, ""] }))}
                                                    className="p-3 bg-surface-alt rounded-xl hover:bg-surface"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-subtle flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddGoal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddGoal}
                                    disabled={!newGoal.title || !newGoal.phase}
                                    className="btn-primary disabled:opacity-50"
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
