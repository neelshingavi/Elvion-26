"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Rocket,
    MessageSquare,
    Target,
    CheckCircle2,
    TrendingUp,
    Clock,
    BarChart3,
    ChevronRight,
    Sparkles,
    Brain,
    Search,
    Shield,
    Zap,
    FileText,
    Activity,
    RefreshCw,
    MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Startup, getStartup, getTasks, getMemories, Task } from "@/lib/startup-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPrimaryAction } from "@/lib/orchestrator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AISidekick } from "@/components/shared/AISidekick";

// Agent Configuration for UI
const AGENTS = [
    {
        id: "strategist",
        name: "Strategist",
        icon: Brain,
        color: "from-purple-500 to-indigo-500",
        description: "Strategic planning & pivots",
        capabilities: ["Pivot analysis", "Trade-offs", "Planning"]
    },
    {
        id: "researcher",
        name: "Researcher",
        icon: Search,
        color: "from-blue-500 to-cyan-500",
        description: "Market & competitor research",
        capabilities: ["Market data", "Competitors", "Trends"]
    },
    {
        id: "critic",
        name: "Critic",
        icon: Shield,
        color: "from-orange-500 to-red-500",
        description: "Assumption stress-testing",
        capabilities: ["Risk finding", "Edge cases", "Challenges"]
    },
    {
        id: "executor",
        name: "Executor",
        icon: Zap,
        color: "from-green-500 to-emerald-500",
        description: "Tasks & content generation",
        capabilities: ["Task creation", "Drafting", "Workflows"]
    }
];

interface DashboardMetrics {
    openTasks: number;
    completedThisWeek: number;
    memoryItems: number;
    validationScore: number | null;
    weeklyGoalProgress: number;
}

interface AgentActivity {
    agentId: string;
    action: string;
    timestamp: Date;
    status: "success" | "running" | "pending";
}

export default function DashboardPage() {
    const { user } = useAuth();

    // State
    const [startup, setStartup] = useState<Startup | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        openTasks: 0,
        completedThisWeek: 0,
        memoryItems: 0,
        validationScore: null,
        weeklyGoalProgress: 0
    });
    const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

    // Load dashboard data
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;

            try {
                // Get user's active startup
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const activeStartupId = userData?.activeStartupId;

                if (activeStartupId) {
                    const startupData = await getStartup(activeStartupId);
                    setStartup(startupData);

                    // Get tasks
                    const allTasks = await getTasks(activeStartupId);
                    setTasks(allTasks);

                    // Get memories
                    const memories = await getMemories(activeStartupId);

                    // Calculate metrics
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                    setMetrics({
                        openTasks: allTasks.filter(t => t.status === "pending").length,
                        completedThisWeek: allTasks.filter(t => {
                            if (t.status !== "done" || !t.completedAt) return false;
                            const completedAt = (t.completedAt as any).toDate ? (t.completedAt as any).toDate() : new Date(t.completedAt as any);
                            return completedAt > weekAgo;
                        }).length,
                        memoryItems: memories.length,
                        validationScore: null, // Would come from validation results
                        weeklyGoalProgress: Math.min(100, Math.round((allTasks.filter(t => t.status === "done").length / Math.max(1, allTasks.length)) * 100))
                    });

                    // Mock agent activities for demo
                    setAgentActivities([
                        {
                            agentId: "researcher",
                            action: "Analyzed competitor pricing data",
                            timestamp: new Date(Date.now() - 30 * 60 * 1000),
                            status: "success"
                        },
                        {
                            agentId: "critic",
                            action: "Flagged market size assumption",
                            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                            status: "success"
                        },
                        {
                            agentId: "executor",
                            action: "Generated 5 new tasks from roadmap",
                            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                            status: "success"
                        }
                    ]);
                }
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user]);

    // Get primary action based on startup stage
    const primaryAction = getPrimaryAction(startup);

    // Format relative time
    const formatRelativeTime = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-zinc-500">Loading your workspace...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505]">
            {/* Main Content */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            {startup?.name || "Your Startup"}
                            <span className={cn(
                                "px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full",
                                startup?.stage === "idea_submitted" ? "bg-yellow-100 text-yellow-700" :
                                    startup?.stage === "idea_validated" ? "bg-green-100 text-green-700" :
                                        startup?.stage === "roadmap_created" ? "bg-blue-100 text-blue-700" :
                                            "bg-zinc-100 text-zinc-700"
                            )}>
                                {startup?.stage?.replace(/_/g, " ") || "New Project"}
                            </span>
                        </h1>
                        <p className="text-zinc-500 text-sm max-w-xl">
                            {startup?.oneSentencePitch || startup?.idea || "Define your one-sentence pitch to get started"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                        >
                            <MessageSquare className="w-4 h-4" />
                            AI Sidekick
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        icon={Target}
                        label="Open Tasks"
                        value={metrics.openTasks}
                        color="indigo"
                        trend={metrics.openTasks > 5 ? "up" : null}
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Done This Week"
                        value={metrics.completedThisWeek}
                        color="green"
                    />
                    <MetricCard
                        icon={Brain}
                        label="Memory Items"
                        value={metrics.memoryItems}
                        color="purple"
                    />
                    <MetricCard
                        icon={BarChart3}
                        label="Weekly Progress"
                        value={`${metrics.weeklyGoalProgress}%`}
                        color="blue"
                        progress={metrics.weeklyGoalProgress}
                    />
                </div>

                {/* Primary Action Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 md:p-8 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-3xl text-white relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-widest opacity-80">
                                    Recommended Action
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black">
                                {primaryAction.label}
                            </h2>
                            <p className="text-white/80 max-w-lg">
                                {primaryAction.description}
                            </p>
                        </div>

                        <Link
                            href={`/founder/${primaryAction.agentType}`}
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shrink-0"
                        >
                            {primaryAction.label.includes("Validate") && <Rocket className="w-5 h-5" />}
                            {primaryAction.label.includes("Roadmap") && <Target className="w-5 h-5" />}
                            {primaryAction.label.includes("Task") && <Zap className="w-5 h-5" />}
                            Start Now
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-5 gap-6">
                    {/* Left Column - Agent Ecosystem */}
                    <div className="md:col-span-3 space-y-6">
                        {/* AI Agent Grid */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-black text-lg">AI Co-Founders</h3>
                                    <p className="text-sm text-zinc-500">Your specialized agent team</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    All systems operational
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {AGENTS.map((agent) => {
                                    const recentActivity = agentActivities.find(a => a.agentId === agent.id);

                                    return (
                                        <motion.button
                                            key={agent.id}
                                            onClick={() => setSelectedAgent(agent.id)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={cn(
                                                "p-4 rounded-2xl border text-left transition-all group",
                                                selectedAgent === agent.id
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
                                                    agent.color
                                                )}>
                                                    <agent.icon className="w-5 h-5" />
                                                </div>
                                                <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full text-xs font-bold">
                                                    Ready
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-sm">{agent.name}</h4>
                                            <p className="text-xs text-zinc-500 mb-3">{agent.description}</p>

                                            {recentActivity && (
                                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                                    <p className="text-xs text-zinc-400 truncate">
                                                        {recentActivity.action}
                                                    </p>
                                                    <p className="text-xs text-zinc-300">
                                                        {formatRelativeTime(recentActivity.timestamp)}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-black text-lg">Task Queue</h3>
                                    <p className="text-sm text-zinc-500">Your pending work items</p>
                                </div>
                                <Link
                                    href="/founder/tasks"
                                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                >
                                    View All <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {tasks.filter(t => t.status === "pending").slice(0, 5).map((task, i) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold",
                                            task.priority === "high" || task.priority === "critical" ? "bg-red-500" :
                                                task.priority === "medium" ? "bg-yellow-500" :
                                                    "bg-green-500"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{task.title}</h4>
                                            <p className="text-xs text-zinc-500 truncate">
                                                {task.description || task.instruction || "No description"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.createdByAgent && (
                                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-bold rounded-full">
                                                    AI
                                                </span>
                                            )}
                                            <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                ))}

                                {tasks.filter(t => t.status === "pending").length === 0 && (
                                    <div className="py-12 text-center text-zinc-400">
                                        <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No pending tasks</p>
                                        <p className="text-xs">Create tasks from your roadmap</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Activity & Intelligence */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                            <h3 className="font-black text-lg mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickActionButton
                                    icon={FileText}
                                    label="Canvas"
                                    href="/founder/canvas"
                                />
                                <QuickActionButton
                                    icon={Target}
                                    label="Roadmap"
                                    href="/founder/roadmap"
                                />
                                <QuickActionButton
                                    icon={BarChart3}
                                    label="Validate"
                                    href="/founder/idea-validation"
                                />
                                <QuickActionButton
                                    icon={Search}
                                    label="Research"
                                    href="/founder/market-intel"
                                />
                            </div>
                        </div>

                        {/* Agent Activity Feed */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-lg">Agent Activity</h3>
                                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                                    <RefreshCw className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {agentActivities.map((activity, i) => {
                                    const agent = AGENTS.find(a => a.id === activity.agentId);
                                    if (!agent) return null;

                                    return (
                                        <div key={i} className="flex gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                                                agent.color
                                            )}>
                                                <agent.icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">{activity.action}</p>
                                                <p className="text-xs text-zinc-400">
                                                    {agent.name} • {formatRelativeTime(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {agentActivities.length === 0 && (
                                    <div className="py-8 text-center text-zinc-400">
                                        <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* First 48 Hours Progress */}
                        {startup?.first48HoursPlan && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl border border-amber-200 dark:border-amber-800/50 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-black text-lg text-amber-900 dark:text-amber-100">
                                        First 48 Hours
                                    </h3>
                                </div>

                                <div className="relative pt-2">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                                            Progress
                                        </span>
                                        <span className="text-amber-900 dark:text-amber-100 font-black">
                                            {startup.first48HoursPlan.completionPercentage || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                            style={{ width: `${startup.first48HoursPlan.completionPercentage || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <Link
                                    href="/founder/tasks?filter=first48"
                                    className="mt-4 flex items-center justify-center gap-2 py-3 bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-200 rounded-xl text-sm font-bold hover:bg-amber-200 dark:hover:bg-amber-800 transition-all"
                                >
                                    View Tasks
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Sidekick Panel */}
            <AISidekick 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                startupId={startup?.startupId || ""} 
                userId={user?.uid || ""} 
            />
        </div>
    );
}

// Metric Card Component
function MetricCard({
    icon: Icon,
    label,
    value,
    color,
    trend,
    progress
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    trend?: "up" | "down" | null;
    progress?: number;
}) {
    const colorClasses: Record<string, string> = {
        indigo: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
        green: "text-green-500 bg-green-100 dark:bg-green-900/30",
        purple: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
        blue: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
        amber: "text-amber-500 bg-amber-100 dark:bg-amber-900/30"
    };

    return (
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClasses[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <TrendingUp className={cn(
                        "w-4 h-4",
                        trend === "up" ? "text-green-500" : "text-red-500"
                    )} />
                )}
            </div>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs text-zinc-500 font-medium">{label}</div>
            {progress !== undefined && (
                <div className="mt-3 w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// Quick Action Button
function QuickActionButton({
    icon: Icon,
    label,
    href
}: {
    icon: React.ElementType;
    label: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all text-center"
        >
            <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-bold">{label}</span>
        </Link>
    );
}
